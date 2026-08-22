package com.hospital.hms.service.impl;

import com.hospital.hms.dto.response.AdminDashboardResponse;
import com.hospital.hms.dto.response.DoctorDashboardResponse;
import com.hospital.hms.entity.AuditLog;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.enums.AppointmentStatus;
import com.hospital.hms.entity.enums.RoomStatus;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.AppointmentService;
import com.hospital.hms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ReceptionistRepository receptionistRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;
    private final RoomRepository roomRepository;
    private final InventoryRepository inventoryRepository;
    private final AuditLogRepository auditLogRepository;
    private final AppointmentService appointmentService;

    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        LocalDate today = LocalDate.now();

        List<AdminDashboardResponse.RecentActivity> activities = auditLogRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10, Sort.by("createdAt").descending()))
                .getContent().stream()
                .map(this::toActivity)
                .collect(Collectors.toList());

        long availableBeds = roomRepository.countAvailableBeds() != null ? roomRepository.countAvailableBeds() : 0;
        long totalBeds = roomRepository.countTotalBeds() != null ? roomRepository.countTotalBeds() : 0;

        return AdminDashboardResponse.builder()
                .totalPatients(patientRepository.countBy())
                .totalDoctors(doctorRepository.countBy())
                .totalReceptionists(receptionistRepository.count())
                .todaysAppointmentCount(appointmentRepository.countByAppointmentDate(today))
                .pendingAppointmentCount(appointmentRepository.countByStatus(AppointmentStatus.PENDING))
                .completedAppointmentCount(appointmentRepository.countByStatus(AppointmentStatus.COMPLETED))
                .todaysRevenue(billRepository.sumRevenueOnDate(today))
                .availableBeds(availableBeds)
                .totalBeds(totalBeds)
                .lowStockMedicineCount(inventoryRepository.findLowStockItems().size())
                .recentActivities(activities)
                .build();
    }

    @Override
    public DoctorDashboardResponse getDoctorDashboard(Long doctorId) {
        LocalDate today = LocalDate.now();
        List<com.hospital.hms.dto.response.AppointmentResponse> todaysAppointments =
                appointmentService.getDoctorScheduleForDate(doctorId, today);

        long completedToday = todaysAppointments.stream()
                .filter(a -> AppointmentStatus.COMPLETED.name().equals(a.getStatus()))
                .count();

        long upcoming = todaysAppointments.stream()
                .filter(a -> AppointmentStatus.PENDING.name().equals(a.getStatus())
                        || AppointmentStatus.CONFIRMED.name().equals(a.getStatus()))
                .count();

        return DoctorDashboardResponse.builder()
                .todaysPatientCount(todaysAppointments.size())
                .upcomingAppointmentCount(upcoming)
                .completedTodayCount(completedToday)
                .todaysAppointments(todaysAppointments)
                .build();
    }

    private AdminDashboardResponse.RecentActivity toActivity(AuditLog log) {
        return AdminDashboardResponse.RecentActivity.builder()
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .performedBy(log.getUser() != null ? log.getUser().getFullName() : "System")
                .timestamp(log.getCreatedAt().format(TS_FORMAT))
                .build();
    }
}
