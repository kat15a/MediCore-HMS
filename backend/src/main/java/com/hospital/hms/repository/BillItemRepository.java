package com.hospital.hms.repository;

import com.hospital.hms.entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillItemRepository extends JpaRepository<BillItem, Long> {
    List<BillItem> findByBill_Id(Long billId);
}
