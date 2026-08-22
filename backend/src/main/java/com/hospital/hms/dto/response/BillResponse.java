package com.hospital.hms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private Long appointmentId;
    private Long roomId;
    private String billNumber;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private String status;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private List<BillItemResponse> items;
    private List<PaymentResponse> payments;
}
