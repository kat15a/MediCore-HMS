package com.hospital.hms.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.hms.ai.AiProvider;
import com.hospital.hms.dto.request.ChatRequest;
import com.hospital.hms.dto.request.SymptomCheckRequest;
import com.hospital.hms.dto.response.ChatResponse;
import com.hospital.hms.dto.response.ReportSummaryResponse;
import com.hospital.hms.dto.response.SymptomCheckResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.exception.AiServiceException;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.LabReportService;
import com.hospital.hms.service.PrescriptionService;
import com.hospital.hms.util.PdfTextExtractorUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceImplTest {

    @Mock private AiProvider aiProvider;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private PrescriptionService prescriptionService;
    @Mock private LabReportService labReportService;
    @Mock private UserRepository userRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private PdfTextExtractorUtil pdfTextExtractorUtil;

    private AiServiceImpl aiService;

    @BeforeEach
    void setUp() {
        // Real ObjectMapper (not mocked) so the JSON-parsing logic under test is exercised for real.
        ObjectMapper objectMapper = new ObjectMapper();
        aiService = new AiServiceImpl(
                aiProvider, objectMapper, departmentRepository, prescriptionRepository,
                prescriptionService, labReportService, userRepository, doctorRepository, pdfTextExtractorUtil);
    }

    @Test
    void checkSymptoms_parsesJson_evenWhenWrappedInMarkdownFences() {
        when(departmentRepository.findAll()).thenReturn(List.of(
                Department.builder().id(1L).name("Cardiology").build()));
        String fencedJson = "```json\n" + """
                {
                  "possibleConditions": ["Angina", "Muscle strain"],
                  "recommendedDepartment": "Cardiology",
                  "urgencyLevel": "medium",
                  "suggestedQuestions": ["When did the pain start?"],
                  "redFlagSymptoms": ["Shortness of breath"]
                }
                """ + "\n```";
        when(aiProvider.complete(anyString(), anyString())).thenReturn(fencedJson);

        SymptomCheckResponse response = aiService.checkSymptoms(
                SymptomCheckRequest.builder().symptoms("Chest pain").build());

        assertThat(response.getPossibleConditions()).containsExactly("Angina", "Muscle strain");
        assertThat(response.getRecommendedDepartment()).isEqualTo("Cardiology");
        assertThat(response.getUrgencyLevel()).isEqualTo("MEDIUM"); // normalized to uppercase
        assertThat(response.getRedFlagSymptoms()).containsExactly("Shortness of breath");
        assertThat(response.getDisclaimer()).contains("not a medical diagnosis");
    }

    @Test
    void checkSymptoms_throwsAiServiceException_whenModelReturnsUnparsableText() {
        when(departmentRepository.findAll()).thenReturn(List.of());
        when(aiProvider.complete(anyString(), anyString())).thenReturn("Sorry, I can't help with that.");

        assertThatThrownBy(() -> aiService.checkSymptoms(SymptomCheckRequest.builder().symptoms("headache").build()))
                .isInstanceOf(AiServiceException.class);
    }

    @Test
    void summarizeReportText_savesSummaryToLabReport_whenLabReportIdProvided() {
        when(aiProvider.complete(anyString(), anyString())).thenReturn("""
                {
                  "summary": "Routine bloodwork, mostly normal.",
                  "abnormalFindings": ["Slightly elevated WBC count"],
                  "plainLanguageExplanation": "Your white blood cell count is a little high."
                }
                """);

        ReportSummaryResponse response = aiService.summarizeReportText("raw report text", 42L);

        assertThat(response.getAbnormalFindings()).containsExactly("Slightly elevated WBC count");
        assertThat(response.getSavedToLabReport()).isTrue();
        verify(labReportService).attachAiSummary(eq(42L), anyString());
    }

    @Test
    void summarizeReportText_doesNotSave_whenNoLabReportIdProvided() {
        when(aiProvider.complete(anyString(), anyString())).thenReturn("""
                {"summary": "ok", "abnormalFindings": [], "plainLanguageExplanation": "all normal"}
                """);

        ReportSummaryResponse response = aiService.summarizeReportText("raw report text", null);

        assertThat(response.getSavedToLabReport()).isFalse();
        verifyNoInteractions(labReportService);
    }

    @Test
    void explainPrescription_throwsUnauthorizedException_whenPatientRequestsSomeoneElsesPrescription() {
        Role patientRole = Role.builder().id(4L).name(Role.PATIENT).build();
        User owner = User.builder().id(1L).build();
        User requester = User.builder().id(2L).role(patientRole).build();

        Patient patientOwner = Patient.builder().id(1L).user(owner).build();
        Prescription prescription = Prescription.builder().id(10L).patient(patientOwner).items(List.of()).build();

        when(prescriptionRepository.findById(10L)).thenReturn(Optional.of(prescription));
        when(userRepository.findById(2L)).thenReturn(Optional.of(requester));

        assertThatThrownBy(() -> aiService.explainPrescription(10L, 2L))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("your own prescriptions");

        verifyNoInteractions(aiProvider);
    }

    @Test
    void explainPrescription_throwsAiServiceException_whenPrescriptionHasNoItems() {
        Role adminRole = Role.builder().id(1L).name(Role.ADMIN).build();
        User admin = User.builder().id(5L).role(adminRole).build();
        Prescription prescription = Prescription.builder().id(11L)
                .patient(Patient.builder().id(1L).user(User.builder().id(1L).build()).build())
                .items(List.of())
                .build();

        when(prescriptionRepository.findById(11L)).thenReturn(Optional.of(prescription));
        when(userRepository.findById(5L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> aiService.explainPrescription(11L, 5L))
                .isInstanceOf(AiServiceException.class)
                .hasMessageContaining("no medicines");
    }

    @Test
    void explainPrescription_succeeds_forAdmin_regardlessOfOwnership() {
        Role adminRole = Role.builder().id(1L).name(Role.ADMIN).build();
        User admin = User.builder().id(5L).role(adminRole).build();

        Medicine medicine = Medicine.builder().id(1L).name("Amoxicillin").build();
        PrescriptionItem item = PrescriptionItem.builder().medicine(medicine).dosage("500mg").frequency("2x/day").build();
        Prescription prescription = Prescription.builder()
                .id(12L).diagnosis("Infection")
                .patient(Patient.builder().id(1L).user(User.builder().id(1L).build()).build())
                .items(List.of(item))
                .build();

        when(prescriptionRepository.findById(12L)).thenReturn(Optional.of(prescription));
        when(userRepository.findById(5L)).thenReturn(Optional.of(admin));
        when(aiProvider.complete(anyString(), anyString())).thenReturn("""
                {
                  "overallSummary": "One antibiotic prescribed for infection.",
                  "medicines": [
                    {
                      "medicineName": "Amoxicillin",
                      "purpose": "Treats bacterial infections",
                      "commonSideEffects": "Nausea, rash",
                      "dosageGuidance": "Take as directed, twice daily",
                      "precautions": "Complete the full course"
                    }
                  ]
                }
                """);

        var response = aiService.explainPrescription(12L, 5L);

        assertThat(response.getMedicines()).hasSize(1);
        assertThat(response.getMedicines().get(0).getMedicineName()).isEqualTo("Amoxicillin");
        verify(prescriptionService).attachAiSummary(eq(12L), anyString());
    }

    @Test
    void chat_includesRealDepartmentAndDoctorData_inThePrompt() {
        when(departmentRepository.findAll()).thenReturn(List.of(Department.builder().id(1L).name("Pediatrics").build()));
        when(doctorRepository.count()).thenReturn(7L);
        when(aiProvider.complete(anyString(), anyString())).thenReturn("We're open 8am-8pm Monday to Saturday.");

        ChatResponse response = aiService.chat(ChatRequest.builder().message("What are your hours?").build());

        assertThat(response.getReply()).contains("8am-8pm");
        verify(aiProvider).complete(anyString(), contains("Pediatrics"));
    }
}
