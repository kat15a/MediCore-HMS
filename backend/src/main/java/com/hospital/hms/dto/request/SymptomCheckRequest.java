package com.hospital.hms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomCheckRequest {

    @NotBlank(message = "Please describe your symptoms")
    @Size(max = 2000, message = "Please keep your description under 2000 characters")
    private String symptoms;

    private Integer age;
    private String gender;

    /** Optional free-text: existing conditions, medications, allergies. */
    private String medicalHistory;
}
