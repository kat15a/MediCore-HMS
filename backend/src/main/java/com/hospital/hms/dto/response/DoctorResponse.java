package com.hospital.hms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorResponse {
    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String profileImageUrl;
    private Long departmentId;
    private String departmentName;
    private String specialization;
    private String qualification;
    private String licenseNumber;
    private Integer yearsOfExperience;
    private BigDecimal consultationFee;
    private String bio;
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private Boolean isAvailable;
}
