package com.hospital.hms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Room type is required")
    private String roomType; // GENERAL | PRIVATE | ICU | OPERATION_THEATRE | EMERGENCY

    private String floor;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @DecimalMin(value = "0.0", message = "Daily rate cannot be negative")
    private BigDecimal dailyRate;

    private String status; // AVAILABLE | OCCUPIED | MAINTENANCE
}
