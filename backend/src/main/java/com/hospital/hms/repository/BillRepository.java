package com.hospital.hms.repository;

import com.hospital.hms.entity.Bill;
import com.hospital.hms.entity.enums.BillStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {

    Page<Bill> findByPatient_Id(Long patientId, Pageable pageable);

    Optional<Bill> findByBillNumber(String billNumber);

    long countByStatus(BillStatus status);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.status = 'PAID' " +
           "AND b.createdAt BETWEEN :start AND :end")
    BigDecimal sumRevenueBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.status = 'PAID' " +
           "AND FUNCTION('DATE', b.createdAt) = :date")
    BigDecimal sumRevenueOnDate(LocalDate date);
}
