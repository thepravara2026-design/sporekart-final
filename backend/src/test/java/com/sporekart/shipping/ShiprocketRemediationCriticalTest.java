package com.sporekart.shipping;

import com.sporekart.order.api.dto.OrderResponse;
import com.sporekart.order.application.OrderService;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderStatus;
import com.sporekart.shared.infrastructure.SecurityConfigValidator;
import com.sporekart.shipping.application.*;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentStatus;
import com.sporekart.shipping.infrastructure.ShipmentRepository;
import com.sporekart.shipping.infrastructure.ShipmentTrackingRepository;
import com.sporekart.shipping.infrastructure.ShippingHealthIndicator;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketApiException;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketRestClient;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketTokenManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ShiprocketRemediationCriticalTest {

    @Mock
    private ShiprocketRestClient shiprocketRestClient;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private ShipmentTrackingRepository trackingRepository;

    @Mock
    private OrderService orderService;

    private ShiprocketAdapter adapter;
    private ShiprocketMockAdapter mockAdapter;
    private ShiprocketLiveAdapter liveAdapter;

    @BeforeEach
    void setUp() {
        adapter = new ShiprocketAdapter(shiprocketRestClient);
        ReflectionTestUtils.setField(adapter, "email", "pilot@sporekart.in");
        ReflectionTestUtils.setField(adapter, "password", "SecurePilotPass123");
        ReflectionTestUtils.setField(adapter, "useRealShiprocket", true);
        ReflectionTestUtils.setField(adapter, "defaultPickupLocation", "Primary");

        mockAdapter = new ShiprocketMockAdapter();
        liveAdapter = new ShiprocketLiveAdapter(shiprocketRestClient);
        ReflectionTestUtils.setField(liveAdapter, "email", "pilot@sporekart.in");
        ReflectionTestUtils.setField(liveAdapter, "password", "SecurePilotPass123");
        ReflectionTestUtils.setField(liveAdapter, "defaultPickupLocation", "Primary");
    }

    private ShippingProvider.CreateShipmentCommand createValidCommand() {
        return ShippingProvider.CreateShipmentCommand.builder()
                .orderId(UUID.randomUUID())
                .orderNumber("ORD-2026-CRIT-001")
                .recipientName("Devendra Sharma")
                .phone("9876543210")
                .email("devendra@sporekart.in")
                .addressLine1("Plot 42, Green Valley")
                .addressLine2("Near Krishi Bhavan")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .totalAmountInr(new BigDecimal("750.00"))
                .weightKg(new BigDecimal("0.500"))
                .lengthCm(new BigDecimal("15.00"))
                .breadthCm(new BigDecimal("15.00"))
                .heightCm(new BigDecimal("10.00"))
                .pickupLocation("Primary")
                .pickupPincode("411001")
                .items(List.of(ShippingProvider.ShipmentItemCommand.builder()
                        .title("Oyster Spawn")
                        .sku("SPWN-001")
                        .quantity(2)
                        .priceInr(new BigDecimal("375.00"))
                        .build()))
                .build();
    }

    // =========================================================================
    // WORK PACKAGE 01: SHIPROCKET PRODUCTION MOCK FALLBACK TESTS
    // =========================================================================

    @Test
    @DisplayName("SHIP-CRIT-001: Development mock mode works")
    void SHIP_CRIT_001_developmentMockModeWorks() {
        assertTrue(mockAdapter.isMockMode(), "ShiprocketMockAdapter must identify as mock mode");

        ShiprocketAdapter devAdapter = new ShiprocketAdapter();
        ReflectionTestUtils.setField(devAdapter, "useRealShiprocket", false);
        assertTrue(devAdapter.isMockMode(), "Dev adapter without useRealShiprocket must report mock mode");
    }

    @Test
    @DisplayName("SHIP-CRIT-002: Development mock shipment creation remains functional")
    void SHIP_CRIT_002_developmentMockShipmentCreationRemainsFunctional() {
        ShippingProvider.CreateShipmentResult result = mockAdapter.createShipment(createValidCommand());
        assertNotNull(result);
        assertNotNull(result.getProviderShipmentId());
        assertTrue(result.getProviderShipmentId().startsWith("SR-"));
        assertNotNull(result.getAwbCode());
        assertEquals("PICKUP_SCHEDULED", result.getStatus());
        assertTrue(result.getMessage().contains("Mock"));
    }

    @Test
    @DisplayName("SHIP-CRIT-003: Production refuses mock shipping mode")
    void SHIP_CRIT_003_productionRefusesMockShippingMode() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");
        prodEnv.setProperty("sporekart.shiprocket.use-real-shiprocket", "false");

        ShiprocketAdapter prodAdapter = new ShiprocketAdapter(shiprocketRestClient, prodEnv);
        assertFalse(prodAdapter.isMockMode(), "Production environment must NEVER be in mock mode");
        assertTrue(prodAdapter.isProductionEnvironment(), "Must be detected as production environment");
    }

    @Test
    @DisplayName("SHIP-CRIT-004: Production refuses missing email")
    void SHIP_CRIT_004_productionRefusesMissingEmail() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.razorpay.mock-mode", "false");
        env.setProperty("app.jwt.secret", "valid_prod_jwt_secret_which_is_at_least_32_bytes_long_and_not_in_known_defaults");
        env.setProperty("app.razorpay.key-id", "rzp_live_real_id_12345");
        env.setProperty("app.razorpay.key-secret", "real_live_rzp_secret_67890");
        env.setProperty("app.razorpay.webhook-secret", "real_live_rzp_webhook_secret_11223");
        env.setProperty("sporekart.shiprocket.use-real-shiprocket", "true");
        env.setProperty("sporekart.shiprocket.email", ""); // Missing email
        env.setProperty("sporekart.shiprocket.password", "secure_live_pass");
        env.setProperty("sporekart.shiprocket.pickup-location", "Davangere");
        env.setProperty("sporekart.shiprocket.pickup-pincode", "577002");
        env.setProperty("sporekart.shiprocket.webhook-token", "valid_token");
        env.setProperty("spring.datasource.password", "super_secure_db_pass");

        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Shiprocket email is blank"));
    }

    @Test
    @DisplayName("SHIP-CRIT-005: Production refuses missing password")
    void SHIP_CRIT_005_productionRefusesMissingPassword() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.razorpay.mock-mode", "false");
        env.setProperty("app.jwt.secret", "valid_prod_jwt_secret_which_is_at_least_32_bytes_long_and_not_in_known_defaults");
        env.setProperty("app.razorpay.key-id", "rzp_live_real_id_12345");
        env.setProperty("app.razorpay.key-secret", "real_live_rzp_secret_67890");
        env.setProperty("app.razorpay.webhook-secret", "real_live_rzp_webhook_secret_11223");
        env.setProperty("sporekart.shiprocket.use-real-shiprocket", "true");
        env.setProperty("sporekart.shiprocket.email", "admin@sporekart.in");
        env.setProperty("sporekart.shiprocket.password", ""); // Missing password
        env.setProperty("sporekart.shiprocket.pickup-location", "Davangere");
        env.setProperty("sporekart.shiprocket.pickup-pincode", "577002");
        env.setProperty("sporekart.shiprocket.webhook-token", "valid_token");
        env.setProperty("spring.datasource.password", "super_secure_db_pass");

        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("Shiprocket password is blank"));
    }

    @Test
    @DisplayName("SHIP-CRIT-006: Production refuses missing pickup configuration")
    void SHIP_CRIT_006_productionRefusesMissingPickupConfiguration() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("app.razorpay.mock-mode", "false");
        env.setProperty("app.jwt.secret", "valid_prod_jwt_secret_which_is_at_least_32_bytes_long_and_not_in_known_defaults");
        env.setProperty("app.razorpay.key-id", "rzp_live_real_id_12345");
        env.setProperty("app.razorpay.key-secret", "real_live_rzp_secret_67890");
        env.setProperty("app.razorpay.webhook-secret", "real_live_rzp_webhook_secret_11223");
        env.setProperty("sporekart.shiprocket.use-real-shiprocket", "true");
        env.setProperty("sporekart.shiprocket.email", "admin@sporekart.in");
        env.setProperty("sporekart.shiprocket.password", "secure_pass");
        env.setProperty("sporekart.shiprocket.pickup-location", ""); // Missing pickup location
        env.setProperty("sporekart.shiprocket.pickup-pincode", "577002");
        env.setProperty("sporekart.shiprocket.webhook-token", "valid_token");
        env.setProperty("spring.datasource.password", "super_secure_db_pass");

        SecurityConfigValidator validator = new SecurityConfigValidator(env);
        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateOnStartup);
        assertTrue(ex.getMessage().contains("pickup location is blank"));
    }

    @Test
    @DisplayName("SHIP-CRIT-007: Production refuses unavailable REST client")
    void SHIP_CRIT_007_productionRefusesUnavailableRestClient() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        ShiprocketAdapter adapterWithNoClient = new ShiprocketAdapter(null, prodEnv);
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> adapterWithNoClient.createShipment(createValidCommand()));
        assertTrue(ex.getMessage().contains("ShiprocketRestClient bean is unavailable"));
    }

    @Test
    @DisplayName("SHIP-CRIT-008: Production never calls mock shipment creation")
    void SHIP_CRIT_008_productionNeverCallsMockShipmentCreation() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        ShiprocketAdapter prodAdapter = new ShiprocketAdapter(null, prodEnv);
        assertFalse(prodAdapter.isMockMode(), "Mock mode must be strictly false in production");
        assertThrows(IllegalStateException.class, () -> prodAdapter.createShipment(createValidCommand()));
    }

    @Test
    @DisplayName("SHIP-CRIT-009: Shiprocket authentication failure is handled safely")
    void SHIP_CRIT_009_shiprocketAuthFailureHandledSafely() {
        when(shiprocketRestClient.createAdhocOrder(any()))
                .thenThrow(new ShiprocketApiException("Unauthorized access: 401 from external provider"));

        ShiprocketApiException ex = assertThrows(ShiprocketApiException.class,
                () -> adapter.createShipment(createValidCommand()));
        assertTrue(ex.getMessage().contains("Unauthorized"));
        assertFalse(ex.getMessage().contains("SecurePilotPass123"), "Never leak credentials in exception message");
    }

    @Test
    @DisplayName("SHIP-CRIT-010: Provider outage does not create fake shipment records")
    void SHIP_CRIT_010_providerOutageDoesNotCreateFakeShipmentRecords() {
        when(shiprocketRestClient.createAdhocOrder(any()))
                .thenThrow(new ShiprocketApiException("Shiprocket 503 Service Unavailable"));

        assertThrows(ShiprocketApiException.class, () -> adapter.createShipment(createValidCommand()));
        verify(shiprocketRestClient, never()).assignAwb(any(), any());
        verify(shiprocketRestClient, never()).requestPickup(any());
    }

    @Test
    @DisplayName("SHIP-CRIT-011: Production health information does not expose secrets")
    void SHIP_CRIT_011_productionHealthDoesNotExposeSecrets() {
        org.springframework.beans.factory.ObjectProvider<ShiprocketTokenManager> providerMock = mock(org.springframework.beans.factory.ObjectProvider.class);
        ShippingHealthIndicator indicator = new ShippingHealthIndicator(liveAdapter, providerMock);
        ReflectionTestUtils.setField(indicator, "email", "pilot@sporekart.in");
        ReflectionTestUtils.setField(indicator, "apiUrl", "https://apiv2.shiprocket.in/v1/external");

        Health health = indicator.health();
        assertNotNull(health);
        assertEquals(Status.UP, health.getStatus());
        assertEquals("Shiprocket", health.getDetails().get("provider"));
        assertEquals("LIVE", health.getDetails().get("activeMode"));
        assertEquals("CONFIGURED", health.getDetails().get("authReadiness"));

        // Crucial security check: secrets must NEVER be in health details
        assertFalse(health.getDetails().containsKey("password"));
        assertFalse(health.getDetails().containsKey("token"));
        assertFalse(health.getDetails().containsKey("webhookSecret"));
        assertFalse(health.getDetails().containsValue("SecurePilotPass123"));
    }

    @Test
    @DisplayName("SHIP-CRIT-012: Existing development shipping regression tests pass")
    void SHIP_CRIT_012_existingDevelopmentShippingRegressionTestsPass() {
        ShiprocketMockAdapter devMock = new ShiprocketMockAdapter();
        assertTrue(devMock.isMockMode());
        var res = devMock.createShipment(createValidCommand());
        assertEquals("PICKUP_SCHEDULED", res.getStatus());
    }

    // =========================================================================
    // WORK PACKAGE 02: REMOVE FABRICATED AWB AND TRACKING INFORMATION TESTS
    // =========================================================================

    @Test
    @DisplayName("SHIP-CRIT-013: AWB assignment success")
    void SHIP_CRIT_013_awbAssignmentSuccess() {
        ShiprocketDtos.CreateOrderResponse orderResp = ShiprocketDtos.CreateOrderResponse.builder()
                .orderId(12345L)
                .shipmentId(67890L)
                .status("NEW")
                .build();
        ShiprocketDtos.AssignAwbResponse awbResp = ShiprocketDtos.AssignAwbResponse.builder()
                .response(new ShiprocketDtos.AssignAwbResponse.ResponseData(
                        new ShiprocketDtos.AssignAwbResponse.AwbData("REAL-AWB-998877", "Delhivery Surface", 1L, "2026-11-13")
                )).build();
        ShiprocketDtos.GeneratePickupResponse pickupResp = ShiprocketDtos.GeneratePickupResponse.builder()
                .response(new ShiprocketDtos.GeneratePickupResponse.PickupData(1, "Scheduled", "PU-101"))
                .build();

        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(orderResp);
        when(shiprocketRestClient.assignAwb(eq("67890"), any())).thenReturn(awbResp);
        when(shiprocketRestClient.requestPickup(eq("67890"))).thenReturn(pickupResp);

        ShippingProvider.CreateShipmentResult result = adapter.createShipment(createValidCommand());
        assertNotNull(result);
        assertEquals("67890", result.getProviderShipmentId());
        assertEquals("REAL-AWB-998877", result.getAwbCode());
        assertEquals("PICKUP_SCHEDULED", result.getStatus());
        verify(shiprocketRestClient).requestPickup("67890");
    }

    @Test
    @DisplayName("SHIP-CRIT-014: AWB assignment failure")
    void SHIP_CRIT_014_awbAssignmentFailure() {
        ShiprocketDtos.CreateOrderResponse orderResp = ShiprocketDtos.CreateOrderResponse.builder()
                .orderId(12345L)
                .shipmentId(67890L)
                .status("NEW")
                .build();

        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(orderResp);
        when(shiprocketRestClient.assignAwb(eq("67890"), any())).thenThrow(new RuntimeException("Carrier timeout"));

        ShippingProvider.CreateShipmentResult result = adapter.createShipment(createValidCommand());
        assertNotNull(result);
        assertEquals("67890", result.getProviderShipmentId());
        assertNull(result.getAwbCode(), "AWB must be null on courier allocation failure");
        assertEquals("AWB_PENDING", result.getStatus(), "Shipment status must retain AWB_PENDING");
        verify(shiprocketRestClient, never()).requestPickup("67890");
    }

    @Test
    @DisplayName("SHIP-CRIT-015: Missing AWB response")
    void SHIP_CRIT_015_missingAwbResponse() {
        ShiprocketDtos.CreateOrderResponse orderResp = ShiprocketDtos.CreateOrderResponse.builder()
                .orderId(12345L)
                .shipmentId(67890L)
                .status("NEW")
                .build();
        ShiprocketDtos.AssignAwbResponse emptyAwbResp = ShiprocketDtos.AssignAwbResponse.builder()
                .response(new ShiprocketDtos.AssignAwbResponse.ResponseData(
                        new ShiprocketDtos.AssignAwbResponse.AwbData("", "Delhivery Surface", 1L, "")
                )).build();

        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(orderResp);
        when(shiprocketRestClient.assignAwb(eq("67890"), any())).thenReturn(emptyAwbResp);

        ShippingProvider.CreateShipmentResult result = adapter.createShipment(createValidCommand());
        assertNotNull(result);
        assertNull(result.getAwbCode(), "AWB must be null when provider returns empty awb_code");
        assertEquals("AWB_PENDING", result.getStatus());
    }

    @Test
    @DisplayName("SHIP-CRIT-016: No synthetic AWB generation")
    void SHIP_CRIT_016_noSyntheticAwbGeneration() {
        ShiprocketDtos.CreateOrderResponse orderResp = ShiprocketDtos.CreateOrderResponse.builder()
                .orderId(12345L)
                .shipmentId(67890L)
                .build();

        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(orderResp);
        when(shiprocketRestClient.assignAwb(eq("67890"), any())).thenReturn(null);

        ShippingProvider.CreateShipmentResult result = adapter.createShipment(createValidCommand());
        assertNotEquals("SR-67890", result.getAwbCode(), "Under no circumstance may synthetic 'SR-67890' be generated as AWB");
        assertNull(result.getAwbCode());
    }

    @Test
    @DisplayName("SHIP-CRIT-017: Tracking API returns actual provider data")
    void SHIP_CRIT_017_trackingApiReturnsActualProviderData() {
        ShiprocketDtos.TrackAwbResponse trackResp = ShiprocketDtos.TrackAwbResponse.builder()
                .trackingData(new ShiprocketDtos.TrackAwbResponse.TrackingData(
                        1, 6,
                        List.of(new ShiprocketDtos.TrackAwbResponse.ShipmentTrack(67890L, "IN_TRANSIT", "Pune Facility", "Davangere")),
                        List.of(new ShiprocketDtos.TrackAwbResponse.TrackingActivity("2026-11-13 10:00:00", "In Transit", "Reached Hub", "Pune Sorting Hub"))
                )).build();

        when(shiprocketRestClient.trackAwb("REAL-AWB-101")).thenReturn(trackResp);

        ShippingProvider.TrackingResult result = adapter.trackShipment("REAL-AWB-101", "67890");
        assertNotNull(result);
        assertEquals("REAL-AWB-101", result.getAwbCode());
        assertEquals("IN_TRANSIT", result.getCurrentStatus());
        assertEquals("Pune Sorting Hub", result.getLocation());
        assertEquals("Reached Hub", result.getActivity());
    }

    @Test
    @DisplayName("SHIP-CRIT-018: Tracking API unavailable")
    void SHIP_CRIT_018_trackingApiUnavailable() {
        when(shiprocketRestClient.trackAwb("REAL-AWB-101"))
                .thenThrow(new RuntimeException("Gateway connection timeout"));

        ShippingProvider.TrackingResult result = adapter.trackShipment("REAL-AWB-101", "67890");
        assertNotNull(result);
        assertEquals("TRACKING_UNAVAILABLE", result.getCurrentStatus());
        assertNull(result.getLocation(), "Must never invent carrier locations when API is down");
        assertTrue(result.getActivity().contains("unavailable"));
    }

    @Test
    @DisplayName("SHIP-CRIT-019: Empty tracking response")
    void SHIP_CRIT_019_emptyTrackingResponse() {
        ShiprocketDtos.TrackAwbResponse emptyResp = ShiprocketDtos.TrackAwbResponse.builder()
                .trackingData(new ShiprocketDtos.TrackAwbResponse.TrackingData(0, 0, List.of(), List.of()))
                .build();

        when(shiprocketRestClient.trackAwb("REAL-AWB-101")).thenReturn(emptyResp);

        ShippingProvider.TrackingResult result = adapter.trackShipment("REAL-AWB-101", "67890");
        assertNotNull(result);
        assertEquals("TRACKING_UNAVAILABLE", result.getCurrentStatus());
        assertNull(result.getLocation());
    }

    @Test
    @DisplayName("SHIP-CRIT-020: Duplicate tracking event")
    void SHIP_CRIT_020_duplicateTrackingEvent() {
        ShippingService service = new ShippingService(shipmentRepository, trackingRepository, adapter, orderService, null, null, null);

        UUID shipmentId = UUID.randomUUID();
        Shipment shipment = Shipment.builder()
                .id(shipmentId)
                .orderId(UUID.randomUUID())
                .orderNumber("ORD-001")
                .awbCode("AWB-DUPE-101")
                .status(ShipmentStatus.IN_TRANSIT)
                .build();

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));

        ShiprocketDtos.TrackAwbResponse trackResp = ShiprocketDtos.TrackAwbResponse.builder()
                .trackingData(new ShiprocketDtos.TrackAwbResponse.TrackingData(
                        1, 6,
                        List.of(new ShiprocketDtos.TrackAwbResponse.ShipmentTrack(101L, "IN_TRANSIT", "Pune", "Davangere")),
                        List.of(new ShiprocketDtos.TrackAwbResponse.TrackingActivity("2026-11-13 12:00:00", "In Transit", "Package moving", "Pune Hub"))
                )).build();
        when(shiprocketRestClient.trackAwb("AWB-DUPE-101")).thenReturn(trackResp);
        when(shipmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // First scan
        var t1 = service.updateTrackingStatus(shipmentId);
        assertNotNull(t1);
        assertEquals("IN_TRANSIT", t1.getCurrentStatus());

        // Second identical scan: must be deduplicated
        var t2 = service.updateTrackingStatus(shipmentId);
        assertNotNull(t2);
        assertEquals(1, shipment.getTrackingEvents().size(), "Duplicate tracking scan must not add another identical record");
    }

    @Test
    @DisplayName("SHIP-CRIT-021: Out-of-order tracking event")
    void SHIP_CRIT_021_outOfOrderTrackingEvent() {
        ShippingService service = new ShippingService(shipmentRepository, trackingRepository, adapter, orderService, null, null, null);

        UUID shipmentId = UUID.randomUUID();
        Shipment deliveredShipment = Shipment.builder()
                .id(shipmentId)
                .orderId(UUID.randomUUID())
                .orderNumber("ORD-002")
                .awbCode("AWB-DELIV-102")
                .status(ShipmentStatus.DELIVERED)
                .build();

        when(shipmentRepository.findByAwbCode("AWB-DELIV-102")).thenReturn(Optional.of(deliveredShipment));

        // Out-of-order IN_TRANSIT webhook received after package is already DELIVERED
        service.processWebhookUpdate("AWB-DELIV-102", "IN_TRANSIT", "Sorting Hub", "Package in transit", "{}");

        assertEquals(ShipmentStatus.DELIVERED, deliveredShipment.getStatus(),
                "DELIVERED shipment must never regress to IN_TRANSIT from out-of-order webhook");
    }

    @Test
    @DisplayName("SHIP-CRIT-022: No fabricated tracking location")
    void SHIP_CRIT_022_noFabricatedTrackingLocation() {
        when(shiprocketRestClient.trackAwb("AWB-MISSING-LOC"))
                .thenThrow(new RuntimeException("Courier network failure"));

        ShippingProvider.TrackingResult result = adapter.trackShipment("AWB-MISSING-LOC", "12345");
        assertNotEquals("Central Sorting Facility", result.getLocation());
        assertNotEquals("Carrier Network", result.getLocation());
        assertNull(result.getLocation(), "Location must be null when courier tracking fails");
    }

    @Test
    @DisplayName("SHIP-CRIT-023: Invalid address rejection")
    void SHIP_CRIT_023_invalidAddressRejection() {
        var command = createValidCommand();
        command.setPincode("012345"); // Invalid Indian pincode (starts with 0)

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> adapter.createShipment(command));
        assertTrue(ex.getMessage().contains("pincode"));

        command.setPincode("411001");
        command.setPhone("12345"); // Invalid phone
        IllegalArgumentException exPhone = assertThrows(IllegalArgumentException.class,
                () -> adapter.createShipment(command));
        assertTrue(exPhone.getMessage().contains("phone") || exPhone.getMessage().contains("mobile"));
    }

    @Test
    @DisplayName("SHIP-CRIT-024: Incomplete address rejection")
    void SHIP_CRIT_024_incompleteAddressRejection() {
        var command = createValidCommand();
        command.setRecipientName(" "); // Incomplete recipient name

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> adapter.createShipment(command));
        assertTrue(ex.getMessage().contains("Recipient name"));

        command.setRecipientName("Devendra");
        command.setAddressLine1(" "); // Missing address line 1
        IllegalArgumentException exLine = assertThrows(IllegalArgumentException.class,
                () -> adapter.createShipment(command));
        assertTrue(exLine.getMessage().contains("address line 1"));
    }

    @Test
    @DisplayName("SHIP-CRIT-025: Shipping address differs from billing address")
    void SHIP_CRIT_025_shippingAddressDiffersFromBillingAddress() {
        var command = createValidCommand();
        command.setAddressLine1("Farm 99, Shipping Hub");
        command.setCity("Nashik");

        ShiprocketDtos.CreateOrderResponse orderResp = ShiprocketDtos.CreateOrderResponse.builder()
                .orderId(12345L)
                .shipmentId(67890L)
                .build();
        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(orderResp);

        adapter.createShipment(command);

        ArgumentCaptor<ShiprocketDtos.CreateAdhocOrderRequest> captor = ArgumentCaptor.forClass(ShiprocketDtos.CreateAdhocOrderRequest.class);
        verify(shiprocketRestClient).createAdhocOrder(captor.capture());
        ShiprocketDtos.CreateAdhocOrderRequest req = captor.getValue();
        assertEquals("Farm 99, Shipping Hub", req.getBillingAddress());
        assertEquals("Nashik", req.getBillingCity());
    }

    @Test
    @DisplayName("SHIP-CRIT-026: Invalid weight/dimensions")
    void SHIP_CRIT_026_invalidWeightDimensions() {
        var command = createValidCommand();
        command.setWeightKg(BigDecimal.ZERO); // Invalid weight

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> adapter.createShipment(command));
        assertTrue(ex.getMessage().contains("weight"));

        command.setWeightKg(new BigDecimal("0.500"));
        command.setLengthCm(BigDecimal.valueOf(-5)); // Negative dimension
        IllegalArgumentException exDim = assertThrows(IllegalArgumentException.class,
                () -> adapter.createShipment(command));
        assertTrue(exDim.getMessage().contains("length"));
    }

    @Test
    @DisplayName("SHIP-CRIT-027: Duplicate shipment creation attempt")
    void SHIP_CRIT_027_duplicateShipmentCreationAttempt() {
        ShippingService service = new ShippingService(shipmentRepository, trackingRepository, adapter, orderService, null, null, null);

        UUID orderId = UUID.randomUUID();
        Shipment existing = Shipment.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .orderNumber("ORD-DUP-001")
                .awbCode("AWB-EXISTING-101")
                .status(ShipmentStatus.PICKUP_SCHEDULED)
                .build();

        when(shipmentRepository.findByOrderId(orderId)).thenReturn(Optional.of(existing));

        Shipment result = service.createShipmentForOrder(orderId);
        assertNotNull(result);
        assertEquals(existing.getId(), result.getId());
        verify(shiprocketRestClient, never()).createAdhocOrder(any());
    }

    @Test
    @DisplayName("SHIP-CRIT-028: Concurrent shipment creation")
    void SHIP_CRIT_028_concurrentShipmentCreation() {
        ShippingService service = new ShippingService(shipmentRepository, trackingRepository, adapter, orderService, null, null, null);

        UUID orderId = UUID.randomUUID();
        OrderResponse order = new OrderResponse();
        order.setId(orderId);
        order.setOrderNumber("ORD-RACE-001");
        order.setStatus(OrderStatus.PAID);
        order.setTotalAmountInr(new BigDecimal("500.00"));
        order.setShippingAddress(OrderAddressSnapshot.builder()
                .recipientName("Devendra Sharma")
                .phone("9876543210")
                .line1("Plot 10, Agricultural Complex")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .build());

        when(orderService.getOrderById(orderId)).thenReturn(order);
        when(shipmentRepository.findByOrderId(orderId))
                .thenReturn(Optional.empty()) // First check: not found
                .thenReturn(Optional.of(Shipment.builder().id(UUID.randomUUID()).orderId(orderId).build())); // Second check after race: found

        ShiprocketDtos.CreateOrderResponse orderResp = ShiprocketDtos.CreateOrderResponse.builder()
                .shipmentId(99001L)
                .build();
        when(shiprocketRestClient.createAdhocOrder(any())).thenReturn(orderResp);

        // Simulate unique constraint violation on save
        when(shipmentRepository.save(any())).thenThrow(new DataIntegrityViolationException("uq_shipments_order_id violation"));

        Shipment recovered = service.createShipmentForOrder(orderId);
        assertNotNull(recovered);
        assertEquals(orderId, recovered.getOrderId());
    }

    @Test
    @DisplayName("SHIP-CRIT-029: Existing development mock shipping tests still pass")
    void SHIP_CRIT_029_existingDevelopmentMockShippingTestsStillPass() {
        ShiprocketMockAdapter devMock = new ShiprocketMockAdapter();
        assertTrue(devMock.isMockMode());
        var res = devMock.createShipment(createValidCommand());
        assertEquals("PICKUP_SCHEDULED", res.getStatus());
        assertTrue(res.getAwbCode().startsWith("AWB-"));
    }
}
