package com.sporekart.integration;

import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentGateway;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentEventRepository;
import com.sporekart.payment.infrastructure.PaymentRepository;
import com.sporekart.shipping.application.ShippingProvider;
import com.sporekart.shipping.application.ShippingService;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentStatus;
import com.sporekart.shipping.domain.ShipmentTracking;
import com.sporekart.shipping.infrastructure.ShipmentRepository;
import com.sporekart.shipping.infrastructure.ShipmentTrackingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * End-to-end Cross-Module Integration Scenarios:
 * Scenario A: Standard purchase and shipping
 * Scenario B: Payment success, shipping failure
 * Scenario C: Duplicate payment webhook / callback
 * Scenario D: Database migration and schema restart
 * Scenario E: Carrier recovery and reconciliation
 */
@ExtendWith(MockitoExtension.class)
public class CrossModuleRemediationScenariosTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentEventRepository paymentEventRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private OrderService orderService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private ShipmentTrackingRepository trackingRepository;

    @Mock
    private ShippingProvider shippingProvider;

    @InjectMocks
    private PaymentService paymentService;

    @InjectMocks
    private ShippingService shippingService;

    @Test
    @DisplayName("Scenario A: Standard purchase and shipping lifecycle")
    void scenarioA_standardPurchaseAndShippingLifecycle() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String rzpOrderId = "order_rzp_scenA";
        String rzpPaymentId = "pay_scenA_123";
        BigDecimal amountInr = new BigDecimal("1499.00");

        OrderAddressSnapshot addr = OrderAddressSnapshot.builder()
                .recipientName("John Doe")
                .phone("9876543210")
                .line1("Flat 101, Palm Grove")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .build();

        OrderResponse order = new OrderResponse();
        order.setId(orderId);
        order.setOrderNumber("ORD-SCEN-A");
        order.setUserId(userId);
        order.setTotalAmountInr(amountInr);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setShippingAddress(addr);

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(amountInr)
                .currency("INR")
                .status(PaymentStatus.INITIATED)
                .razorpayOrderId(rzpOrderId)
                .build();

        // Step 1: Payment Verification & Capture
        when(orderService.getOrderById(orderId)).thenReturn(order);
        when(paymentRepository.findByRazorpayOrderId(rzpOrderId)).thenReturn(Optional.of(payment));
        when(paymentGateway.verifySignature(rzpOrderId, rzpPaymentId, "valid_sig")).thenReturn(true);
        when(paymentGateway.fetchPayment(rzpPaymentId)).thenReturn(PaymentGateway.GatewayPaymentDetails.builder()
                .paymentId(rzpPaymentId)
                .orderId(rzpOrderId)
                .status("captured")
                .amountPaise(149900L)
                .currency("INR")
                .build());

        PaymentDtos.VerifyPaymentRequest verifyReq = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId(rzpOrderId)
                .razorpayPaymentId(rzpPaymentId)
                .razorpaySignature("valid_sig")
                .build();

        PaymentDtos.VerifyPaymentResponse verifyResp = paymentService.verifyPayment(verifyReq, userId, null);
        assertTrue(verifyResp.isSuccess());
        assertEquals(PaymentStatus.CAPTURED, payment.getStatus());

        // Step 2: Inventory decremented & Order transitioned to PAID
        verify(orderService).setRazorpayPaymentId(orderId, rzpPaymentId);
        verify(orderService).updateOrderStatus(orderId, OrderStatus.PAID, "Payment verified successfully", "PAYMENT_SERVICE");
        verify(orderService).confirmOrderInventory(orderId);

        // Step 3: Real Shipment Creation
        order.setStatus(OrderStatus.PAID);
        order.setRazorpayPaymentId(rzpPaymentId);

        ShippingProvider.CreateShipmentResult creationResult = ShippingProvider.CreateShipmentResult.builder()
                .providerShipmentId("888123")
                .awbCode("SR-LIVE-AWB-998877")
                .courierName("BlueDart Express")
                .status("AWB_ASSIGNED")
                .build();
        when(shippingProvider.createShipment(any())).thenReturn(creationResult);
        when(shipmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Shipment shipment = shippingService.createShipmentForOrder(orderId);

        assertNotNull(shipment);
        assertEquals("SR-LIVE-AWB-998877", shipment.getAwbCode());
        assertEquals("BlueDart Express", shipment.getCourierName());
        assertEquals(ShipmentStatus.AWB_ASSIGNED, shipment.getStatus());
        verify(orderService).updateOrderStatus(eq(orderId), eq(OrderStatus.SHIPPED), contains("SR-LIVE-AWB-998877"), eq("SHIPPING_SERVICE"));
    }

    @Test
    @DisplayName("Scenario B: Payment success, shipping failure preserves clean state without fake AWB")
    void scenarioB_paymentSuccessShippingFailurePreservesState() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String rzpOrderId = "order_rzp_scenB";
        String rzpPaymentId = "pay_scenB_456";
        BigDecimal amountInr = new BigDecimal("899.00");

        OrderAddressSnapshot addr = OrderAddressSnapshot.builder()
                .recipientName("Alice Smith")
                .phone("9876543211")
                .line1("House 42, Orchid Street")
                .city("Bengaluru")
                .state("Karnataka")
                .pincode("560001")
                .build();

        OrderResponse order = new OrderResponse();
        order.setId(orderId);
        order.setOrderNumber("ORD-SCEN-B");
        order.setUserId(userId);
        order.setTotalAmountInr(amountInr);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setShippingAddress(addr);

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(amountInr)
                .currency("INR")
                .status(PaymentStatus.INITIATED)
                .razorpayOrderId(rzpOrderId)
                .build();

        // Payment captured successfully
        when(orderService.getOrderById(orderId)).thenReturn(order);
        when(paymentRepository.findByRazorpayOrderId(rzpOrderId)).thenReturn(Optional.of(payment));
        when(paymentGateway.verifySignature(rzpOrderId, rzpPaymentId, "valid_sig")).thenReturn(true);
        when(paymentGateway.fetchPayment(rzpPaymentId)).thenReturn(PaymentGateway.GatewayPaymentDetails.builder()
                .paymentId(rzpPaymentId)
                .orderId(rzpOrderId)
                .status("captured")
                .amountPaise(89900L)
                .currency("INR")
                .build());

        PaymentDtos.VerifyPaymentRequest verifyReq = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(orderId)
                .razorpayOrderId(rzpOrderId)
                .razorpayPaymentId(rzpPaymentId)
                .razorpaySignature("valid_sig")
                .build();

        PaymentDtos.VerifyPaymentResponse verifyResp = paymentService.verifyPayment(verifyReq, userId, null);
        assertTrue(verifyResp.isSuccess());
        assertEquals(PaymentStatus.CAPTURED, payment.getStatus());

        // Carrier integration outage occurs
        order.setStatus(OrderStatus.PAID);
        when(shippingProvider.createShipment(any())).thenThrow(new IllegalStateException("Shiprocket API Gateway 503 Service Unavailable"));

        // Shipping creation throws controlled exception
        assertThrows(IllegalStateException.class, () -> shippingService.createShipmentForOrder(orderId));

        // Order remains in PAID status and is NOT marked SHIPPED
        verify(orderService, never()).updateOrderStatus(eq(orderId), eq(OrderStatus.SHIPPED), any(), any());
        // Verify no fake AWB or shipment record was persisted with fabricated identifiers
        verify(shipmentRepository, never()).save(argThat(s -> s.getAwbCode() != null && s.getAwbCode().startsWith("SR-")));
    }

    @Test
    @DisplayName("Scenario C: Duplicate payment webhook / callback deduplication")
    void scenarioC_duplicatePaymentWebhookDeduplication() {
        UUID orderId = UUID.randomUUID();
        String rzpOrderId = "order_rzp_scenC";
        String rzpPaymentId = "pay_scenC_789";

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .amountInr(new BigDecimal("500.00"))
                .status(PaymentStatus.CAPTURED) // Already captured by previous direct verification
                .razorpayOrderId(rzpOrderId)
                .razorpayPaymentId(rzpPaymentId)
                .build();

        when(paymentGateway.verifyWebhookSignature(any(), any())).thenReturn(true);
        when(paymentEventRepository.findByEventId("evt_rzp_dup_999")).thenReturn(Optional.of(new com.sporekart.payment.domain.PaymentEvent()));

        String rawBody = "{\"event\":\"payment.captured\",\"event_id\":\"evt_rzp_dup_999\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"" + rzpPaymentId + "\",\"order_id\":\"" + rzpOrderId + "\",\"amount\":50000,\"currency\":\"INR\",\"status\":\"captured\"}}}}";
        String response = paymentService.processWebhook(rawBody, "valid_sig");

        assertTrue(response.contains("already processed") || response.contains("idempotent"));

        // Verify no duplicate order status updates or duplicate inventory decrements occurred
        verify(orderService, never()).updateOrderStatus(any(), eq(OrderStatus.PAID), any(), any());
        verify(orderService, never()).confirmOrderInventory(any());
    }

    @Test
    @DisplayName("Scenario D: Database migration and schema restart parity check")
    void scenarioD_databaseMigrationAndSchemaRestartParityCheck() throws IOException {
        Path flywayDir = Paths.get("src/main/resources/db/migration");
        Path supabaseDir = Paths.get("supabase/migrations");

        assertTrue(Files.exists(flywayDir), "Flyway directory must exist");
        assertTrue(Files.exists(supabaseDir), "Supabase directory must exist");

        long flywayCount = Files.list(flywayDir).filter(Files::isRegularFile).count();
        long supabaseCount = Files.list(supabaseDir).filter(Files::isRegularFile).count();

        assertEquals(flywayCount, supabaseCount, "Flyway and Supabase migration counts must match");
        assertEquals(49, flywayCount, "Flyway must have exactly 49 migrations");
        assertEquals(49, supabaseCount, "Supabase must have exactly 49 migrations");

        // Verify V47 enables RLS and revokes permissions from anon and authenticated
        Path v47 = flywayDir.resolve("V47__enable_rls_and_restrict_anon.sql");
        String v47Sql = Files.readString(v47);
        assertTrue(v47Sql.contains("ENABLE ROW LEVEL SECURITY"));
        assertTrue(v47Sql.contains("REVOKE ALL ON TABLE public.%I FROM anon;"));
        assertTrue(v47Sql.contains("REVOKE ALL ON TABLE public.%I FROM authenticated;"));
    }

    @Test
    @DisplayName("Scenario E: Carrier recovery and reconciliation attaches real AWB and tracking")
    void scenarioE_carrierRecoveryAndReconciliation() {
        UUID shipmentId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        // Initial state: shipment created without immediate AWB (AWB_PENDING)
        Shipment shipment = Shipment.builder()
                .id(shipmentId)
                .orderId(orderId)
                .orderNumber("ORD-SCEN-E")
                .providerShipmentId("888456")
                .status(ShipmentStatus.AWB_PENDING)
                .shippingAddressJson("{\"recipientName\":\"Bob Dylan\",\"line1\":\"742 Evergreen Terrace\",\"city\":\"Mumbai\",\"state\":\"Maharashtra\",\"pincode\":\"400001\"}")
                .trackingEvents(new ArrayList<>())
                .build();

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Recovery: Provider generates AWB asynchronously
        Shipment assigned = shippingService.assignAwbForShipment(shipmentId, "SR-LIVE-REC-554433", "Delhivery Express", "12");
        assertEquals("SR-LIVE-REC-554433", assigned.getAwbCode());
        assertEquals("Delhivery Express", assigned.getCourierName());
        assertEquals(ShipmentStatus.AWB_ASSIGNED, assigned.getStatus());
        verify(orderService).updateOrderStatus(eq(orderId), eq(OrderStatus.SHIPPED), contains("AWB assigned: SR-LIVE-REC-554433"), eq("SHIPPING_SERVICE"));

        // Real tracking events arrive from carrier
        ShippingProvider.TrackingResult realTracking = ShippingProvider.TrackingResult.builder()
                .awbCode("SR-LIVE-REC-554433")
                .currentStatus("IN_TRANSIT")
                .location("Bhiwandi Sorting Hub")
                .activity("Package scanned at origin sorting hub")
                .timestamp("2026-11-13T10:00:00Z")
                .rawResponseJson("{\"status\":\"IN_TRANSIT\"}")
                .build();
        when(shippingProvider.trackShipment(any(), any())).thenReturn(realTracking);

        ShipmentTracking tracked = shippingService.updateTrackingStatus(shipmentId);
        assertNotNull(tracked);
        assertEquals(ShipmentStatus.IN_TRANSIT, tracked.getShipment().getStatus());
        assertEquals("Bhiwandi Sorting Hub", tracked.getLocation());
        assertEquals("Package scanned at origin sorting hub", tracked.getActivity());
    }
}
