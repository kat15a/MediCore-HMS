package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItemRequest {

    @NotNull(message = "Medicine is required")
    private Long medicineId;

    private String dosage;
    private String frequency;
    private Integer durationDays;
    private String instructions;
}
