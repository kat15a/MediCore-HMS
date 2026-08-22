package com.hospital.hms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineRequest {

    @NotBlank(message = "Medicine name is required")
    private String name;

    private String genericName;
    private String manufacturer;
    private String category;
    private String unit;

    @DecimalMin(value = "0.0", message = "Unit price cannot be negative")
    private BigDecimal unitPrice;

    private String description;

    // Optional initial stock fields (creates an Inventory row alongside the medicine)
    private Integer initialStock;
    private Integer reorderLevel;
    private String batchNumber;
    private String expiryDate; // yyyy-MM-dd
}
