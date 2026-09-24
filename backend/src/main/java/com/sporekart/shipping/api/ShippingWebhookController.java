package com.sporekart.shipping.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shipping.application.ShippingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/shipping/webhook")
@RequiredArgsConstructor
public class ShippingWebhookController {

    private final ShippingService shippingService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> handleShiprocketWebhook(
            @RequestBody ShippingDtos.ShiprocketWebhookPayload payload,
            @RequestHeader(value = "X-Shiprocket-Signature", required = false) String signature) {

        log.info("Received Shiprocket webhook for AWB: {}", payload.getAwb());

        if (payload.getAwb() != null && !payload.getAwb().trim().isEmpty()) {
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
