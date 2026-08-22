package com.hospital.hms.controller;

import com.hospital.hms.dto.response.AdminDashboardResponse;
import com.hospital.hms.dto.response.ApiResponse;
import com.hospital.hms.dto.response.DoctorDashboardResponse;
import com.hospital.hms.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Aggregated statistics for admin and doctor dashboards")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin dashboard statistics")
    public ApiResponse<AdminDashboardResponse> getAdminDashboard() {
        return ApiResponse.success(dashboardService.getAdminDashboard());
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    @Operation(summary = "Get a doctor's dashboard statistics")
    public ApiResponse<DoctorDashboardResponse> getDoctorDashboard(@PathVariable Long doctorId) {
        return ApiResponse.success(dashboardService.getDoctorDashboard(doctorId));
    }
}
