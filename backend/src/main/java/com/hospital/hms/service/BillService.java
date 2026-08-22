package com.hospital.hms.service;

import com.hospital.hms.dto.request.BillRequest;
import com.hospital.hms.dto.request.PaymentRequest;
import com.hospital.hms.dto.response.BillResponse;
import com.hospital.hms.dto.response.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface BillService {

    BillResponse create(BillRequest request, Long createdByUserId);

    BillResponse getById(Long id);

    Page<BillResponse> getByPatient(Long patientId, Pageable pageable);

    Page<BillResponse> getAll(Pageable pageable);

    PaymentResponse recordPayment(PaymentRequest request);

    void cancel(Long id);

    BigDecimal getRevenueOnDate(LocalDate date);
}
