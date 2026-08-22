package com.hospital.hms.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {
    private Long id;
    private String roomNumber;
    private String roomType;
    private String floor;
    private Integer capacity;
    private Integer occupiedBeds;
    private Integer availableBeds;
    private BigDecimal dailyRate;
    private String status;
}
