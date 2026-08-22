package com.hospital.hms.service;

import com.hospital.hms.dto.request.AppointmentRequest;
import com.hospital.hms.dto.request.AppointmentStatusUpdateRequest;
import com.hospital.hms.dto.response.AppointmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {

    AppointmentResponse book(AppointmentRequest request, Long bookedByUserId);

    AppointmentResponse updateStatus(Long id, AppointmentStatusUpdateRequest request);

    AppointmentResponse cancel(Long id, String reason);

    AppointmentResponse getById(Long id);

    Page<AppointmentResponse> getByPatient(Long patientId, Pageable pageable);

    Page<AppointmentResponse> getByDoctor(Long doctorId, Pageable pageable);

    List<AppointmentResponse> getDoctorScheduleForDate(Long doctorId, LocalDate date);

    List<AppointmentResponse> getTodaysAppointments();
}
