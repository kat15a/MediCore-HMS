package com.hospital.hms.controller;

import com.hospital.hms.dto.request.PatientRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.PageResponse;
import com.hospital.hms.dto.response.PatientResponse;
import com.hospital.hms.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
@Tag(name = "Patients", description = "Manage patient records")
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    @Operation(summary = "Register a new patient (creates linked user account)")
    public ApiResponse<PatientResponse> register(@Valid @RequestBody PatientRequest request) {
        return ApiResponse.success("Patient registered successfully", patientService.register(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    @Operation(summary = "Update a patient profile")
    public ApiResponse<PatientResponse> update(@PathVariable Long id, @RequestBody PatientRequest request) {
        return ApiResponse.success("Patient updated successfully", patientService.update(id, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    @Operation(summary = "Get a patient by id")
    public ApiResponse<PatientResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(patientService.getById(id));
    }

    @GetMapping("/by-user/{userId}")
    @Operation(summary = "Get a patient by linked user id")
    public ApiResponse<PatientResponse> getByUserId(@PathVariable Long userId) {
        return ApiResponse.success(patientService.getByUserId(userId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    @Operation(summary = "List all patients (paginated)")
    public ApiResponse<PageResponse<PatientResponse>> getAll(Pageable pageable) {
        return ApiResponse.success(PageResponse.of(patientService.getAll(pageable)));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    @Operation(summary = "Search patients by name, email, or phone")
    public ApiResponse<List<PatientResponse>> search(@RequestParam String keyword) {
        return ApiResponse.success(patientService.search(keyword));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a patient and their linked user account")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ApiResponse.message("Patient deleted successfully");
    }
}
