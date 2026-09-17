package com.sporekart.payment.api;

import com.sporekart.payment.application.PaymentService;
import com.sporekart.shared.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payment/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        String result = paymentService.processWebhook(rawBody, signature);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
