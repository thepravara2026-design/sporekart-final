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
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.sporekart.shared.infrastructure.SecurityAuditService securityAuditService;

    @Value("${sporekart.shiprocket.webhook-token:}")
    private String configuredWebhookToken;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> handleShiprocketWebhook(
            @jakarta.validation.Valid @RequestBody ShippingDtos.ShiprocketWebhookPayload payload,
            @RequestHeader(value = "X-Shiprocket-Signature", required = false) String signature,
            @RequestHeader(value = "X-Shiprocket-Token", required = false) String token) {

        String suppliedToken = (token != null && !token.isBlank()) ? token : signature;

        // Fail-closed: If token is unconfigured, reject immediately with 500 rather than open access
        if (configuredWebhookToken == null || configuredWebhookToken.isBlank()) {
            log.error("Shiprocket webhook token is not configured on the server. Rejecting request fail-closed.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("WEBHOOK_CONFIGURATION_ERROR", "Webhook service is unconfigured"));
        }

        // Constant-time comparison
        if (suppliedToken == null || suppliedToken.isBlank() || !MessageDigest.isEqual(
                suppliedToken.trim().getBytes(StandardCharsets.UTF_8),
                configuredWebhookToken.trim().getBytes(StandardCharsets.UTF_8))) {
            log.warn("Unauthorized Shiprocket webhook rejection: missing or invalid signature/token");
            if (securityAuditService != null) {
                securityAuditService.recordSuspiciousWebhook("Shiprocket", "remote", "Unauthorized: invalid or missing Shiprocket webhook token");
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Unauthorized: invalid or missing Shiprocket webhook token"));
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
