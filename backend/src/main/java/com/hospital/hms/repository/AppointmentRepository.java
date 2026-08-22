package com.hospital.hms.repository;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Page<Appointment> findByPatient_Id(Long patientId, Pageable pageable);

    Page<Appointment> findByDoctor_Id(Long doctorId, Pageable pageable);

    List<Appointment> findByDoctor_IdAndAppointmentDate(Long doctorId, LocalDate date);

    List<Appointment> findByAppointmentDate(LocalDate date);

    long countByAppointmentDate(LocalDate date);

    long countByStatus(AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date AND a.status NOT IN ('CANCELLED','NO_SHOW')")
    long countActiveForDoctorOnDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate = :date " +
           "AND a.appointmentTime = :time AND a.status NOT IN ('CANCELLED','NO_SHOW')")
    List<Appointment> findConflicting(@Param("doctorId") Long doctorId,
                                       @Param("date") LocalDate date,
                                       @Param("time") java.time.LocalTime time);

    @Query("SELECT SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) FROM Appointment a WHERE a.appointmentDate = :date")
    Long countCompletedOnDate(@Param("date") LocalDate date);
}
