package com.hospital.hms.service;

import com.hospital.hms.dto.request.ChatRequest;
import com.hospital.hms.dto.request.SymptomCheckRequest;
import com.hospital.hms.dto.response.ChatResponse;
import com.hospital.hms.dto.response.PrescriptionExplanationResponse;
import com.hospital.hms.dto.response.ReportSummaryResponse;
import com.hospital.hms.dto.response.SymptomCheckResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AiService {

    SymptomCheckResponse checkSymptoms(SymptomCheckRequest request);

    /** Summarizes raw report text; if labReportId is present, saves the summary onto that report. */
    ReportSummaryResponse summarizeReportText(String reportText, Long labReportId);

    /** Extracts text from an uploaded PDF, then summarizes it the same way. */
    ReportSummaryResponse summarizeReportPdf(MultipartFile file, Long labReportId);

    PrescriptionExplanationResponse explainPrescription(Long prescriptionId, Long requestingUserId);

    ChatResponse chat(ChatRequest request);
}
