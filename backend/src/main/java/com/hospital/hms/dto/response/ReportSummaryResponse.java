package com.hospital.hms.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportSummaryResponse {
    private String summary;
    private List<String> abnormalFindings;
    private String plainLanguageExplanation;
    private Boolean savedToLabReport;
}
