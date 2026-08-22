package com.hospital.hms.controller;

import com.hospital.hms.dto.request.PrescriptionRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.PageResponse;
import com.hospital.hms.dto.response.PrescriptionResponse;
import com.hospital.hms.service.PrescriptionService;
import com.hospital.hms.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescriptions", description = "Doctor-issued prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final SecurityUtil securityUtil;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Operation(summary = "Create a prescription for a completed appointment")
    public ApiResponse<PrescriptionResponse> create(@Valid @RequestBody PrescriptionRequest request) {
        Long doctorUserId = securityUtil.getCurrentUserId();
        return ApiResponse.success("Prescription created successfully", prescriptionService.create(request, doctorUserId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a prescription by id")
    public ApiResponse<PrescriptionResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(prescriptionService.getById(id));
    }

    @GetMapping("/appointment/{appointmentId}")
    @Operation(summary = "Get the prescription for an appointment")
    public ApiResponse<PrescriptionResponse> getByAppointment(@PathVariable Long appointmentId) {
        return ApiResponse.success(prescriptionService.getByAppointment(appointmentId));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "List a patient's prescription history (paginated)")
    public ApiResponse<PageResponse<PrescriptionResponse>> getByPatient(@PathVariable Long patientId, Pageable pageable) {
        return ApiResponse.success(PageResponse.of(prescriptionService.getByPatient(patientId, pageable)));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Operation(summary = "List prescriptions written by a doctor (paginated)")
    public ApiResponse<PageResponse<PrescriptionResponse>> getByDoctor(@PathVariable Long doctorId, Pageable pageable) {
        return ApiResponse.success(PageResponse.of(prescriptionService.getByDoctor(doctorId, pageable)));
    }
}
