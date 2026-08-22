package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.LabReportRequest;
import com.hospital.hms.dto.request.LabReportUpdateRequest;
import com.hospital.hms.dto.response.LabReportResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.entity.enums.LabReportStatus;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.LabReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class LabReportServiceImpl implements LabReportService {

    private final LabReportRepository labReportRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    public LabReportResponse request(LabReportRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", request.getPatientId()));
        Laboratory lab = laboratoryRepository.findById(request.getLaboratoryId())
                .orElseThrow(() -> ResourceNotFoundException.of("Laboratory test", request.getLaboratoryId()));

        Doctor doctor = null;
        if (request.getDoctorId() != null) {
            doctor = doctorRepository.findById(request.getDoctorId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Doctor", request.getDoctorId()));
        }

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Appointment", request.getAppointmentId()));
        }

        LabReport labReport = LabReport.builder()
                .patient(patient)
                .doctor(doctor)
                .laboratory(lab)
                .appointment(appointment)
                .status(LabReportStatus.REQUESTED)
                .build();

        return toResponse(labReportRepository.save(labReport));
    }

    @Override
    public LabReportResponse update(Long id, LabReportUpdateRequest request) {
        LabReport labReport = findEntity(id);

        if (request.getStatus() != null) {
            LabReportStatus status = parseStatus(request.getStatus());
            labReport.setStatus(status);
            if (status == LabReportStatus.COMPLETED) {
                labReport.setCompletedAt(LocalDateTime.now());
            }
        }
        if (request.getReportFileUrl() != null) labReport.setReportFileUrl(request.getReportFileUrl());
        if (request.getResultSummary() != null) labReport.setResultSummary(request.getResultSummary());
        if (request.getIsAbnormal() != null) labReport.setIsAbnormal(request.getIsAbnormal());

        return toResponse(labReportRepository.save(labReport));
    }

    @Override
    @Transactional(readOnly = true)
    public LabReportResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LabReportResponse> getByPatient(Long patientId, Pageable pageable) {
        return labReportRepository.findByPatient_Id(patientId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LabReportResponse> getByDoctor(Long doctorId, Pageable pageable) {
        return labReportRepository.findByDoctor_Id(doctorId, pageable).map(this::toResponse);
    }

    @Override
    public LabReportResponse attachAiSummary(Long id, String aiSummary) {
        LabReport labReport = findEntity(id);
        labReport.setAiSummary(aiSummary);
        return toResponse(labReportRepository.save(labReport));
    }

    private LabReport findEntity(Long id) {
        return labReportRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Lab report", id));
    }

    private LabReportStatus parseStatus(String value) {
        try {
            return LabReportStatus.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid lab report status: " + value);
        }
    }

    private LabReportResponse toResponse(LabReport r) {
        return LabReportResponse.builder()
                .id(r.getId())
                .patientId(r.getPatient().getId())
                .patientName(r.getPatient().getUser().getFullName())
                .doctorId(r.getDoctor() != null ? r.getDoctor().getId() : null)
                .doctorName(r.getDoctor() != null ? "Dr. " + r.getDoctor().getUser().getFullName() : null)
                .laboratoryId(r.getLaboratory().getId())
                .testName(r.getLaboratory().getTestName())
                .appointmentId(r.getAppointment() != null ? r.getAppointment().getId() : null)
                .status(r.getStatus().name())
                .reportFileUrl(r.getReportFileUrl())
                .resultSummary(r.getResultSummary())
                .aiSummary(r.getAiSummary())
                .isAbnormal(r.getIsAbnormal())
                .requestedAt(r.getRequestedAt())
                .completedAt(r.getCompletedAt())
                .build();
    }
}
