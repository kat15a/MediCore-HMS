package com.hospital.hms.repository;

import com.hospital.hms.entity.LabReport;
import com.hospital.hms.entity.enums.LabReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabReportRepository extends JpaRepository<LabReport, Long> {
    Page<LabReport> findByPatient_Id(Long patientId, Pageable pageable);
    Page<LabReport> findByDoctor_Id(Long doctorId, Pageable pageable);
    long countByStatus(LabReportStatus status);
}
