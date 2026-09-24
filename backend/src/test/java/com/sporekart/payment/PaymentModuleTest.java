package com.sporekart.payment;

import com.sporekart.cart.application.CartService;
import com.sporekart.cart.infrastructure.CartItemRepository;
import com.sporekart.cart.infrastructure.CartRepository;
import com.sporekart.catalog.api.CatalogDtos;
import com.sporekart.catalog.application.AdminCatalogService;
import com.sporekart.catalog.domain.*;
import com.sporekart.catalog.infrastructure.InventoryRecordRepository;
import com.sporekart.catalog.infrastructure.ProductOfferRepository;
import com.sporekart.catalog.infrastructure.ProductRepository;
import com.sporekart.catalog.infrastructure.ProductVariantRepository;
import com.sporekart.order.api.dto.CreateOrderRequest;
import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.order.infrastructure.OrderEventRepository;
import com.sporekart.order.infrastructure.OrderRepository;
import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentGateway;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.payment.domain.Payment;
import com.sporekart.payment.domain.PaymentStatus;
import com.sporekart.payment.infrastructure.PaymentEventRepository;
import com.sporekart.payment.infrastructure.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
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
public class PaymentModuleTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentEventRepository paymentEventRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderEventRepository orderEventRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private AdminCatalogService adminCatalogService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductOfferRepository offerRepository;

    @Autowired
    private InventoryRecordRepository inventoryRecordRepository;

    private Product testProduct;
    private ProductVariant testVariant;
    private OrderResponse testOrder;

    @BeforeEach
    void setUp() {
        paymentEventRepository.deleteAll();
        paymentRepository.deleteAll();
        orderEventRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        offerRepository.deleteAll();
        inventoryRecordRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();

        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        CatalogDtos.CreateProductRequest prodReq = new CatalogDtos.CreateProductRequest(
                null, "Milky Mushroom " + uniqueSuffix, "milky-" + uniqueSuffix,
                "Fresh Milky", ProductType.FRESH_MUSHROOM, ProductStatus.ACTIVE,
                "0709", new BigDecimal("5.00"), "Meta", "Desc", "url", true
        );
        testProduct = adminCatalogService.createProduct(prodReq);

        CatalogDtos.CreateVariantRequest varReq = new CatalogDtos.CreateVariantRequest(
                "200g", "SKU-MILKY-" + uniqueSuffix, new BigDecimal("100.00"),
                new BigDecimal("120.00"), 10, true
        );
        testVariant = adminCatalogService.addVariant(testProduct.getId(), varReq);

        String sessionId = "sess-pay-" + UUID.randomUUID();
        cartService.addItemToCart(null, sessionId, testVariant.getId(), 2);

        OrderAddressSnapshot address = OrderAddressSnapshot.builder()
                .recipientName("Aarav Sharma")
                .phone("+919876543210")
                .line1("456 Mushroom Lane")
                .city("Bangalore")
                .state("Karnataka")
                .pincode("560001")
                .build();

        CreateOrderRequest request = new CreateOrderRequest(null, address, "Payment Test Order");
        testOrder = orderService.createOrderFromCart(null, sessionId, null, request);
    }

    @Test
    void testRazorpayOrderCreation() {
        PaymentDtos.InitiatePaymentResponse response = paymentService.initiatePayment(testOrder.getId());

        assertNotNull(response);
        assertNotNull(response.getRazorpayOrderId());
        assertEquals(testOrder.getId(), response.getOrderId());
        assertEquals("INR", response.getCurrency());
        assertEquals(new BigDecimal("210.00"), response.getAmountInr());

        Payment payment = paymentRepository.findByRazorpayOrderId(response.getRazorpayOrderId()).orElseThrow();
        assertEquals(PaymentStatus.INITIATED, payment.getStatus());
    }

    @Test
    void testPaymentSignatureVerificationAndOrderCapture() {
        PaymentDtos.InitiatePaymentResponse initResp = paymentService.initiatePayment(testOrder.getId());

        PaymentDtos.VerifyPaymentRequest verifyReq = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(testOrder.getId())
                .razorpayOrderId(initResp.getRazorpayOrderId())
                .razorpayPaymentId("pay_mock_12345")
                .razorpaySignature("mock_signature")
                .build();

        PaymentDtos.VerifyPaymentResponse verifyResp = paymentService.verifyPayment(verifyReq);
        assertTrue(verifyResp.isSuccess());

        Payment payment = paymentRepository.findByRazorpayOrderId(initResp.getRazorpayOrderId()).orElseThrow();
        assertEquals(PaymentStatus.CAPTURED, payment.getStatus());

        OrderResponse updatedOrder = orderService.getOrderById(testOrder.getId());
        assertEquals(OrderStatus.PAID, updatedOrder.getStatus());
    }

    @Test
    void testAuthoritativeWebhookHandlingAndDuplicateIdempotency() {
        PaymentDtos.InitiatePaymentResponse initResp = paymentService.initiatePayment(testOrder.getId());
        String eventId = "evt_" + UUID.randomUUID();

        String rawWebhookPayload = "{\n" +
                "  \"event\": \"payment.captured\",\n" +
                "  \"event_id\": \"" + eventId + "\",\n" +
                "  \"payload\": {\n" +
                "    \"payment\": {\n" +
                "      \"entity\": {\n" +
                "        \"id\": \"pay_wh_9999\",\n" +
                "        \"order_id\": \"" + initResp.getRazorpayOrderId() + "\",\n" +
                "        \"amount\": 21000\n" +
                "      }\n" +
                "    }\n" +
                "  }\n" +
                "}";

        // 1st Webhook Execution
        String res1 = paymentService.processWebhook(rawWebhookPayload, "mock_webhook_signature");
        assertTrue(res1.contains("processed successfully"));

        OrderResponse order1 = orderService.getOrderById(testOrder.getId());
        assertEquals(OrderStatus.PAID, order1.getStatus());

        // 2nd Duplicate Webhook Execution (Idempotency Check)
        String res2 = paymentService.processWebhook(rawWebhookPayload, "mock_webhook_signature");
        assertTrue(res2.contains("idempotent ignore"));
    }

    @Test
    void testRefundProcessing() {
        PaymentDtos.InitiatePaymentResponse initResp = paymentService.initiatePayment(testOrder.getId());
        PaymentDtos.VerifyPaymentRequest verifyReq = PaymentDtos.VerifyPaymentRequest.builder()
                .orderId(testOrder.getId())
                .razorpayOrderId(initResp.getRazorpayOrderId())
                .razorpayPaymentId("pay_mock_refund")
                .razorpaySignature("mock_signature")
                .build();
        paymentService.verifyPayment(verifyReq);

        PaymentGateway.RefundResult refundResult = paymentService.refundPayment(testOrder.getId(), new BigDecimal("210.00"), "Product return requested");

        assertNotNull(refundResult);
        assertNotNull(refundResult.getRefundId());

        OrderResponse refundedOrder = orderService.getOrderById(testOrder.getId());
        assertEquals(OrderStatus.REFUNDED, refundedOrder.getStatus());
    }
}
