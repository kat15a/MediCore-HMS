package com.hospital.hms.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorDashboardResponse {
    private long todaysPatientCount;
    private long upcomingAppointmentCount;
    private long completedTodayCount;
    private List<AppointmentResponse> todaysAppointments;
}
