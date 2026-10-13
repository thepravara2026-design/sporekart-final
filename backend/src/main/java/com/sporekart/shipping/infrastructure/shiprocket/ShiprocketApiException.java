package com.sporekart.shipping.infrastructure.shiprocket;

import lombok.Getter;
import org.springframework.http.HttpStatusCode;

@Getter
public class ShiprocketApiException extends RuntimeException {

    private final HttpStatusCode statusCode;
    private final String endpoint;
    private final String responseBody;

    public ShiprocketApiException(String message, HttpStatusCode statusCode, String endpoint, String responseBody) {
        super(String.format("%s [Endpoint: %s, Status: %s, Response: %s]",
                message, endpoint, statusCode, sanitizeResponseBody(responseBody)));
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        this.responseBody = responseBody;
    }

    public ShiprocketApiException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = null;
        this.endpoint = null;
        this.responseBody = null;
    }

    private static String sanitizeResponseBody(String body) {
        if (body == null) return "null";
        // Sanitize any bearer tokens that might appear in raw error dumps
        return body.replaceAll("(?i)\"token\"\\s*:\\s*\"[^\"]+\"", "\"token\":\"***REDACTED***\"");
    }
}
