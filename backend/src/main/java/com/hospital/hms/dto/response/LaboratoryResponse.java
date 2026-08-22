package com.hospital.hms.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaboratoryResponse {
    private Long id;
    private String testName;
    private String category;
    private BigDecimal price;
    private String description;
}
