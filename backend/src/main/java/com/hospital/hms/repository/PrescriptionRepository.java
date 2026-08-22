package com.hospital.hms.repository;

import com.hospital.hms.entity.Prescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    Page<Prescription> findByPatient_Id(Long patientId, Pageable pageable);
    Page<Prescription> findByDoctor_Id(Long doctorId, Pageable pageable);
    Optional<Prescription> findByAppointment_Id(Long appointmentId);
}
