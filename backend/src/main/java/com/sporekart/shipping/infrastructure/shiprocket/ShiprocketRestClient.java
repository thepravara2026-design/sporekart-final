package com.sporekart.shipping.infrastructure.shiprocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

@Slf4j
@Component
public class ShiprocketRestClient {

    private final ShiprocketTokenManager tokenManager;
    private final RestClient restClient;

    @org.springframework.beans.factory.annotation.Autowired
    public ShiprocketRestClient(
            ShiprocketTokenManager tokenManager,
            @Value("${sporekart.shiprocket.api-url:https://apiv2.shiprocket.in/v1/external}") String apiUrl,
            @Value("${sporekart.shiprocket.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${sporekart.shiprocket.read-timeout-ms:10000}") int readTimeoutMs) {
        this.tokenManager = tokenManager;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(apiUrl)
                .requestFactory(requestFactory)
                .build();
    }

    // Constructor for testing with mock RestClient
    public ShiprocketRestClient(ShiprocketTokenManager tokenManager, RestClient restClient) {
        this.tokenManager = tokenManager;
        this.restClient = restClient;
    }

    /**
     * OP-ORD-01: Create adhoc order and consignment in Shiprocket.
     */
    public ShiprocketDtos.CreateOrderResponse createAdhocOrder(ShiprocketDtos.CreateAdhocOrderRequest request) {
        return executeWithAuth("POST /orders/create/adhoc", token ->
                restClient.post()
                        .uri("/orders/create/adhoc")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(request)
                        .retrieve()
                        .body(ShiprocketDtos.CreateOrderResponse.class)
        );
    }

    /**
     * OP-AWB-01: Courier Allocation & AWB Assignment.
     */
    public ShiprocketDtos.AssignAwbResponse assignAwb(String shipmentId, String courierId) {
        ShiprocketDtos.AssignAwbRequest request = ShiprocketDtos.AssignAwbRequest.builder()
                .shipmentId(shipmentId)
                .courierId(courierId != null && !courierId.isBlank() ? courierId : null)
                .build();

        return executeWithAuth("POST /courier/assign/awb", token ->
                restClient.post()
                        .uri("/courier/assign/awb")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(request)
                        .retrieve()
                        .body(ShiprocketDtos.AssignAwbResponse.class)
        );
    }

    /**
     * OP-PICK-01: Request Courier Pickup.
     */
    public ShiprocketDtos.GeneratePickupResponse requestPickup(String shipmentId) {
        ShiprocketDtos.GeneratePickupRequest request = ShiprocketDtos.GeneratePickupRequest.builder()
                .shipmentId(Collections.singletonList(shipmentId))
                .build();

        return executeWithAuth("POST /courier/generate/pickup", token ->
                restClient.post()
                        .uri("/courier/generate/pickup")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(request)
                        .retrieve()
                        .body(ShiprocketDtos.GeneratePickupResponse.class)
        );
    }

    /**
     * OP-TRK-01: Track Shipment Status by AWB Code.
     */
    public ShiprocketDtos.TrackAwbResponse trackAwb(String awbCode) {
        if (awbCode == null || awbCode.isBlank()) {
            throw new IllegalArgumentException("AWB code cannot be blank");
        }

        String sanitizedAwb = awbCode.trim();
        return executeWithAuth("GET /courier/track/awb/" + sanitizedAwb, token ->
                restClient.get()
                        .uri("/courier/track/awb/{awbCode}", sanitizedAwb)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .body(ShiprocketDtos.TrackAwbResponse.class)
        );
    }

    /**
     * OP-CAN-01: Cancel Order Consignment.
     */
    public ShiprocketDtos.CancelOrderResponse cancelOrder(String orderId) {
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("Order ID cannot be blank");
        }

        ShiprocketDtos.CancelOrderRequest request = ShiprocketDtos.CancelOrderRequest.builder()
                .ids(Collections.singletonList(orderId.trim()))
                .build();

        return executeWithAuth("POST /orders/cancel", token ->
                restClient.post()
                        .uri("/orders/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(request)
                        .retrieve()
                        .body(ShiprocketDtos.CancelOrderResponse.class)
        );
    }

    /**
     * OP-SERV-01: Check Pincode & Courier Serviceability.
     */
    public ShiprocketDtos.ServiceabilityResponse checkServiceability(
            String pickupPostcode, String deliveryPostcode, BigDecimal weightKg, boolean cod) {

        return executeWithAuth("GET /courier/serviceability/", token ->
                restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/courier/serviceability/")
                                .queryParam("pickup_postcode", pickupPostcode)
                                .queryParam("delivery_postcode", deliveryPostcode)
                                .queryParam("weight", weightKg != null ? weightKg.toPlainString() : "0.5")
                                .queryParam("cod", cod ? "1" : "0")
                                .build())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .body(ShiprocketDtos.ServiceabilityResponse.class)
        );
    }

    /**
     * OP-LBL-01: Generate Shipping Label PDF.
     */
    public ShiprocketDtos.GenerateLabelResponse generateLabel(String shipmentId) {
        return executeWithAuth("POST /courier/generate/label", token ->
                restClient.post()
                        .uri("/courier/generate/label")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Collections.singletonMap("shipment_id", Collections.singletonList(shipmentId)))
                        .retrieve()
                        .body(ShiprocketDtos.GenerateLabelResponse.class)
        );
    }

    /**
     * Centralized execution wrapper with token injection, 401 re-authentication retry, and exception translation.
     */
    private <T> T executeWithAuth(String endpointDescription, Function<String, T> action) {
        String token = tokenManager.getValidToken();
        try {
            return action.apply(token);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("Shiprocket returned 401 Unauthorized for {}; invalidating cached token and retrying once", endpointDescription);
            tokenManager.invalidateToken();
            String freshToken = tokenManager.getValidToken();
            try {
                return action.apply(freshToken);
            } catch (HttpClientErrorException | HttpServerErrorException ex) {
                throw new ShiprocketApiException("Shiprocket request failed after re-auth: " + ex.getStatusText(),
                        ex.getStatusCode(), endpointDescription, ex.getResponseBodyAsString());
            }
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            throw new ShiprocketApiException("Shiprocket request failed: " + e.getStatusText(),
                    e.getStatusCode(), endpointDescription, e.getResponseBodyAsString());
        } catch (ShiprocketApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ShiprocketApiException("Shiprocket request error on " + endpointDescription + ": " + e.getMessage(), e);
        }
    }
}
