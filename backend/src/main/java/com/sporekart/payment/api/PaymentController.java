package com.sporekart.payment.api;

import com.sporekart.payment.api.PaymentDtos;
import com.sporekart.payment.application.PaymentService;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/payment", "/payment"})
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
            @RequestParam java.util.UUID id) {
        PaymentDtos.PaymentSummaryResponse response = paymentService.getPaymentSummary(type, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify-enrollment")
    public ResponseEntity<ApiResponse<PaymentDtos.VerifyEnrollmentPaymentResponse>> verifyEnrollmentPayment(
            @Valid @RequestBody PaymentDtos.VerifyEnrollmentPaymentRequest request) {
        PaymentDtos.VerifyEnrollmentPaymentResponse response = paymentService.verifyEnrollmentPayment(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
