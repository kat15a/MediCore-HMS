package com.hospital.hms.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomCheckResponse {
    private List<String> possibleConditions;
    private String recommendedDepartment;
    private String urgencyLevel;          // LOW | MEDIUM | HIGH | EMERGENCY
    private List<String> suggestedQuestions;
    private List<String> redFlagSymptoms;
    private String disclaimer;
}
