package com.hospital.hms.controller;

import com.hospital.hms.dto.request.AppointmentRequest;
import com.hospital.hms.dto.request.AppointmentStatusUpdateRequest;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.AppointmentResponse;
import com.hospital.hms.dto.response.PageResponse;
import com.hospital.hms.service.AppointmentService;
import com.hospital.hms.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Book and manage appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final SecurityUtil securityUtil;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    @Operation(summary = "Book an appointment")
    public ApiResponse<AppointmentResponse> book(@Valid @RequestBody AppointmentRequest request) {
        Long bookedByUserId = securityUtil.getCurrentUserId();
        return ApiResponse.success("Appointment booked successfully", appointmentService.book(request, bookedByUserId));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    @Operation(summary = "Update appointment status")
    public ApiResponse<AppointmentResponse> updateStatus(@PathVariable Long id,
                                                           @Valid @RequestBody AppointmentStatusUpdateRequest request) {
        return ApiResponse.success("Appointment status updated", appointmentService.updateStatus(id, request));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    @Operation(summary = "Cancel an appointment")
    public ApiResponse<AppointmentResponse> cancel(@PathVariable Long id, @RequestParam(required = false) String reason) {
        return ApiResponse.success("Appointment cancelled", appointmentService.cancel(id, reason));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an appointment by id")
    public ApiResponse<AppointmentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(appointmentService.getById(id));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "List a patient's appointments (paginated)")
    public ApiResponse<PageResponse<AppointmentResponse>> getByPatient(@PathVariable Long patientId, Pageable pageable) {
        return ApiResponse.success(PageResponse.of(appointmentService.getByPatient(patientId, pageable)));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "List a doctor's appointments (paginated)")
    public ApiResponse<PageResponse<AppointmentResponse>> getByDoctor(@PathVariable Long doctorId, Pageable pageable) {
        return ApiResponse.success(PageResponse.of(appointmentService.getByDoctor(doctorId, pageable)));
    }

    @GetMapping("/doctor/{doctorId}/schedule")
    @Operation(summary = "Get a doctor's schedule for a specific date")
    public ApiResponse<List<AppointmentResponse>> getDoctorSchedule(
            @PathVariable Long doctorId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(appointmentService.getDoctorScheduleForDate(doctorId, date));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    @Operation(summary = "List all of today's appointments")
    public ApiResponse<List<AppointmentResponse>> getTodaysAppointments() {
        return ApiResponse.success(appointmentService.getTodaysAppointments());
    }
}
