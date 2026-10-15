package com.sporekart.payment.application;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class RazorpayPaymentGateway implements PaymentGateway {

    @Value("${app.razorpay.key-id:}")
    private String keyId;

    @Value("${app.razorpay.key-secret:}")
    private String keySecret;

    @Value("${app.razorpay.webhook-secret:}")
    private String webhookSecret;

    @Value("${app.razorpay.mock-mode:false}")
    private boolean mockMode;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @Override
    public InitiatePaymentResult createPaymentOrder(UUID orderId, String orderNumber, BigDecimal amountInr) {
        String razorpayOrderId;
        if (isMockMode()) {
            razorpayOrderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 8);
        } else {
            if (keyId == null || keyId.trim().isEmpty() || keySecret == null || keySecret.trim().isEmpty()) {
                throw new IllegalStateException("Razorpay payment gateway credentials (key-id/key-secret) are not configured. Cannot process real payment order.");
            }
            try {
                RazorpayClient client = new RazorpayClient(keyId, keySecret);
                JSONObject orderRequest = new JSONObject();
                orderRequest.put("amount", amountInr.multiply(new BigDecimal("100")).longValue());
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", orderNumber);

                com.razorpay.Order rzpOrder = client.orders.create(orderRequest);
                razorpayOrderId = rzpOrder.get("id");
            } catch (RazorpayException e) {
                throw new RuntimeException("Failed to create Razorpay payment order: " + e.getMessage(), e);
            }
        }

        return InitiatePaymentResult.builder()
                .razorpayOrderId(razorpayOrderId)
                .amountInr(amountInr)
                .currency("INR")
                .razorpayKeyId(keyId)
                .orderId(orderId)
                .build();
    }

    @Override
    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
        if (signature == null || signature.trim().isEmpty()) {
            return false;
        }

        if (isMockMode()) {
            return !"mock_signature_invalid".equals(signature);
        }

        if ("mock_signature".equals(signature) || "mock_signature_bypass".equals(signature)) {
            return false;
        }

        if (keySecret == null || keySecret.trim().isEmpty()) {
            return false;
        }

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", signature);

            if (Utils.verifyPaymentSignature(options, keySecret)) {
                return true;
            }
            String expectedHmac = calculateHmacSha256(razorpayOrderId + "|" + razorpayPaymentId, keySecret);
            return java.security.MessageDigest.isEqual(
                    expectedHmac.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            String expectedHmac = calculateHmacSha256(razorpayOrderId + "|" + razorpayPaymentId, keySecret);
            return java.security.MessageDigest.isEqual(
                    expectedHmac.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        }
    }

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        if (rawBody == null || signatureHeader == null || signatureHeader.trim().isEmpty() || "invalid_signature".equals(signatureHeader)) {
            return false;
        }

        if (isMockMode()) {
            return true;
        }

        if (webhookSecret == null || webhookSecret.trim().isEmpty() || "mock_webhook_signature".equals(signatureHeader)) {
            return false;
        }

        try {
            if (Utils.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
                return true;
            }
            String calculated = calculateHmacSha256(rawBody, webhookSecret);
            return java.security.MessageDigest.isEqual(
                    calculated.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            String calculated = calculateHmacSha256(rawBody, webhookSecret);
            return java.security.MessageDigest.isEqual(
                    calculated.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.getBytes(StandardCharsets.UTF_8)
            );
        }
    }

    @Override
    public RefundResult refund(String razorpayPaymentId, BigDecimal amountInr, String reason) {
        String refundId = "rfnd_mock_" + UUID.randomUUID().toString().substring(0, 8);
        String status = "PROCESSED";

        if (!isMockMode()) {
            if (keyId == null || keyId.trim().isEmpty() || keySecret == null || keySecret.trim().isEmpty()) {
                throw new IllegalStateException("Razorpay gateway credentials are not configured for processing refunds.");
            }
            try {
                RazorpayClient client = new RazorpayClient(keyId, keySecret);
                JSONObject refundRequest = new JSONObject();
                refundRequest.put("amount", amountInr.multiply(new BigDecimal("100")).longValue());

                com.razorpay.Refund refund = client.payments.refund(razorpayPaymentId, refundRequest);
                refundId = refund.get("id");
                status = refund.get("status");
            } catch (RazorpayException e) {
                throw new RuntimeException("Failed to process Razorpay refund: " + e.getMessage(), e);
            }
        }

        return RefundResult.builder()
                .refundId(refundId)
                .razorpayPaymentId(razorpayPaymentId)
                .amountInr(amountInr)
                .status(status)
                .build();
    }

    @Override
    public GatewayPaymentDetails fetchPayment(String razorpayPaymentId) {
        if (isMockMode()) {
            String status = razorpayPaymentId != null && razorpayPaymentId.contains("failed") ? "failed" : "captured";
            Long amountPaise = null;
            if (razorpayPaymentId != null && razorpayPaymentId.contains("mismatched_amount")) {
                amountPaise = 1L;
            }
            return GatewayPaymentDetails.builder()
                    .paymentId(razorpayPaymentId)
                    .orderId(null)
                    .status(status)
                    .amountPaise(amountPaise)
                    .currency("INR")
                    .method("card")
                    .build();
        }

        if (keyId == null || keyId.trim().isEmpty() || keySecret == null || keySecret.trim().isEmpty()) {
            throw new IllegalStateException("Razorpay gateway credentials (key-id/key-secret) are not configured for fetching payment details.");
        }

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            com.razorpay.Payment rzpPayment = client.payments.fetch(razorpayPaymentId);

            Long amount = null;
            Object amtObj = rzpPayment.get("amount");
            if (amtObj instanceof Number) {
                amount = ((Number) amtObj).longValue();
            }

            return GatewayPaymentDetails.builder()
                    .paymentId(rzpPayment.get("id"))
                    .orderId(rzpPayment.get("order_id"))
                    .status(rzpPayment.get("status"))
                    .amountPaise(amount)
                    .currency(rzpPayment.get("currency"))
                    .method(rzpPayment.get("method"))
                    .email(rzpPayment.get("email"))
                    .contact(rzpPayment.get("contact"))
                    .build();
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to fetch Razorpay payment: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isMockMode() {
        if (mockMode) {
            return true;
        }
        if (activeProfile != null && (activeProfile.contains("test") || activeProfile.contains("dev"))) {
            return keyId == null || keyId.trim().isEmpty() || keyId.startsWith("rzp_test_mock");
        }
        return keyId != null && keyId.startsWith("rzp_test_mock");
    }

    private String calculateHmacSha256(String data, String secret) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKey);
            byte[] hmacData = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hmacData) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
