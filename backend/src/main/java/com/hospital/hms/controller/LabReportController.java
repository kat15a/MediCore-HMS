package com.hospital.hms.controller;

import com.hospital.hms.dto.request.LabReportRequest;
import com.hospital.hms.dto.request.LabReportUpdateRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.LabReportResponse;
import com.hospital.hms.dto.response.PageResponse;
import com.hospital.hms.service.LabReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lab-reports")
@RequiredArgsConstructor
@Tag(name = "Lab Reports", description = "Request and track patient lab tests")
public class LabReportController {

    private final LabReportService labReportService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    @Operation(summary = "Request a lab test for a patient")
    public ApiResponse<LabReportResponse> request(@Valid @RequestBody LabReportRequest request) {
        return ApiResponse.success("Lab test requested successfully", labReportService.request(request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Operation(summary = "Update a lab report's status, results, or uploaded file")
    public ApiResponse<LabReportResponse> update(@PathVariable Long id, @RequestBody LabReportUpdateRequest request) {
        return ApiResponse.success("Lab report updated successfully", labReportService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a lab report by id")
    public ApiResponse<LabReportResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(labReportService.getById(id));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "List a patient's lab reports (paginated)")
    public ApiResponse<PageResponse<LabReportResponse>> getByPatient(@PathVariable Long patientId, Pageable pageable) {
        return ApiResponse.success(PageResponse.of(labReportService.getByPatient(patientId, pageable)));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "List lab reports requested by a doctor (paginated)")
    public ApiResponse<PageResponse<LabReportResponse>> getByDoctor(@PathVariable Long doctorId, Pageable pageable) {
        return ApiResponse.success(PageResponse.of(labReportService.getByDoctor(doctorId, pageable)));
    }
}
