package com.sporekart.payment.infrastructure;

import com.razorpay.RazorpayException;
import com.sporekart.payment.application.PaymentGateway;
import com.sporekart.payment.application.RazorpayPaymentGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Test-only implementation of PaymentGateway.
 * Strictly active under the 'test' profile to isolate all mock behavior away from production code.
 */
@Slf4j
@Component
@Profile("test")
@Primary
public class TestPaymentGateway extends RazorpayPaymentGateway {

    @Override
    public boolean isMockMode() {
        return true;
    }

    @Override
    public InitiatePaymentResult createPaymentOrder(UUID orderId, String orderNumber, BigDecimal amountInr) {
        try {
            return super.createPaymentOrder(orderId, orderNumber, amountInr);
        } catch (Exception e) {
            log.info("Test profile simulated payment order generation for orderId={}", orderId);
            String mockOrderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 8);
            return InitiatePaymentResult.builder()
                    .razorpayOrderId(mockOrderId)
                    .amountInr(amountInr)
                    .currency("INR")
                    .razorpayKeyId("rzp_test_fake_test_key_id")
                    .orderId(orderId)
                    .build();
        }
    }

    @Override
    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
        if (signature == null || signature.trim().isEmpty()) {
            return false;
        }

        if (signature.toLowerCase().contains("invalid") || "bad_sig".equals(signature) || "mock_signature_invalid".equals(signature)) {
            return false;
        }

        if (super.verifySignature(razorpayOrderId, razorpayPaymentId, signature)) {
            return true;
        }

        return "mock_signature".equals(signature)
                || "test_signature".equals(signature)
                || "mock_sig".equals(signature)
                || "valid_mock_sig".equals(signature)
                || "mock_signature_valid".equals(signature)
                || signature.startsWith("sig_mock_")
                || signature.endsWith("_verified_sig");
    }

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.trim().isEmpty() || "invalid_signature".equalsIgnoreCase(signatureHeader)) {
            return false;
        }

        if (super.verifyWebhookSignature(rawBody, signatureHeader)) {
            return true;
        }

        return "mock_webhook_signature".equals(signatureHeader) || "test_signature".equals(signatureHeader);
    }

    @Override
    public GatewayPaymentDetails fetchPayment(String razorpayPaymentId) {
        if (razorpayPaymentId != null && (
                razorpayPaymentId.startsWith("pay_mock_")
                || razorpayPaymentId.startsWith("pay_simulated_")
                || razorpayPaymentId.startsWith("pay_fake_"))) {

            String status = razorpayPaymentId.contains("failed") ? "failed" : "captured";
            Long amountPaise = null;
            if (razorpayPaymentId.contains("mismatched_amount")) {
                amountPaise = 1L;
            }

            String method = "card";
            if (razorpayPaymentId.contains("upi") || razorpayPaymentId.contains("qr")) {
                method = "upi";
            } else if (razorpayPaymentId.contains("nb") || razorpayPaymentId.contains("netbanking")) {
                method = "netbanking";
            }

            return GatewayPaymentDetails.builder()
                    .paymentId(razorpayPaymentId)
                    .orderId(null)
                    .status(status)
                    .amountPaise(amountPaise)
                    .currency("INR")
                    .method(method)
                    .build();
        }

        try {
            return super.fetchPayment(razorpayPaymentId);
        } catch (Exception ex) {
            log.info("Test fallback for fetchPayment({}) -> simulated captured details", razorpayPaymentId);
            return GatewayPaymentDetails.builder()
                    .paymentId(razorpayPaymentId)
                    .orderId(null)
                    .status("captured")
                    .amountPaise(null)
                    .currency("INR")
                    .method("card")
                    .build();
        }
    }

    @Override
    public RefundResult refund(String razorpayPaymentId, BigDecimal amountInr, String reason) {
        try {
            return super.refund(razorpayPaymentId, amountInr, reason);
        } catch (Exception ex) {
            log.info("Test fallback for refund({}) -> simulated refund success", razorpayPaymentId);
            return RefundResult.builder()
                    .refundId("rfnd_mock_" + UUID.randomUUID().toString().substring(0, 8))
                    .razorpayPaymentId(razorpayPaymentId)
                    .amountInr(amountInr)
                    .status("PROCESSED")
                    .build();
        }
    }

    @Override
    public GatewayRefundDetails fetchRefund(String razorpayRefundId) {
        try {
            return super.fetchRefund(razorpayRefundId);
        } catch (Exception ex) {
            log.info("Test fallback for fetchRefund({}) -> simulated refund details", razorpayRefundId);
            String status = razorpayRefundId != null && razorpayRefundId.contains("failed") ? "failed" : "processed";
            return GatewayRefundDetails.builder()
                    .refundId(razorpayRefundId)
                    .paymentId("pay_mock_ref")
                    .status(status)
                    .amountPaise(10000L)
                    .currency("INR")
                    .build();
        }
    }

    @Override
    public RazorpayOrderResult createRawOrder(long amountPaise, String currency, String receipt) throws RazorpayException {
        try {
            return super.createRawOrder(amountPaise, currency, receipt);
        } catch (Exception ex) {
            log.info("Test fallback for createRawOrder -> simulated raw order");
            String mockOrderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 8);
            return RazorpayOrderResult.builder()
                    .orderId(mockOrderId)
                    .amount(amountPaise)
                    .currency((currency != null && !currency.trim().isEmpty()) ? currency.trim().toUpperCase() : "INR")
                    .receipt((receipt != null && !receipt.trim().isEmpty()) ? receipt.trim() : ("rcpt_" + UUID.randomUUID().toString().substring(0, 8)))
                    .keyId("rzp_test_fake_test_key_id")
                    .build();
        }
    }
}

