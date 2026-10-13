package com.sporekart.shipping.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shipping.application.ShippingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Slf4j
@RestController
@RequestMapping("/shipping/webhook")
@RequiredArgsConstructor
public class ShippingWebhookController {

    private final ShippingService shippingService;

    @Value("${sporekart.shiprocket.webhook-token:sporekart_shiprocket_webhook_secret_key_2026}")
    private String configuredWebhookToken;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> handleShiprocketWebhook(
            @RequestBody ShippingDtos.ShiprocketWebhookPayload payload,
            @RequestHeader(value = "X-Shiprocket-Signature", required = false) String signature,
            @RequestHeader(value = "X-Shiprocket-Token", required = false) String token) {

        String suppliedToken = (token != null && !token.isBlank()) ? token : signature;

        if (configuredWebhookToken != null && !configuredWebhookToken.isBlank()) {
            if (suppliedToken == null || !MessageDigest.isEqual(
                    suppliedToken.trim().getBytes(StandardCharsets.UTF_8),
                    configuredWebhookToken.trim().getBytes(StandardCharsets.UTF_8))) {
                log.warn("Unauthorized Shiprocket webhook rejection: missing or invalid signature/token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("UNAUTHORIZED", "Unauthorized: invalid or missing Shiprocket webhook token"));

            }
        }

        log.info("Received authenticated Shiprocket webhook for AWB: {}", payload != null ? payload.getAwb() : "null");

        if (payload != null && payload.getAwb() != null && !payload.getAwb().trim().isEmpty()) {
            shippingService.processWebhookUpdate(
                    payload.getAwb(),
                    payload.getCurrent_status(),
                    payload.getCurrent_location(),
                    payload.getScans(),
                    "{\"awb\":\"" + payload.getAwb() + "\",\"status\":\"" + payload.getCurrent_status() + "\"}"
            );
        }

        return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully"));
    }
}

