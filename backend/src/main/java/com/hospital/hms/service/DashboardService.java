package com.hospital.hms.service;

import com.hospital.hms.dto.response.AdminDashboardResponse;
import com.hospital.hms.dto.response.DoctorDashboardResponse;

public interface DashboardService {

    AdminDashboardResponse getAdminDashboard();

    DoctorDashboardResponse getDoctorDashboard(Long doctorId);
}
