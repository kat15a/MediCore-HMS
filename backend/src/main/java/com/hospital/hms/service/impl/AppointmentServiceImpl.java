package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.AppointmentRequest;
import com.hospital.hms.dto.request.AppointmentStatusUpdateRequest;
import com.hospital.hms.dto.response.AppointmentResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.entity.enums.AppointmentStatus;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Override
    public AppointmentResponse book(AppointmentRequest request, Long bookedByUserId) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor", request.getDoctorId()));
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Department", request.getDepartmentId()));

        if (!Boolean.TRUE.equals(doctor.getIsAvailable())) {
            throw new BadRequestException("Dr. " + doctor.getUser().getLastName() + " is not currently accepting appointments");
        }

        List<Appointment> conflicts = appointmentRepository.findConflicting(
                doctor.getId(), request.getAppointmentDate(), request.getAppointmentTime());
        if (!conflicts.isEmpty()) {
            throw new BadRequestException("This doctor already has an appointment at the selected date/time. Please choose another slot.");
        }

        long existingCountForDay = appointmentRepository.countActiveForDoctorOnDate(doctor.getId(), request.getAppointmentDate());

        User bookedBy = bookedByUserId != null
                ? userRepository.findById(bookedByUserId).orElse(null)
                : null;

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .department(department)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .status(AppointmentStatus.PENDING)
                .reason(request.getReason())
                .queueNumber((int) existingCountForDay + 1)
                .bookedBy(bookedBy)
                .build();

        return toResponse(appointmentRepository.save(appointment));
    }

    @Override
    public AppointmentResponse updateStatus(Long id, AppointmentStatusUpdateRequest request) {
        Appointment appointment = findEntity(id);
        AppointmentStatus newStatus = parseStatus(request.getStatus());
        appointment.setStatus(newStatus);
        if (newStatus == AppointmentStatus.CANCELLED) {
            appointment.setCancelledReason(request.getCancelledReason());
        }
        return toResponse(appointmentRepository.save(appointment));
    }

    @Override
    public AppointmentResponse cancel(Long id, String reason) {
        Appointment appointment = findEntity(id);
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot cancel an appointment that has already been completed");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledReason(reason);
        return toResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getByPatient(Long patientId, Pageable pageable) {
        return appointmentRepository.findByPatient_Id(patientId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getByDoctor(Long doctorId, Pageable pageable) {
        return appointmentRepository.findByDoctor_Id(doctorId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorScheduleForDate(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctor_IdAndAppointmentDate(doctorId, date).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getTodaysAppointments() {
        return appointmentRepository.findByAppointmentDate(LocalDate.now()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Appointment findEntity(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Appointment", id));
    }

    private AppointmentStatus parseStatus(String value) {
        try {
            return AppointmentStatus.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid appointment status: " + value);
        }
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getUser().getFullName())
                .doctorId(a.getDoctor().getId())
                .doctorName("Dr. " + a.getDoctor().getUser().getFullName())
                .departmentId(a.getDepartment().getId())
                .departmentName(a.getDepartment().getName())
                .appointmentDate(a.getAppointmentDate())
                .appointmentTime(a.getAppointmentTime())
                .status(a.getStatus().name())
                .reason(a.getReason())
                .queueNumber(a.getQueueNumber())
                .cancelledReason(a.getCancelledReason())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
