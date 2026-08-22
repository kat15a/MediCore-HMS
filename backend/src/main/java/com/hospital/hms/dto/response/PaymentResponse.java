package com.hospital.hms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long billId;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionRef;
    private String status;
    private LocalDateTime paidAt;
}
