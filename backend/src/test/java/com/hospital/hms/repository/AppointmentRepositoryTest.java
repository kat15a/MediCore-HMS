package com.hospital.hms.repository;

import com.hospital.hms.entity.*;
import com.hospital.hms.entity.enums.AppointmentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * These custom {@code @Query} methods (conflict detection, active-appointment
 * counts) are exactly the kind of logic that mocking would let slip through
 * with a typo in the JPQL — so this runs them against a real H2 database.
 */
@DataJpaTest
@ActiveProfiles("test")
class AppointmentRepositoryTest {

    @Autowired private TestEntityManager entityManager;
    @Autowired private AppointmentRepository appointmentRepository;

    private Doctor doctor;
    private Patient patientA;
    private Patient patientB;
    private Department department;

    @BeforeEach
    void setUp() {
        Role doctorRole = entityManager.persist(Role.builder().name(Role.DOCTOR).build());
        Role patientRole = entityManager.persist(Role.builder().name(Role.PATIENT).build());

        department = entityManager.persist(Department.builder().name("Cardiology").isActive(true).build());

        User doctorUser = entityManager.persist(User.builder()
                .role(doctorRole).firstName("Greg").lastName("House")
                .email("house@medicore.local").passwordHash("x").isActive(true).isEmailVerified(true).build());
        doctor = entityManager.persist(Doctor.builder().user(doctorUser).department(department).isAvailable(true).build());

        User patientUserA = entityManager.persist(User.builder()
                .role(patientRole).firstName("Alice").lastName("A")
                .email("alice@medicore.local").passwordHash("x").isActive(true).isEmailVerified(true).build());
        patientA = entityManager.persist(Patient.builder().user(patientUserA).build());

        User patientUserB = entityManager.persist(User.builder()
                .role(patientRole).firstName("Bob").lastName("B")
                .email("bob@medicore.local").passwordHash("x").isActive(true).isEmailVerified(true).build());
        patientB = entityManager.persist(Patient.builder().user(patientUserB).build());

        entityManager.flush();
    }

    @Test
    void findConflicting_returnsExistingAppointment_forSameDoctorDateAndTime() {
        LocalDate date = LocalDate.now().plusDays(1);
        LocalTime time = LocalTime.of(10, 0);

        entityManager.persist(Appointment.builder()
                .patient(patientA).doctor(doctor).department(department)
                .appointmentDate(date).appointmentTime(time)
                .status(AppointmentStatus.CONFIRMED)
                .build());
        entityManager.flush();

        List<Appointment> conflicts = appointmentRepository.findConflicting(doctor.getId(), date, time);

        assertThat(conflicts).hasSize(1);
    }

    @Test
    void findConflicting_ignoresCancelledAppointments() {
        LocalDate date = LocalDate.now().plusDays(1);
        LocalTime time = LocalTime.of(11, 0);

        entityManager.persist(Appointment.builder()
                .patient(patientA).doctor(doctor).department(department)
                .appointmentDate(date).appointmentTime(time)
                .status(AppointmentStatus.CANCELLED)
                .build());
        entityManager.flush();

        List<Appointment> conflicts = appointmentRepository.findConflicting(doctor.getId(), date, time);

        assertThat(conflicts).isEmpty();
    }

    @Test
    void countActiveForDoctorOnDate_excludesCancelledAndNoShow_butIncludesOthers() {
        LocalDate date = LocalDate.now().plusDays(2);

        entityManager.persist(Appointment.builder()
                .patient(patientA).doctor(doctor).department(department)
                .appointmentDate(date).appointmentTime(LocalTime.of(9, 0))
                .status(AppointmentStatus.CONFIRMED).build());
        entityManager.persist(Appointment.builder()
                .patient(patientB).doctor(doctor).department(department)
                .appointmentDate(date).appointmentTime(LocalTime.of(9, 30))
                .status(AppointmentStatus.PENDING).build());
        entityManager.persist(Appointment.builder()
                .patient(patientA).doctor(doctor).department(department)
                .appointmentDate(date).appointmentTime(LocalTime.of(10, 0))
                .status(AppointmentStatus.CANCELLED).build());
        entityManager.persist(Appointment.builder()
                .patient(patientB).doctor(doctor).department(department)
                .appointmentDate(date).appointmentTime(LocalTime.of(10, 30))
                .status(AppointmentStatus.NO_SHOW).build());
        entityManager.flush();

        long activeCount = appointmentRepository.countActiveForDoctorOnDate(doctor.getId(), date);

        assertThat(activeCount).isEqualTo(2); // CONFIRMED + PENDING only
    }

    @Test
    void countActiveForDoctorOnDate_isZero_whenNoAppointmentsExist() {
        long activeCount = appointmentRepository.countActiveForDoctorOnDate(doctor.getId(), LocalDate.now().plusDays(30));
        assertThat(activeCount).isZero();
    }
}
