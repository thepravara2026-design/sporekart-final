package com.sporekart.shipping.infrastructure.shiprocket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@ExtendWith(MockitoExtension.class)
class ShiprocketRestClientUnitTest {

    @Mock
    private ShiprocketTokenManager tokenManager;

    private MockRestServiceServer mockServer;
    private ShiprocketRestClient restClient;

    private static final String BASE_URL = "https://apiv2.shiprocket.in/v1/external";
    private static final String VALID_TOKEN = "jwt_valid_token_xyz";

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient springRestClient = builder.build();

        restClient = new ShiprocketRestClient(tokenManager, springRestClient);
    }

    @Test
    @DisplayName("RC-1: createAdhocOrder successfully submits consignment and parses shipment ID")
    void RC_1_createAdhocOrder_success() {
        when(tokenManager.getValidToken()).thenReturn(VALID_TOKEN);

        String responseJson = """
                {
                    "order_id": 10842031,
                    "shipment_id": 10793214,
                    "status": "NEW",
                    "status_code": 1
                }
                """;

        mockServer.expect(requestTo(BASE_URL + "/orders/create/adhoc"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                .andExpect(jsonPath("$.order_id").value("SK-ORD-1001"))
                .andExpect(jsonPath("$.pickup_location").value("Primary"))
                .andExpect(jsonPath("$.billing_pincode").value("411001"))
                .andExpect(jsonPath("$.weight").value(0.45))
                .andExpect(jsonPath("$.length").value(15))
                .andExpect(jsonPath("$.breadth").value(15))
                .andExpect(jsonPath("$.height").value(10))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        ShiprocketDtos.CreateAdhocOrderRequest request = ShiprocketDtos.CreateAdhocOrderRequest.builder()
                .orderId("SK-ORD-1001")
                .orderDate("2026-10-12 18:00")
                .pickupLocation("Primary")
                .billingCustomerName("Ramesh")
                .billingLastName("Patil")
                .billingAddress("123 Farm House Road")
                .billingCity("Pune")
                .billingPincode("411001")
                .billingState("Maharashtra")
                .billingCountry("India")
                .billingEmail("ramesh@example.com")
                .billingPhone("9876543210")
                .paymentMethod("Prepaid")
                .subTotal(new BigDecimal("400.00"))
                .length(new BigDecimal("15"))
                .breadth(new BigDecimal("15"))
                .height(new BigDecimal("10"))
                .weight(new BigDecimal("0.45"))
                .orderItems(List.of(
                        ShiprocketDtos.ShiprocketOrderItemDto.builder()
                                .name("Fresh Button Mushroom 200g")
                                .sku("MUSH-BTN-200G")
                                .units(2)
                                .sellingPrice(new BigDecimal("200.00"))
                                .build()
                ))
                .build();

        ShiprocketDtos.CreateOrderResponse response = restClient.createAdhocOrder(request);

        assertNotNull(response);
        assertEquals(10842031L, response.getOrderId());
        assertEquals(10793214L, response.getShipmentId());
        assertEquals("NEW", response.getStatus());
        mockServer.verify();
    }

    @Test
    @DisplayName("RC-2: assignAwb assigns courier partner and extracts AWB tracking number")
    void RC_2_assignAwb_success() {
        when(tokenManager.getValidToken()).thenReturn(VALID_TOKEN);

        String responseJson = """
                {
                    "response": {
                        "data": {
                            "awb_code": "143254326543",
                            "courier_name": "Delhivery Surface",
                            "courier_company_id": 1,
                            "assigned_date_time": "2026-10-12 18:05:00"
                        }
                    }
                }
                """;

        mockServer.expect(requestTo(BASE_URL + "/courier/assign/awb"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                .andExpect(jsonPath("$.shipment_id").value("10793214"))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        ShiprocketDtos.AssignAwbResponse response = restClient.assignAwb("10793214", null);

        assertNotNull(response);
        assertNotNull(response.getResponse());
        assertNotNull(response.getResponse().getData());
        assertEquals("143254326543", response.getResponse().getData().getAwbCode());
        assertEquals("Delhivery Surface", response.getResponse().getData().getCourierName());
        assertEquals(1L, response.getResponse().getData().getCourierCompanyId());
        mockServer.verify();
    }

    @Test
    @DisplayName("RC-3: requestPickup schedules warehouse courier vehicle collection")
    void RC_3_requestPickup_success() {
        when(tokenManager.getValidToken()).thenReturn(VALID_TOKEN);

        String responseJson = """
                {
                    "response": {
                        "pickup_status": 1,
                        "data": "Pickup scheduled successfully for 2026-10-13",
                        "pickup_token_number": "PU-20261012-98432"
                    }
                }
                """;

        mockServer.expect(requestTo(BASE_URL + "/courier/generate/pickup"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                .andExpect(jsonPath("$.shipment_id[0]").value("10793214"))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        ShiprocketDtos.GeneratePickupResponse response = restClient.requestPickup("10793214");

        assertNotNull(response);
        assertNotNull(response.getResponse());
        assertEquals(1, response.getResponse().getPickupStatus());
        assertEquals("PU-20261012-98432", response.getResponse().getPickupTokenNumber());
        mockServer.verify();
    }

    @Test
    @DisplayName("RC-4: trackAwb fetches live tracking scans and courier transit events")
    void RC_4_trackAwb_success() {
        when(tokenManager.getValidToken()).thenReturn(VALID_TOKEN);

        String responseJson = """
                {
                    "tracking_data": {
                        "track_status": 1,
                        "shipment_status": 6,
                        "shipment_track": [
                            {
                                "id": 10793214,
                                "current_status": "IN_TRANSIT",
                                "origin": "Pune",
                                "destination": "Bengaluru"
                            }
                        ],
                        "shipment_track_activities": [
                            {
                                "date": "2026-10-12 14:00:00",
                                "status": "In Transit",
                                "activity": "Bagged at Mumbai Central Hub",
                                "location": "Mumbai Hub"
                            }
                        ]
                    }
                }
                """;

        mockServer.expect(requestTo(BASE_URL + "/courier/track/awb/143254326543"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        ShiprocketDtos.TrackAwbResponse response = restClient.trackAwb("143254326543");

        assertNotNull(response);
        assertNotNull(response.getTrackingData());
        assertEquals(1, response.getTrackingData().getTrackStatus());
        assertEquals("IN_TRANSIT", response.getTrackingData().getShipmentTrack().get(0).getCurrentStatus());
        assertEquals("Bagged at Mumbai Central Hub", response.getTrackingData().getShipmentTrackActivities().get(0).getActivity());
        mockServer.verify();
    }

    @Test
    @DisplayName("RC-5: cancelOrder transmits cancellation request to Shiprocket")
    void RC_5_cancelOrder_success() {
        when(tokenManager.getValidToken()).thenReturn(VALID_TOKEN);

        String responseJson = """
                {
                    "status_code": 200,
                    "message": "Order cancelled successfully"
                }
                """;

        mockServer.expect(requestTo(BASE_URL + "/orders/cancel"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                .andExpect(jsonPath("$.ids[0]").value("10842031"))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        ShiprocketDtos.CancelOrderResponse response = restClient.cancelOrder("10842031");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode());
        assertEquals("Order cancelled successfully", response.getMessage());
        mockServer.verify();
    }

    @Test
    @DisplayName("RC-6: checkServiceability sends query parameters and returns available couriers")
    void RC_6_checkServiceability_success() {
        when(tokenManager.getValidToken()).thenReturn(VALID_TOKEN);

        String responseJson = """
                {
                    "status": 200,
                    "data": {
                        "available_courier_companies": [
                            {
                                "courier_company_id": 1,
                                "courier_name": "Blue Dart Express",
                                "rate": 78.50,
                                "etd": "2-3 Days",
                                "estimated_delivery_days": 3
                            }
                        ]
                    }
                }
                """;

        mockServer.expect(requestTo(org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.startsWith(BASE_URL + "/courier/serviceability/"),
                        org.hamcrest.Matchers.containsString("pickup_postcode=411001"),
                        org.hamcrest.Matchers.containsString("delivery_postcode=560001"),
                        org.hamcrest.Matchers.containsString("weight=0.5"),
                        org.hamcrest.Matchers.containsString("cod=0"))))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        ShiprocketDtos.ServiceabilityResponse response = restClient.checkServiceability(
                "411001", "560001", new BigDecimal("0.5"), false);

        assertNotNull(response);
        assertEquals(200, response.getStatus());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().getAvailableCourierCompanies().size());
        assertEquals("Blue Dart Express", response.getData().getAvailableCourierCompanies().get(0).getCourierName());
        assertEquals(new BigDecimal("78.50"), response.getData().getAvailableCourierCompanies().get(0).getRate());
        mockServer.verify();
    }

    @Test
    @DisplayName("RC-7: 401 Unauthorized invalidates cached token and transparently retries with fresh token")
    void RC_7_unauthorized401_triggersTokenInvalidationAndRetry() {
        String expiredToken = "expired_token_111";
        String freshToken = "fresh_token_222";

        when(tokenManager.getValidToken())
                .thenReturn(expiredToken)
                .thenReturn(freshToken);

        // First attempt returns 401
        mockServer.expect(requestTo(BASE_URL + "/courier/track/awb/143254326543"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("{\"message\":\"Token Expired\"}").contentType(MediaType.APPLICATION_JSON));

        // Retry attempt with fresh token succeeds
        String successJson = "{\"tracking_data\": {\"track_status\": 1, \"shipment_track\": [{\"current_status\": \"DELIVERED\"}]}}";
        mockServer.expect(requestTo(BASE_URL + "/courier/track/awb/143254326543"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + freshToken))
                .andRespond(withSuccess(successJson, MediaType.APPLICATION_JSON));

        ShiprocketDtos.TrackAwbResponse response = restClient.trackAwb("143254326543");

        assertNotNull(response);
        assertEquals("DELIVERED", response.getTrackingData().getShipmentTrack().get(0).getCurrentStatus());
        verify(tokenManager).invalidateToken();
        mockServer.verify();
    }

    @Test
    @DisplayName("RC-8: generateLabel retrieves shipping label download URL")
    void RC_8_generateLabel_success() {
        when(tokenManager.getValidToken()).thenReturn(VALID_TOKEN);

        String responseJson = """
                {
                    "label_created": 1,
                    "label_url": "https://s3.ap-south-1.amazonaws.com/shiprocket-manifest/label_10793214.pdf"
                }
                """;

        mockServer.expect(requestTo(BASE_URL + "/courier/generate/label"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer " + VALID_TOKEN))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        ShiprocketDtos.GenerateLabelResponse response = restClient.generateLabel("10793214");

        assertNotNull(response);
        assertEquals(1, response.getLabelCreated());
        assertEquals("https://s3.ap-south-1.amazonaws.com/shiprocket-manifest/label_10793214.pdf", response.getLabelUrl());
        mockServer.verify();
    }
}
