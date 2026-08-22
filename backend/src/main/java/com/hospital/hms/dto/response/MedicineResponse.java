package com.hospital.hms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicineResponse {
    private Long id;
    private String name;
    private String genericName;
    private String manufacturer;
    private String category;
    private String unit;
    private BigDecimal unitPrice;
    private String description;
    private Integer quantityInStock;
    private Integer reorderLevel;
    private Boolean lowStock;
    private LocalDate expiryDate;
}
