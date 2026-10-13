package com.sporekart.shipping.infrastructure.shiprocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Component
public class ShiprocketTokenManager {

    private final String email;
    private final String password;
    private final String apiUrl;
    private final RestClient authRestClient;

    private volatile String cachedToken;
    private volatile Instant tokenExpiresAt = Instant.MIN;

    @org.springframework.beans.factory.annotation.Autowired
    public ShiprocketTokenManager(
            @Value("${sporekart.shiprocket.email:}") String email,
            @Value("${sporekart.shiprocket.password:}") String password,
            @Value("${sporekart.shiprocket.api-url:https://apiv2.shiprocket.in/v1/external}") String apiUrl,
            @Value("${sporekart.shiprocket.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${sporekart.shiprocket.read-timeout-ms:10000}") int readTimeoutMs) {
        this.email = email;
        this.password = password;
        this.apiUrl = apiUrl;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.authRestClient = RestClient.builder()
                .baseUrl(apiUrl)
                .requestFactory(requestFactory)
                .build();
    }

    // Constructor for testing with custom RestClient
    public ShiprocketTokenManager(String email, String password, String apiUrl, RestClient authRestClient) {
        this.email = email;
        this.password = password;
        this.apiUrl = apiUrl;
        this.authRestClient = authRestClient;
    }

    /**
     * Retrieves a valid cached JWT token or initiates login if token is absent or expired.
     * Shiprocket tokens are valid for 10 days; we cache with a 9-day TTL buffer.
     */
    public synchronized String getValidToken() {
        Instant now = Instant.now();
        if (cachedToken != null && now.isBefore(tokenExpiresAt)) {
            log.debug("Using cached Shiprocket token (expires at: {})", tokenExpiresAt);
            return cachedToken;
        }

        log.info("Refreshing Shiprocket authentication token for account: {}", sanitizeEmail(email));
        return authenticate();
    }

    /**
     * Explicitly invalidates the cached token, forcing a fresh login on subsequent calls.
     */
    public synchronized void invalidateToken() {
        log.info("Invalidating cached Shiprocket authentication token");
        this.cachedToken = null;
        this.tokenExpiresAt = Instant.MIN;
    }

    /**
     * Visible for testing: inspect current cached token without refreshing.
     */
    public String getCachedToken() {
        return cachedToken;
    }

    /**
     * Visible for testing: inspect current expiration timestamp.
     */
    public Instant getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    private String authenticate() {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalStateException("Shiprocket credentials are not configured. Check SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
        }

        ShiprocketDtos.LoginRequest request = ShiprocketDtos.LoginRequest.builder()
                .email(email.trim())
                .password(password.trim())
                .build();

        try {
            ShiprocketDtos.LoginResponse response = authRestClient.post()
                    .uri("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ShiprocketDtos.LoginResponse.class);

            if (response == null || response.getToken() == null || response.getToken().isBlank()) {
                throw new ShiprocketApiException("Shiprocket login returned empty token response",
                        HttpStatusCode.valueOf(500), "/auth/login", "Empty token response");
            }

            this.cachedToken = response.getToken();
            // Shiprocket token valid for 10 days; safe TTL of 9 days
            this.tokenExpiresAt = Instant.now().plus(Duration.ofDays(9));
            log.info("Successfully authenticated with Shiprocket (Company ID: {}, token expires in 9 days)", response.getCompanyId());
            return this.cachedToken;

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("Shiprocket authentication failed with HTTP status: {} - {}", e.getStatusCode(), e.getStatusText());
            throw new ShiprocketApiException("Shiprocket authentication failed: " + e.getStatusText(),
                    e.getStatusCode(), "/auth/login", e.getResponseBodyAsString());
        } catch (ShiprocketApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Shiprocket authentication connection error: {}", e.getMessage());
            throw new ShiprocketApiException("Failed to connect to Shiprocket authentication service: " + e.getMessage(), e);
        }
    }

    private String sanitizeEmail(String emailInput) {
        if (emailInput == null || emailInput.isBlank()) return "empty";
        int atIndex = emailInput.indexOf('@');
        if (atIndex <= 1) return "***" + emailInput.substring(Math.max(0, atIndex));
        return emailInput.substring(0, 2) + "***" + emailInput.substring(atIndex);
    }
}
