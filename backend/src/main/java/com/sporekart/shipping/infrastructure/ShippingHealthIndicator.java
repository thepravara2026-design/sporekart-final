package com.sporekart.shipping.infrastructure;

import com.sporekart.shipping.application.ShippingProvider;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketTokenManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;

/**
 * HealthIndicator providing operational visibility into Shipping/Shiprocket integration.
 * Strictly adheres to security rules: never exposes passwords, tokens, or webhook secrets.
 */
@Slf4j
@Component("shippingHealthIndicator")
@RequiredArgsConstructor
public class ShippingHealthIndicator implements HealthIndicator {

    private final ShippingProvider shippingProvider;
    private final org.springframework.beans.factory.ObjectProvider<ShiprocketTokenManager> tokenManagerProvider;

    @Value("${sporekart.shiprocket.email:}")
    private String email;

    @Value("${sporekart.shiprocket.api-url:https://apiv2.shiprocket.in/v1/external}")
    private String apiUrl;

    private volatile Instant lastSuccessfulCheck;

    @Override
    public Health health() {
        try {
            boolean isMock = shippingProvider.isMockMode();
            boolean hasCredentials = StringUtils.hasText(email);
            boolean hasApiUrl = StringUtils.hasText(apiUrl) && apiUrl.startsWith("http");

            String authReadiness = "NOT_CONFIGURED";
            ShiprocketTokenManager tokenManager = tokenManagerProvider.getIfAvailable();
            if (tokenManager != null && tokenManager.getCachedToken() != null) {
                authReadiness = "AUTHENTICATED";
            } else if (hasCredentials) {
                authReadiness = "CONFIGURED";
            }

            Health.Builder builder;
            if (isMock) {
                builder = Health.up()
                        .withDetail("provider", "Shiprocket")
                        .withDetail("activeMode", "MOCK")
                        .withDetail("authReadiness", "MOCK_ACTIVE")
                        .withDetail("apiConnectivity", "SIMULATED")
                        .withDetail("lastSuccessfulCheck", Instant.now().toString());
                return builder.build();
            }

            // In LIVE mode: verify configuration readiness
            if (!hasCredentials || !hasApiUrl) {
                builder = Health.down()
                        .withDetail("provider", "Shiprocket")
                        .withDetail("activeMode", "LIVE")
                        .withDetail("authReadiness", authReadiness)
                        .withDetail("apiConnectivity", "UNCONFIGURED")
                        .withDetail("error", "Mandatory shipping provider configuration or credentials missing");
                return builder.build();
            }

            lastSuccessfulCheck = Instant.now();
            builder = Health.up()
                    .withDetail("provider", "Shiprocket")
                    .withDetail("activeMode", "LIVE")
                    .withDetail("authReadiness", authReadiness)
                    .withDetail("apiConnectivity", "CONFIGURED")
                    .withDetail("lastSuccessfulCheck", lastSuccessfulCheck.toString());

            return builder.build();
        } catch (Exception ex) {
            log.error("Failed to evaluate shipping health indicator: {}", ex.getMessage());
            return Health.down()
                    .withDetail("provider", "Shiprocket")
                    .withDetail("activeMode", shippingProvider != null && shippingProvider.isMockMode() ? "MOCK" : "LIVE")
                    .withDetail("error", "Shipping health check error: " + ex.getMessage())
                    .build();
        }
    }
}

