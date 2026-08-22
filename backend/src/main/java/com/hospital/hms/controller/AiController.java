package com.hospital.hms.controller;

import com.hospital.hms.dto.request.ChatRequest;
import com.hospital.hms.dto.request.ReportSummaryRequest;
import com.hospital.hms.dto.request.SymptomCheckRequest;
import com.hospital.hms.dto.response.*;
import com.hospital.hms.service.AiService;
import com.hospital.hms.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI Tools", description = "Symptom checker, report summarizer, prescription explainer, hospital chatbot")
public class AiController {

    private final AiService aiService;
    private final SecurityUtil securityUtil;

    @PostMapping("/symptom-check")
    @Operation(summary = "Check symptoms and get possible conditions, urgency, and department guidance")
    public ApiResponse<SymptomCheckResponse> checkSymptoms(@Valid @RequestBody SymptomCheckRequest request) {
        return ApiResponse.success(aiService.checkSymptoms(request));
    }

    @PostMapping("/reports/summarize-text")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Operation(summary = "Summarize pasted lab/report text in plain language")
    public ApiResponse<ReportSummaryResponse> summarizeReportText(@Valid @RequestBody ReportSummaryRequest request) {
        return ApiResponse.success(aiService.summarizeReportText(request.getReportText(), request.getLabReportId()));
    }

    @PostMapping(value = "/reports/summarize-pdf", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Operation(summary = "Upload a PDF report and get a plain-language AI summary")
    public ApiResponse<ReportSummaryResponse> summarizeReportPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "labReportId", required = false) Long labReportId) {
        return ApiResponse.success(aiService.summarizeReportPdf(file, labReportId));
    }

    @GetMapping("/prescriptions/{id}/explain")
    @Operation(summary = "Get an AI explanation of a prescription's medicines, side effects, and precautions")
    public ApiResponse<PrescriptionExplanationResponse> explainPrescription(@PathVariable Long id) {
        Long userId = securityUtil.getCurrentUserId();
        return ApiResponse.success(aiService.explainPrescription(id, userId));
    }

    @PostMapping("/chat")
    @Operation(summary = "Ask the hospital FAQ chatbot about hours, departments, doctors, or appointments")
    public ApiResponse<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ApiResponse.success(aiService.chat(request));
    }
}
