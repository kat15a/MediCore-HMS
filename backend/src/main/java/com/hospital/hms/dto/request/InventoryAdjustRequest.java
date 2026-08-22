package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryAdjustRequest {

    @NotNull(message = "Quantity is required")
    private Integer quantity; // positive to restock, negative to deduct

    private String batchNumber;
    private String expiryDate; // yyyy-MM-dd
}
