package com.hospital.hms.controller;

import com.hospital.hms.dto.request.ReceptionistRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.PageResponse;
import com.hospital.hms.dto.response.ReceptionistResponse;
import com.hospital.hms.service.ReceptionistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/receptionists")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Receptionists", description = "Manage receptionist accounts")
public class ReceptionistController {

    private final ReceptionistService receptionistService;

    @PostMapping
    @Operation(summary = "Create a receptionist (creates linked user account)")
    public ApiResponse<ReceptionistResponse> create(@Valid @RequestBody ReceptionistRequest request) {
        return ApiResponse.success("Receptionist created successfully", receptionistService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a receptionist")
    public ApiResponse<ReceptionistResponse> update(@PathVariable Long id, @RequestBody ReceptionistRequest request) {
        return ApiResponse.success("Receptionist updated successfully", receptionistService.update(id, request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a receptionist by id")
    public ApiResponse<ReceptionistResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(receptionistService.getById(id));
    }

    @GetMapping
    @Operation(summary = "List all receptionists (paginated)")
    public ApiResponse<PageResponse<ReceptionistResponse>> getAll(Pageable pageable) {
        return ApiResponse.success(PageResponse.of(receptionistService.getAll(pageable)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a receptionist and their linked user account")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        receptionistService.delete(id);
        return ApiResponse.message("Receptionist deleted successfully");
    }
}
