package com.hospital.hms.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionExplanationResponse {
    private String overallSummary;
    private List<MedicineExplanation> medicines;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MedicineExplanation {
        private String medicineName;
        private String purpose;
        private String commonSideEffects;
        private String dosageGuidance;
        private String precautions;
    }
}
