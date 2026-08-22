package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/** Used when the report text is pasted directly rather than uploaded as a PDF. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportSummaryRequest {

    @NotBlank(message = "Report text is required")
    private String reportText;

    /** Optional — when provided, the generated summary is saved onto this lab report. */
    private Long labReportId;
}
