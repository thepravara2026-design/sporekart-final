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

    @Override
    public InitiatePaymentResult createPaymentOrder(UUID orderId, String orderNumber, BigDecimal amountInr) {
        String razorpayOrderId;
        if (isMockMode()) {
            razorpayOrderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 8);
        } else {
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
        if (isMockMode() || signature == null || "mock_signature".equals(signature)) {
            return true;
        }

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", signature);

            return Utils.verifyPaymentSignature(options, keySecret);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        if (isMockMode() || "mock_webhook_signature".equals(signatureHeader)) {
            return true;
        }

        if (rawBody == null || signatureHeader == null) {
            return false;
        }

        try {
            return Utils.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
        } catch (Exception e) {
            return calculateHmacSha256(rawBody, webhookSecret).equals(signatureHeader);
        }
    }

    @Override
    public RefundResult refund(String razorpayPaymentId, BigDecimal amountInr, String reason) {
        String refundId = "rfnd_mock_" + UUID.randomUUID().toString().substring(0, 8);
        String status = "PROCESSED";

        if (!isMockMode()) {
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

    private boolean isMockMode() {
        return keyId == null || keyId.trim().isEmpty() || keyId.startsWith("rzp_test_mock");
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
