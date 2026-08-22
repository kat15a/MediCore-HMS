package com.hospital.hms.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.hms.ai.AiProvider;
import com.hospital.hms.dto.request.ChatRequest;
import com.hospital.hms.dto.request.SymptomCheckRequest;
import com.hospital.hms.dto.response.*;
import com.hospital.hms.entity.Department;
import com.hospital.hms.entity.Prescription;
import com.hospital.hms.entity.PrescriptionItem;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.AiServiceException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.repository.DepartmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PrescriptionRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.service.AiService;
import com.hospital.hms.service.LabReportService;
import com.hospital.hms.service.PrescriptionService;
import com.hospital.hms.util.PdfTextExtractorUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private static final String MEDICAL_DISCLAIMER =
            "This tool provides general information only and is not a medical diagnosis. " +
            "It does not replace professional medical advice. If you are experiencing a medical " +
            "emergency, call your local emergency number or go to the nearest emergency room immediately.";

    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper;
    private final DepartmentRepository departmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionService prescriptionService;
    private final LabReportService labReportService;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PdfTextExtractorUtil pdfTextExtractorUtil;

    // -------------------------------------------------------------------
    // Symptom Checker
    // -------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public SymptomCheckResponse checkSymptoms(SymptomCheckRequest request) {
        List<String> departmentNames = departmentRepository.findAll().stream()
                .map(Department::getName)
                .collect(Collectors.toList());

        String systemPrompt = """
                You are a clinical triage assistant for a hospital's patient-facing app. You never
                diagnose. You help a patient understand what their symptoms might indicate and which
                hospital department they should consider visiting, and you flag anything urgent.
                Always respond with STRICT JSON only, no markdown fences, no commentary, matching
                exactly this schema:
                {
                  "possibleConditions": ["string", ...],
                  "recommendedDepartment": "one of the department names given by the user",
                  "urgencyLevel": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
                  "suggestedQuestions": ["question the doctor should ask", ...],
                  "redFlagSymptoms": ["symptom that would need immediate care", ...]
                }
                Keep each list to at most 5 items. If symptoms suggest a life-threatening emergency
                (e.g. chest pain with shortness of breath, stroke signs, severe bleeding), set
                urgencyLevel to "EMERGENCY".
                """;

        String userPrompt = """
                Available departments: %s
                Patient age: %s
                Patient gender: %s
                Relevant medical history: %s
                Symptoms described by the patient: "%s"
                """.formatted(
                String.join(", ", departmentNames),
                request.getAge() != null ? request.getAge() : "not provided",
                request.getGender() != null ? request.getGender() : "not provided",
                request.getMedicalHistory() != null && !request.getMedicalHistory().isBlank()
                        ? request.getMedicalHistory() : "none provided",
                request.getSymptoms());

        JsonNode json = callAndParseJson(systemPrompt, userPrompt);

        return SymptomCheckResponse.builder()
                .possibleConditions(textArray(json, "possibleConditions"))
                .recommendedDepartment(textOrDefault(json, "recommendedDepartment", "General Medicine"))
                .urgencyLevel(textOrDefault(json, "urgencyLevel", "MEDIUM").toUpperCase())
                .suggestedQuestions(textArray(json, "suggestedQuestions"))
                .redFlagSymptoms(textArray(json, "redFlagSymptoms"))
                .disclaimer(MEDICAL_DISCLAIMER)
                .build();
    }

    // -------------------------------------------------------------------
    // Medical Report Summarizer
    // -------------------------------------------------------------------

    @Override
    public ReportSummaryResponse summarizeReportText(String reportText, Long labReportId) {
        String systemPrompt = """
                You are a medical report summarizer for a patient-facing hospital app. Given raw lab
                or diagnostic report text, explain it in plain, reassuring, non-alarming language a
                non-medical person can understand. Highlight any values that are flagged as outside
                the normal/reference range. Respond with STRICT JSON only, no markdown fences, matching
                exactly this schema:
                {
                  "summary": "2-4 sentence overview of what this report covers and shows",
                  "abnormalFindings": ["short description of each out-of-range value found, or empty array if none"],
                  "plainLanguageExplanation": "a longer, friendly explanation a patient without medical training can follow"
                }
                """;

        String userPrompt = "Report text:\n" + reportText;

        JsonNode json = callAndParseJson(systemPrompt, userPrompt);

        boolean saved = false;
        if (labReportId != null) {
            String combined = textOrDefault(json, "summary", "") + "\n\n" + textOrDefault(json, "plainLanguageExplanation", "");
            labReportService.attachAiSummary(labReportId, combined.trim());
            saved = true;
        }

        return ReportSummaryResponse.builder()
                .summary(textOrDefault(json, "summary", ""))
                .abnormalFindings(textArray(json, "abnormalFindings"))
                .plainLanguageExplanation(textOrDefault(json, "plainLanguageExplanation", ""))
                .savedToLabReport(saved)
                .build();
    }

    @Override
    public ReportSummaryResponse summarizeReportPdf(MultipartFile file, Long labReportId) {
        String extractedText = pdfTextExtractorUtil.extractText(file);
        return summarizeReportText(extractedText, labReportId);
    }

    // -------------------------------------------------------------------
    // Prescription Explanation
    // -------------------------------------------------------------------

    @Override
    @Transactional
    public PrescriptionExplanationResponse explainPrescription(Long prescriptionId, Long requestingUserId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> ResourceNotFoundException.of("Prescription", prescriptionId));

        assertCanViewPrescription(prescription, requestingUserId);

        List<PrescriptionItem> items = prescription.getItems();
        if (items.isEmpty()) {
            throw new AiServiceException("This prescription has no medicines to explain");
        }

        String medicineList = items.stream()
                .map(i -> "- %s (%s, %s%s)".formatted(
                        i.getMedicine().getName(),
                        i.getDosage() != null ? i.getDosage() : "dosage not specified",
                        i.getFrequency() != null ? i.getFrequency() : "frequency not specified",
                        i.getDurationDays() != null ? ", " + i.getDurationDays() + " days" : ""))
                .collect(Collectors.joining("\n"));

        String systemPrompt = """
                You are a pharmacist assistant explaining a prescription to a patient in plain language.
                For each medicine, explain what it's generally used for, common side effects, general
                dosage guidance, and precautions to be aware of. Do not invent brand-specific dosing
                beyond what's reasonable general knowledge; keep it general and safe. Respond with
                STRICT JSON only, no markdown fences, matching exactly this schema:
                {
                  "overallSummary": "1-2 sentence friendly overview of this prescription as a whole",
                  "medicines": [
                    {
                      "medicineName": "string",
                      "purpose": "what it's generally used for",
                      "commonSideEffects": "short comma-separated list or sentence",
                      "dosageGuidance": "general guidance in plain language, deferring to the prescribed instructions",
                      "precautions": "things to watch for or avoid"
                    }
                  ]
                }
                """;

        String userPrompt = "Diagnosis: " + (prescription.getDiagnosis() != null ? prescription.getDiagnosis() : "not specified") +
                "\nPrescribed medicines:\n" + medicineList;

        JsonNode json = callAndParseJson(systemPrompt, userPrompt);

        List<PrescriptionExplanationResponse.MedicineExplanation> medicineExplanations = new ArrayList<>();
        JsonNode medsNode = json.path("medicines");
        if (medsNode.isArray()) {
            for (JsonNode m : medsNode) {
                medicineExplanations.add(PrescriptionExplanationResponse.MedicineExplanation.builder()
                        .medicineName(textOrDefault(m, "medicineName", ""))
                        .purpose(textOrDefault(m, "purpose", ""))
                        .commonSideEffects(textOrDefault(m, "commonSideEffects", ""))
                        .dosageGuidance(textOrDefault(m, "dosageGuidance", ""))
                        .precautions(textOrDefault(m, "precautions", ""))
                        .build());
            }
        }

        String overallSummary = textOrDefault(json, "overallSummary", "");

        // Persist a compact version onto the prescription so it's visible without another AI call.
        String storedSummary = overallSummary + "\n\n" + medicineExplanations.stream()
                .map(m -> "%s — %s".formatted(m.getMedicineName(), m.getPurpose()))
                .collect(Collectors.joining("\n"));
        prescriptionService.attachAiSummary(prescriptionId, storedSummary.trim());

        return PrescriptionExplanationResponse.builder()
                .overallSummary(overallSummary)
                .medicines(medicineExplanations)
                .build();
    }

    // -------------------------------------------------------------------
    // Hospital Chatbot
    // -------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public ChatResponse chat(ChatRequest request) {
        List<String> departmentNames = departmentRepository.findAll().stream()
                .map(Department::getName)
                .collect(Collectors.toList());
        long doctorCount = doctorRepository.count();

        String systemPrompt = """
                You are MediCore's friendly hospital front-desk chatbot. You answer questions about
                hospital hours, departments, doctors, and how to book or manage appointments. Hospital
                hours are Monday-Saturday 8:00 AM - 8:00 PM, Emergency department is open 24/7. Keep
                answers short (2-4 sentences), warm, and practical. If asked something clinical (like
                diagnosing symptoms), politely redirect the patient to the AI Symptom Checker or to book
                an appointment — do not attempt to diagnose. If you don't know something specific to
                this hospital, say so plainly rather than inventing details. Respond in plain text, not JSON.
                """;

        StringBuilder context = new StringBuilder();
        context.append("Departments available: ").append(String.join(", ", departmentNames)).append("\n");
        context.append("Number of doctors on staff: ").append(doctorCount).append("\n\n");

        if (request.getHistory() != null) {
            for (ChatRequest.ChatTurn turn : request.getHistory()) {
                context.append(turn.getRole()).append(": ").append(turn.getContent()).append("\n");
            }
        }
        context.append("user: ").append(request.getMessage());

        String reply = aiProvider.complete(systemPrompt, context.toString());
        return ChatResponse.builder().reply(reply.trim()).build();
    }

    // -------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------

    private void assertCanViewPrescription(Prescription prescription, Long requestingUserId) {
        if (requestingUserId == null) {
            return; // internal/system call
        }
        User requester = userRepository.findById(requestingUserId).orElse(null);
        if (requester == null) {
            return;
        }
        String role = requester.getRole().getName();
        if (Role.ADMIN.equals(role) || Role.RECEPTIONIST.equals(role)) {
            return;
        }
        if (Role.PATIENT.equals(role) && !prescription.getPatient().getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("You can only view explanations for your own prescriptions");
        }
        if (Role.DOCTOR.equals(role) && !prescription.getDoctor().getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("You can only explain prescriptions you wrote");
        }
    }

    private JsonNode callAndParseJson(String systemPrompt, String userPrompt) {
        String raw = aiProvider.complete(systemPrompt, userPrompt);
        String cleaned = stripMarkdownFences(raw);
        try {
            return objectMapper.readTree(cleaned);
        } catch (Exception ex) {
            log.error("Could not parse AI JSON response: {}", raw);
            throw new AiServiceException("The AI service returned a response we couldn't understand. Please try again.");
        }
    }

    private String stripMarkdownFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```[a-zA-Z]*\\s*", "");
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }

    private List<String> textArray(JsonNode node, String field) {
        JsonNode arr = node.path(field);
        if (!arr.isArray()) {
            return List.of();
        }
        return StreamSupport.stream(Spliterators.spliteratorUnknownSize(arr.elements(), Spliterator.ORDERED), false)
                .map(JsonNode::asText)
                .collect(Collectors.toList());
    }

    private String textOrDefault(JsonNode node, String field, String defaultValue) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? defaultValue : value.asText(defaultValue);
    }
}
