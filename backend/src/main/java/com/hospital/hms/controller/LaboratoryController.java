package com.hospital.hms.controller;

import com.hospital.hms.dto.request.LaboratoryRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.LaboratoryResponse;
import com.hospital.hms.service.LaboratoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/laboratories")
@RequiredArgsConstructor
@Tag(name = "Laboratories", description = "Manage the lab test catalog")
public class LaboratoryController {

    private final LaboratoryService laboratoryService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a lab test to the catalog")
    public ApiResponse<LaboratoryResponse> create(@Valid @RequestBody LaboratoryRequest request) {
        return ApiResponse.success("Lab test added successfully", laboratoryService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a lab test")
    public ApiResponse<LaboratoryResponse> update(@PathVariable Long id, @RequestBody LaboratoryRequest request) {
        return ApiResponse.success("Lab test updated successfully", laboratoryService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a lab test by id")
    public ApiResponse<LaboratoryResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(laboratoryService.getById(id));
    }

    @GetMapping
    @Operation(summary = "List the lab test catalog")
    public ApiResponse<List<LaboratoryResponse>> getAll() {
        return ApiResponse.success(laboratoryService.getAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove a lab test from the catalog")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        laboratoryService.delete(id);
        return ApiResponse.message("Lab test removed successfully");
    }
}
