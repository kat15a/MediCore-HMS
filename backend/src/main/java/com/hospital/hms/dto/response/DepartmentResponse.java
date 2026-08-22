package com.hospital.hms.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean isActive;
    private Integer doctorCount;
    private LocalDateTime createdAt;
}
