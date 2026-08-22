package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.PrescriptionItemRequest;
import com.hospital.hms.dto.request.PrescriptionRequest;
import com.hospital.hms.dto.response.PrescriptionItemResponse;
import com.hospital.hms.dto.response.PrescriptionResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.entity.enums.AppointmentStatus;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicineRepository medicineRepository;
    private final DoctorRepository doctorRepository;

    @Override
    public PrescriptionResponse create(PrescriptionRequest request, Long doctorUserId) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Appointment", request.getAppointmentId()));

        if (prescriptionRepository.findByAppointment_Id(appointment.getId()).isPresent()) {
            throw new BadRequestException("This appointment already has a prescription");
        }

        // If the caller is a doctor, make sure they own this appointment.
        if (doctorUserId != null) {
            Doctor requestingDoctor = doctorRepository.findByUser_Id(doctorUserId).orElse(null);
            if (requestingDoctor != null && !requestingDoctor.getId().equals(appointment.getDoctor().getId())) {
                throw new BadRequestException("You can only write prescriptions for your own appointments");
            }
        }

        Prescription prescription = Prescription.builder()
                .appointment(appointment)
                .patient(appointment.getPatient())
                .doctor(appointment.getDoctor())
                .diagnosis(request.getDiagnosis())
                .notes(request.getNotes())
                .build();

        for (PrescriptionItemRequest itemReq : request.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Medicine", itemReq.getMedicineId()));

            PrescriptionItem item = PrescriptionItem.builder()
                    .medicine(medicine)
                    .dosage(itemReq.getDosage())
                    .frequency(itemReq.getFrequency())
                    .durationDays(itemReq.getDurationDays())
                    .instructions(itemReq.getInstructions())
                    .build();
            prescription.addItem(item);
        }

        prescription = prescriptionRepository.save(prescription);

        // Consultation is considered complete once the doctor issues the prescription.
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        return toResponse(prescription);
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionResponse getByAppointment(Long appointmentId) {
        return prescriptionRepository.findByAppointment_Id(appointmentId)
                .map(this::toResponse)
                .orElseThrow(() -> ResourceNotFoundException.of("Prescription for appointment", appointmentId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PrescriptionResponse> getByPatient(Long patientId, Pageable pageable) {
        return prescriptionRepository.findByPatient_Id(patientId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PrescriptionResponse> getByDoctor(Long doctorId, Pageable pageable) {
        return prescriptionRepository.findByDoctor_Id(doctorId, pageable).map(this::toResponse);
    }

    @Override
    public PrescriptionResponse attachAiSummary(Long id, String aiSummary) {
        Prescription prescription = findEntity(id);
        prescription.setAiSummary(aiSummary);
        return toResponse(prescriptionRepository.save(prescription));
    }

    private Prescription findEntity(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Prescription", id));
    }

    private PrescriptionResponse toResponse(Prescription p) {
        List<PrescriptionItemResponse> items = p.getItems().stream()
                .map(i -> PrescriptionItemResponse.builder()
                        .id(i.getId())
                        .medicineId(i.getMedicine().getId())
                        .medicineName(i.getMedicine().getName())
                        .dosage(i.getDosage())
                        .frequency(i.getFrequency())
                        .durationDays(i.getDurationDays())
                        .instructions(i.getInstructions())
                        .build())
                .collect(Collectors.toList());

        return PrescriptionResponse.builder()
                .id(p.getId())
                .appointmentId(p.getAppointment().getId())
                .patientId(p.getPatient().getId())
                .patientName(p.getPatient().getUser().getFullName())
                .doctorId(p.getDoctor().getId())
                .doctorName("Dr. " + p.getDoctor().getUser().getFullName())
                .diagnosis(p.getDiagnosis())
                .notes(p.getNotes())
                .aiSummary(p.getAiSummary())
                .pdfUrl(p.getPdfUrl())
                .items(items)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
