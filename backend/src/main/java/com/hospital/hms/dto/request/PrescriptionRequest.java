package com.hospital.hms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionRequest {

    @NotNull(message = "Appointment is required")
    private Long appointmentId;

    private String diagnosis;
    private String notes;

    @NotEmpty(message = "At least one medicine item is required")
    @Valid
    private List<PrescriptionItemRequest> items;
}
