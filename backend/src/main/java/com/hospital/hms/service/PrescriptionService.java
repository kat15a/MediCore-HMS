package com.hospital.hms.service;

import com.hospital.hms.dto.request.PrescriptionRequest;
import com.hospital.hms.dto.response.PrescriptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PrescriptionService {

    PrescriptionResponse create(PrescriptionRequest request, Long doctorUserId);

    PrescriptionResponse getById(Long id);

    PrescriptionResponse getByAppointment(Long appointmentId);

    Page<PrescriptionResponse> getByPatient(Long patientId, Pageable pageable);

    Page<PrescriptionResponse> getByDoctor(Long doctorId, Pageable pageable);

    /** Attaches an AI-generated plain-language explanation; called from the AI module. */
    PrescriptionResponse attachAiSummary(Long id, String aiSummary);
}
