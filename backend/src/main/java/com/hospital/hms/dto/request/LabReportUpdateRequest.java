package com.hospital.hms.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabReportUpdateRequest {
    private String status;           // REQUESTED | SAMPLE_COLLECTED | IN_PROGRESS | COMPLETED | CANCELLED
    private String reportFileUrl;
    private String resultSummary;
    private Boolean isAbnormal;
}
