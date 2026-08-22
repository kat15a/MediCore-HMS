package com.hospital.hms.controller;

import com.hospital.hms.dto.request.DoctorRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.DoctorResponse;
import com.hospital.hms.dto.response.PageResponse;
import com.hospital.hms.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "Manage doctor profiles")
public class DoctorController {

    private final DoctorService doctorService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a doctor (creates linked user account)")
    public ApiResponse<DoctorResponse> create(@Valid @RequestBody DoctorRequest request) {
        return ApiResponse.success("Doctor created successfully", doctorService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Operation(summary = "Update a doctor profile")
    public ApiResponse<DoctorResponse> update(@PathVariable Long id, @RequestBody DoctorRequest request) {
        return ApiResponse.success("Doctor updated successfully", doctorService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a doctor by id")
    public ApiResponse<DoctorResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(doctorService.getById(id));
    }

    @GetMapping("/by-user/{userId}")
    @Operation(summary = "Get a doctor by linked user id")
    public ApiResponse<DoctorResponse> getByUserId(@PathVariable Long userId) {
        return ApiResponse.success(doctorService.getByUserId(userId));
    }

    @GetMapping
    @Operation(summary = "List all doctors (paginated)")
    public ApiResponse<PageResponse<DoctorResponse>> getAll(Pageable pageable) {
        return ApiResponse.success(PageResponse.of(doctorService.getAll(pageable)));
    }

    @GetMapping("/department/{departmentId}")
    @Operation(summary = "List doctors by department")
    public ApiResponse<List<DoctorResponse>> getByDepartment(@PathVariable Long departmentId) {
        return ApiResponse.success(doctorService.getByDepartment(departmentId));
    }

    @GetMapping("/search")
    @Operation(summary = "Search doctors by name or specialization")
    public ApiResponse<List<DoctorResponse>> search(@RequestParam String keyword) {
        return ApiResponse.success(doctorService.search(keyword));
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Operation(summary = "Toggle a doctor's availability")
    public ApiResponse<Void> setAvailability(@PathVariable Long id, @RequestParam boolean available) {
        doctorService.setAvailability(id, available);
        return ApiResponse.message("Availability updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a doctor and their linked user account")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        doctorService.delete(id);
        return ApiResponse.message("Doctor deleted successfully");
    }
}
