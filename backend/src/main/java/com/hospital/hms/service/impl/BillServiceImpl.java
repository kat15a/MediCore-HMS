package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.BillItemRequest;
import com.hospital.hms.dto.request.BillRequest;
import com.hospital.hms.dto.request.PaymentRequest;
import com.hospital.hms.dto.response.BillItemResponse;
import com.hospital.hms.dto.response.BillResponse;
import com.hospital.hms.dto.response.PaymentResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.entity.enums.BillItemType;
import com.hospital.hms.entity.enums.BillStatus;
import com.hospital.hms.entity.enums.PaymentMethod;
import com.hospital.hms.entity.enums.PaymentStatus;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.*;
import com.hospital.hms.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public BillResponse create(BillRequest request, Long createdByUserId) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", request.getPatientId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Appointment", request.getAppointmentId()));
        }

        Room room = null;
        if (request.getRoomId() != null) {
            room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Room", request.getRoomId()));
        }

        User createdBy = createdByUserId != null ? userRepository.findById(createdByUserId).orElse(null) : null;

        Bill bill = Bill.builder()
                .patient(patient)
                .appointment(appointment)
                .room(room)
                .billNumber(generateBillNumber())
                .status(BillStatus.PENDING)
                .dueDate(parseDate(request.getDueDate()))
                .createdBy(createdBy)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (BillItemRequest itemReq : request.getItems()) {
            int quantity = itemReq.getQuantity() != null ? itemReq.getQuantity() : 1;
            BigDecimal lineTotal = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(quantity));
            BillItem item = BillItem.builder()
                    .itemType(parseItemType(itemReq.getItemType()))
                    .description(itemReq.getDescription())
                    .quantity(quantity)
                    .unitPrice(itemReq.getUnitPrice())
                    .lineTotal(lineTotal)
                    .build();
            bill.addItem(item);
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal tax = request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(tax).subtract(discount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Total amount cannot be negative — check tax and discount values");
        }

        bill.setSubtotal(subtotal);
        bill.setTaxAmount(tax);
        bill.setDiscountAmount(discount);
        bill.setTotalAmount(total);

        return toResponse(billRepository.save(bill));
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BillResponse> getByPatient(Long patientId, Pageable pageable) {
        return billRepository.findByPatient_Id(patientId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BillResponse> getAll(Pageable pageable) {
        return billRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public PaymentResponse recordPayment(PaymentRequest request) {
        Bill bill = findEntity(request.getBillId());

        if (bill.getStatus() == BillStatus.CANCELLED) {
            throw new BadRequestException("Cannot record a payment against a cancelled bill");
        }
        if (bill.getStatus() == BillStatus.PAID) {
            throw new BadRequestException("This bill is already fully paid");
        }

        BigDecimal balanceBefore = bill.getBalanceDue();
        if (request.getAmount().compareTo(balanceBefore) > 0) {
            throw new BadRequestException(
                    "Payment amount (" + request.getAmount() + ") exceeds the outstanding balance (" + balanceBefore + ")");
        }

        Payment payment = Payment.builder()
                .bill(bill)
                .amount(request.getAmount())
                .paymentMethod(parsePaymentMethod(request.getPaymentMethod()))
                .transactionRef(request.getTransactionRef())
                .status(PaymentStatus.SUCCESS)
                .paidAt(LocalDateTime.now())
                .build();
        payment = paymentRepository.save(payment);

        bill.getPayments().add(payment);
        BigDecimal balanceAfter = bill.getBalanceDue();
        bill.setStatus(balanceAfter.compareTo(BigDecimal.ZERO) <= 0 ? BillStatus.PAID : BillStatus.PARTIALLY_PAID);
        billRepository.save(bill);

        return toPaymentResponse(payment);
    }

    @Override
    public void cancel(Long id) {
        Bill bill = findEntity(id);
        if (!bill.getPayments().isEmpty()) {
            throw new BadRequestException("Cannot cancel a bill that already has recorded payments");
        }
        bill.setStatus(BillStatus.CANCELLED);
        billRepository.save(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getRevenueOnDate(LocalDate date) {
        BigDecimal revenue = billRepository.sumRevenueOnDate(date);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    private Bill findEntity(Long id) {
        return billRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Bill", id));
    }

    private String generateBillNumber() {
        String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "BILL-" + stamp + "-" + (int) (Math.random() * 900 + 100);
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid date format, expected yyyy-MM-dd: " + value);
        }
    }

    private BillItemType parseItemType(String value) {
        try {
            return BillItemType.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid bill item type: " + value);
        }
    }

    private PaymentMethod parsePaymentMethod(String value) {
        try {
            return PaymentMethod.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid payment method: " + value);
        }
    }

    private BillResponse toResponse(Bill bill) {
        List<BillItemResponse> items = bill.getItems().stream()
                .map(i -> BillItemResponse.builder()
                        .id(i.getId())
                        .itemType(i.getItemType().name())
                        .description(i.getDescription())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .lineTotal(i.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        List<PaymentResponse> payments = bill.getPayments().stream()
                .map(this::toPaymentResponse)
                .collect(Collectors.toList());

        return BillResponse.builder()
                .id(bill.getId())
                .patientId(bill.getPatient().getId())
                .patientName(bill.getPatient().getUser().getFullName())
                .appointmentId(bill.getAppointment() != null ? bill.getAppointment().getId() : null)
                .roomId(bill.getRoom() != null ? bill.getRoom().getId() : null)
                .billNumber(bill.getBillNumber())
                .subtotal(bill.getSubtotal())
                .taxAmount(bill.getTaxAmount())
                .discountAmount(bill.getDiscountAmount())
                .totalAmount(bill.getTotalAmount())
                .amountPaid(bill.getAmountPaid())
                .balanceDue(bill.getBalanceDue())
                .status(bill.getStatus().name())
                .dueDate(bill.getDueDate())
                .createdAt(bill.getCreatedAt())
                .items(items)
                .payments(payments)
                .build();
    }

    private PaymentResponse toPaymentResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .billId(p.getBill().getId())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod().name())
                .transactionRef(p.getTransactionRef())
                .status(p.getStatus().name())
                .paidAt(p.getPaidAt())
                .build();
    }
}
