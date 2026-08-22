package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.AppointmentRequest;
import com.hospital.hms.dto.request.AppointmentStatusUpdateRequest;
import com.hospital.hms.dto.response.AppointmentResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.entity.enums.AppointmentStatus;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceImplTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private Patient patient;
    private Doctor doctor;
    private Department department;
    private AppointmentRequest request;

    @BeforeEach
    void setUp() {
        Role patientRole = Role.builder().id(4L).name(Role.PATIENT).build();
        Role doctorRole = Role.builder().id(2L).name(Role.DOCTOR).build();

        User patientUser = User.builder().id(10L).firstName("Jane").lastName("Doe").role(patientRole).build();
        User doctorUser = User.builder().id(20L).firstName("Greg").lastName("House").role(doctorRole).build();

        patient = Patient.builder().id(1L).user(patientUser).build();
        department = Department.builder().id(1L).name("General Medicine").build();
        doctor = Doctor.builder().id(2L).user(doctorUser).department(department).isAvailable(true).build();

        request = AppointmentRequest.builder()
                .patientId(1L)
                .doctorId(2L)
                .departmentId(1L)
                .appointmentDate(LocalDate.now().plusDays(1))
                .appointmentTime(LocalTime.of(10, 0))
                .reason("Annual checkup")
                .build();
    }

    @Test
    void book_succeeds_whenNoConflictExists() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(appointmentRepository.findConflicting(2L, request.getAppointmentDate(), request.getAppointmentTime()))
                .thenReturn(Collections.emptyList());
        when(appointmentRepository.countActiveForDoctorOnDate(2L, request.getAppointmentDate())).thenReturn(3L);
        when(userRepository.findById(10L)).thenReturn(Optional.of(patient.getUser()));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
            Appointment a = inv.getArgument(0);
            a.setId(100L);
            return a;
        });

        AppointmentResponse response = appointmentService.book(request, 10L);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getQueueNumber()).isEqualTo(4); // 3 existing + 1
        assertThat(response.getDoctorName()).isEqualTo("Dr. Greg House");
    }

    @Test
    void book_throwsBadRequestException_whenDoctorUnavailable() {
        doctor.setIsAvailable(false);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));

        assertThatThrownBy(() -> appointmentService.book(request, 10L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not currently accepting appointments");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void book_throwsBadRequestException_whenSlotAlreadyTaken() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(appointmentRepository.findConflicting(2L, request.getAppointmentDate(), request.getAppointmentTime()))
                .thenReturn(List.of(new Appointment()));

        assertThatThrownBy(() -> appointmentService.book(request, 10L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already has an appointment");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void book_throwsResourceNotFoundException_whenPatientMissing() {
        when(patientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.book(request, 10L))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(appointmentRepository);
    }

    @Test
    void cancel_throwsBadRequestException_whenAppointmentAlreadyCompleted() {
        Appointment completed = Appointment.builder().id(5L).status(AppointmentStatus.COMPLETED).build();
        when(appointmentRepository.findById(5L)).thenReturn(Optional.of(completed));

        assertThatThrownBy(() -> appointmentService.cancel(5L, "Change of plans"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already been completed");

        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void cancel_setsStatusAndReason_whenNotYetCompleted() {
        Appointment pending = Appointment.builder()
                .id(6L)
                .status(AppointmentStatus.PENDING)
                .patient(patient)
                .doctor(doctor)
                .department(department)
                .build();
        when(appointmentRepository.findById(6L)).thenReturn(Optional.of(pending));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse response = appointmentService.cancel(6L, "Patient request");

        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        assertThat(response.getCancelledReason()).isEqualTo("Patient request");
    }

    @Test
    void updateStatus_throwsBadRequestException_forInvalidStatusValue() {
        Appointment appt = Appointment.builder()
                .id(7L).status(AppointmentStatus.PENDING)
                .patient(patient).doctor(doctor).department(department)
                .build();
        when(appointmentRepository.findById(7L)).thenReturn(Optional.of(appt));

        AppointmentStatusUpdateRequest badRequest = AppointmentStatusUpdateRequest.builder().status("NOT_A_REAL_STATUS").build();

        assertThatThrownBy(() -> appointmentService.updateStatus(7L, badRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid appointment status");
    }

    @Test
    void updateStatus_transitionsToConfirmed_forValidStatus() {
        Appointment appt = Appointment.builder()
                .id(8L).status(AppointmentStatus.PENDING)
                .patient(patient).doctor(doctor).department(department)
                .build();
        when(appointmentRepository.findById(8L)).thenReturn(Optional.of(appt));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentStatusUpdateRequest confirmRequest = AppointmentStatusUpdateRequest.builder().status("CONFIRMED").build();
        AppointmentResponse response = appointmentService.updateStatus(8L, confirmRequest);

        assertThat(response.getStatus()).isEqualTo("CONFIRMED");
    }
}
