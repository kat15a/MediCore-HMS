package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabReportRequest {

    @NotNull(message = "Patient is required")
    private Long patientId;

    private Long doctorId;

    @NotNull(message = "Laboratory test is required")
    private Long laboratoryId;

    private Long appointmentId;
}
