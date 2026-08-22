package com.hospital.hms.service.impl;

import com.hospital.hms.dto.request.BillItemRequest;
import com.hospital.hms.dto.request.BillRequest;
import com.hospital.hms.dto.request.PaymentRequest;
import com.hospital.hms.dto.response.BillResponse;
import com.hospital.hms.dto.response.PaymentResponse;
import com.hospital.hms.entity.Bill;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.entity.enums.BillStatus;
import com.hospital.hms.entity.enums.PaymentStatus;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillServiceImplTest {

    @Mock private BillRepository billRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private UserRepository userRepository;
    @Mock private PaymentRepository paymentRepository;

    @InjectMocks
    private BillServiceImpl billService;

    private Patient patient;

    @BeforeEach
    void setUp() {
        Role patientRole = Role.builder().id(4L).name(Role.PATIENT).build();
        User patientUser = User.builder().id(1L).firstName("Jane").lastName("Doe").role(patientRole).build();
        patient = Patient.builder().id(1L).user(patientUser).build();
    }

    @Test
    void create_computesTotalsCorrectly_fromLineItemsTaxAndDiscount() {
        BillRequest request = BillRequest.builder()
                .patientId(1L)
                .items(java.util.List.of(
                        BillItemRequest.builder().itemType("CONSULTATION").description("Visit").quantity(1).unitPrice(new BigDecimal("100.00")).build(),
                        BillItemRequest.builder().itemType("MEDICINE").description("Amoxicillin").quantity(2).unitPrice(new BigDecimal("15.00")).build()
                ))
                .taxAmount(new BigDecimal("13.00"))
                .discountAmount(new BigDecimal("10.00"))
                .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));

        BillResponse response = billService.create(request, 99L);

        // subtotal = 100 + (2*15) = 130 ; total = 130 + 13 - 10 = 133
        assertThat(response.getSubtotal()).isEqualByComparingTo("130.00");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("133.00");
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getBillNumber()).startsWith("BILL-");
    }

    @Test
    void create_throwsBadRequestException_whenDiscountExceedsSubtotalPlusTax() {
        BillRequest request = BillRequest.builder()
                .patientId(1L)
                .items(java.util.List.of(
                        BillItemRequest.builder().itemType("CONSULTATION").description("Visit").quantity(1).unitPrice(new BigDecimal("50.00")).build()
                ))
                .discountAmount(new BigDecimal("100.00"))
                .build();

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));

        assertThatThrownBy(() -> billService.create(request, 99L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("negative");

        verify(billRepository, never()).save(any());
    }

    @Test
    void recordPayment_marksBillPartiallyPaid_whenPaymentLessThanBalance() {
        Bill bill = Bill.builder()
                .id(5L).patient(patient)
                .totalAmount(new BigDecimal("100.00"))
                .status(BillStatus.PENDING)
                .build();
        when(billRepository.findById(5L)).thenReturn(Optional.of(bill));
        when(paymentRepository.save(any())).thenAnswer(inv -> {
            var p = (com.hospital.hms.entity.Payment) inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentRequest paymentRequest = PaymentRequest.builder().billId(5L).amount(new BigDecimal("40.00")).paymentMethod("CASH").build();
        PaymentResponse response = billService.recordPayment(paymentRequest);

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS.name());
        assertThat(bill.getStatus()).isEqualTo(BillStatus.PARTIALLY_PAID);
    }

    @Test
    void recordPayment_marksBillPaid_whenPaymentSettlesFullBalance() {
        Bill bill = Bill.builder()
                .id(6L).patient(patient)
                .totalAmount(new BigDecimal("50.00"))
                .status(BillStatus.PENDING)
                .build();
        when(billRepository.findById(6L)).thenReturn(Optional.of(bill));
        when(paymentRepository.save(any())).thenAnswer(inv -> {
            var p = (com.hospital.hms.entity.Payment) inv.getArgument(0);
            p.setId(2L);
            return p;
        });
        when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentRequest paymentRequest = PaymentRequest.builder().billId(6L).amount(new BigDecimal("50.00")).paymentMethod("CARD").build();
        billService.recordPayment(paymentRequest);

        assertThat(bill.getStatus()).isEqualTo(BillStatus.PAID);
    }

    @Test
    void recordPayment_throwsBadRequestException_whenAmountExceedsBalanceDue() {
        Bill bill = Bill.builder()
                .id(7L).patient(patient)
                .totalAmount(new BigDecimal("50.00"))
                .status(BillStatus.PENDING)
                .build();
        when(billRepository.findById(7L)).thenReturn(Optional.of(bill));

        PaymentRequest paymentRequest = PaymentRequest.builder().billId(7L).amount(new BigDecimal("999.00")).paymentMethod("CARD").build();

        assertThatThrownBy(() -> billService.recordPayment(paymentRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exceeds");

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void recordPayment_throwsBadRequestException_whenBillAlreadyPaid() {
        Bill bill = Bill.builder().id(8L).patient(patient).totalAmount(new BigDecimal("50.00")).status(BillStatus.PAID).build();
        when(billRepository.findById(8L)).thenReturn(Optional.of(bill));

        PaymentRequest paymentRequest = PaymentRequest.builder().billId(8L).amount(new BigDecimal("10.00")).paymentMethod("CASH").build();

        assertThatThrownBy(() -> billService.recordPayment(paymentRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already fully paid");
    }

    @Test
    void cancel_throwsBadRequestException_whenBillHasPayments() {
        Bill bill = Bill.builder().id(9L).patient(patient).totalAmount(new BigDecimal("50.00")).status(BillStatus.PARTIALLY_PAID).build();
        bill.getPayments().add(com.hospital.hms.entity.Payment.builder().id(1L).amount(new BigDecimal("10.00")).build());
        when(billRepository.findById(9L)).thenReturn(Optional.of(bill));

        assertThatThrownBy(() -> billService.cancel(9L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already has recorded payments");
    }

    @Test
    void cancel_setsStatusCancelled_whenNoPaymentsExist() {
        Bill bill = Bill.builder().id(10L).patient(patient).totalAmount(new BigDecimal("50.00")).status(BillStatus.PENDING).build();
        when(billRepository.findById(10L)).thenReturn(Optional.of(bill));
        when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));

        billService.cancel(10L);

        assertThat(bill.getStatus()).isEqualTo(BillStatus.CANCELLED);
    }
}
