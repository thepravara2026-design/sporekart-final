package com.sporekart.payment;

import com.sporekart.order.domain.*;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PaymentSecurityTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Test
    void testMismatchedOrderIdPaymentVerificationIsRejected() {
        String dummyAddress = "{\"recipientName\":\"Test Customer\",\"phone\":\"+919999999999\",\"addressLine1\":\"123 Street\",\"city\":\"Pune\",\"state\":\"MH\",\"postalCode\":\"411001\"}";

        // Order A (Cheap Order: 100 INR)
        Order orderA = Order.builder()
                .orderNumber("ORD-TEST-A")
                .status(OrderStatus.PENDING_PAYMENT)
                .totalAmountInr(new BigDecimal("100.00"))
                .subtotalAmountInr(new BigDecimal("100.00"))
                .gstTotalAmountInr(BigDecimal.ZERO)
                .shippingFeeInr(BigDecimal.ZERO)
                .shippingAddressJson(dummyAddress)
                .razorpayOrderId("order_rzp_A_12345")
                .build();
        orderA = orderRepository.save(orderA);

        // Record Payment for Order A
        Payment paymentA = Payment.builder()
                .orderId(orderA.getId())
                .razorpayOrderId("order_rzp_A_12345")
                .amountInr(new BigDecimal("100.00"))
                .currency("INR")
                .status(PaymentStatus.INITIATED)
                .build();
        paymentRepository.save(paymentA);

        // Order B (Expensive Order: 10000 INR)
        Order orderB = Order.builder()
                .orderNumber("ORD-TEST-B")
                .status(OrderStatus.PENDING_PAYMENT)
                .totalAmountInr(new BigDecimal("10000.00"))
                .subtotalAmountInr(new BigDecimal("10000.00"))
                .gstTotalAmountInr(BigDecimal.ZERO)
                .shippingFeeInr(BigDecimal.ZERO)
                .shippingAddressJson(dummyAddress)
                .razorpayOrderId("order_rzp_B_99999")
                .build();
        orderB = orderRepository.save(orderB);

        // Attacker attempts to verify payment for Order B using Order A's razorpayOrderId
        PaymentDtos.VerifyPaymentRequest fraudRequest = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderB.getId()) // Attacker target
                .razorpayOrderId("order_rzp_A_12345") // Order A's razorpay ID
                .razorpayPaymentId("pay_mock_12345")
                .razorpaySignature("mock_signature")
                .build();

        final UUID orderBId = orderB.getId();
        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                paymentService.verifyPayment(fraudRequest)
        );

        assertTrue(exception.getMessage().contains("Mismatched order reference") || exception.getMessage().contains("mismatch"),
                "Expected rejection message for order mismatch");

        // Assert Order B is untouched and still PENDING_PAYMENT
        Order freshOrderB = orderRepository.findById(orderBId).orElseThrow();
        assertEquals(OrderStatus.PENDING_PAYMENT, freshOrderB.getStatus(), "Order B status must remain PENDING_PAYMENT");
    }
}
