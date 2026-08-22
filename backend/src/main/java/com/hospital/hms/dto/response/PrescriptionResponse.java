package com.hospital.hms.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionResponse {
    private Long id;
    private Long appointmentId;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private String diagnosis;
    private String notes;
    private String aiSummary;
    private String pdfUrl;
    private List<PrescriptionItemResponse> items;
    private LocalDateTime createdAt;
}
