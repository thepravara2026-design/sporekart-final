package com.sporekart.shared;

import com.sporekart.shared.infrastructure.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ContextPathRoutingTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;

    @BeforeEach
    void setUp() {
        adminToken = jwtTokenProvider.generateToken(java.util.UUID.randomUUID(), "admin@sporekart.in", "ROLE_ADMIN");
    }

    @Test
    void testAdminOrdersRouteIsReachable() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                "http://localhost:" + port + "/api/v1/admin/orders",
                HttpMethod.GET,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void testPaymentWebhookRouteIsReachable() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>("{}", headers);

        ResponseEntity<String> response = restTemplate.exchange(
                "http://localhost:" + port + "/api/v1/payment/webhook",
                HttpMethod.POST,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void testShippingWebhookRouteIsReachable() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>("{}", headers);

        ResponseEntity<String> response = restTemplate.exchange(
                "http://localhost:" + port + "/api/v1/shipping/webhook",
                HttpMethod.POST,
                entity,
                String.class
        );

        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void testGlobalSearchRouteIsReachable() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "http://localhost:" + port + "/api/v1/search?q=test",
                String.class
        );

        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void testSeoRouteIsReachable() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "http://localhost:" + port + "/api/v1/seo/sitemap.xml",
                String.class
        );

        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
