package com.hospital.hms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {
    private long totalPatients;
    private long totalDoctors;
    private long totalReceptionists;
    private long todaysAppointmentCount;
    private long pendingAppointmentCount;
    private long completedAppointmentCount;
    private BigDecimal todaysRevenue;
    private long availableBeds;
    private long totalBeds;
    private long lowStockMedicineCount;
    private List<RecentActivity> recentActivities;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentActivity {
        private String action;
        private String entityType;
        private Long entityId;
        private String performedBy;
        private String timestamp;
    }
}
