package com.hospital.hms.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabReportResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private Long laboratoryId;
    private String testName;
    private Long appointmentId;
    private String status;
    private String reportFileUrl;
    private String resultSummary;
    private String aiSummary;
    private Boolean isAbnormal;
    private LocalDateTime requestedAt;
    private LocalDateTime completedAt;
}
