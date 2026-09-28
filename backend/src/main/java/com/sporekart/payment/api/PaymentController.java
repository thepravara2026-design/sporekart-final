package com.sporekart.payment.api;

import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentDtos.InitiatePaymentResponse>> initiatePayment(
            @Valid @RequestBody PaymentDtos.InitiatePaymentRequest request) {
        PaymentDtos.InitiatePaymentResponse response = paymentService.initiatePayment(request.getOrderId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentDtos.VerifyPaymentResponse>> verifyPayment(
            @Valid @RequestBody PaymentDtos.VerifyPaymentRequest request) {
        PaymentDtos.VerifyPaymentResponse response = paymentService.verifyPayment(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<PaymentDtos.PaymentSummaryResponse>> getPaymentSummary(
            @RequestParam(defaultValue = "ORDER") String type,
            @RequestParam java.util.UUID id,
            @RequestHeader(name = "X-Session-ID", required = false) String sessionId,
            org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = extractUserId(authentication);
        PaymentDtos.PaymentSummaryResponse response = paymentService.getPaymentSummary(type, id, userId, sessionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private java.util.UUID extractUserId(org.springframework.security.core.Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                return java.util.UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }

    @PostMapping("/verify-enrollment")
    public ResponseEntity<ApiResponse<PaymentDtos.VerifyEnrollmentPaymentResponse>> verifyEnrollmentPayment(
            @Valid @RequestBody PaymentDtos.VerifyEnrollmentPaymentRequest request,
            org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new com.sporekart.shared.application.ForbiddenOperationException("Authentication required to verify training enrollment payment");
        }
        PaymentDtos.VerifyEnrollmentPaymentResponse response = paymentService.verifyEnrollmentPayment(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
