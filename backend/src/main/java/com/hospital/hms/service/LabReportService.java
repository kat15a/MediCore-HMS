package com.hospital.hms.service;

import com.hospital.hms.dto.request.LabReportRequest;
import com.hospital.hms.dto.request.LabReportUpdateRequest;
import com.hospital.hms.dto.response.LabReportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LabReportService {

    LabReportResponse request(LabReportRequest request);

    LabReportResponse update(Long id, LabReportUpdateRequest request);

    LabReportResponse getById(Long id);

    Page<LabReportResponse> getByPatient(Long patientId, Pageable pageable);

    Page<LabReportResponse> getByDoctor(Long doctorId, Pageable pageable);

    /** Attaches an AI-generated plain-language summary; called from the AI module. */
    LabReportResponse attachAiSummary(Long id, String aiSummary);
}
