package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status; // PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW

    private String cancelledReason;
}
