package com.hospital.hms.controller;

import com.hospital.hms.dto.request.BillRequest;
import com.hospital.hms.dto.request.PaymentRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.BillResponse;
import com.hospital.hms.dto.response.PageResponse;
import com.hospital.hms.dto.response.PaymentResponse;
import com.hospital.hms.service.BillService;
import com.hospital.hms.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bills")
@RequiredArgsConstructor
@Tag(name = "Billing", description = "Create bills and record payments")
public class BillController {

    private final BillService billService;
    private final SecurityUtil securityUtil;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    @Operation(summary = "Create a bill with line items")
    public ApiResponse<BillResponse> create(@Valid @RequestBody BillRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        return ApiResponse.success("Bill created successfully", billService.create(request, userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a bill by id")
    public ApiResponse<BillResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(billService.getById(id));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "List a patient's bills (paginated)")
    public ApiResponse<PageResponse<BillResponse>> getByPatient(@PathVariable Long patientId, Pageable pageable) {
        return ApiResponse.success(PageResponse.of(billService.getByPatient(patientId, pageable)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    @Operation(summary = "List all bills (paginated)")
    public ApiResponse<PageResponse<BillResponse>> getAll(Pageable pageable) {
        return ApiResponse.success(PageResponse.of(billService.getAll(pageable)));
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    @Operation(summary = "Record a payment against a bill")
    public ApiResponse<PaymentResponse> recordPayment(@Valid @RequestBody PaymentRequest request) {
        return ApiResponse.success("Payment recorded successfully", billService.recordPayment(request));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cancel an unpaid bill")
    public ApiResponse<Void> cancel(@PathVariable Long id) {
        billService.cancel(id);
        return ApiResponse.message("Bill cancelled successfully");
    }
}
