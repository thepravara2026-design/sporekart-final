package com.sporekart.shipping.application;

import com.sporekart.shipping.api.ShippingDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketRestClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShippingApplicationServiceUnitTest {

    @Mock
    private ShiprocketAdapter shiprocketAdapter;

    @Mock
    private ShiprocketRestClient shiprocketRestClient;

    @Test
    @DisplayName("SERV-1: Invalid Indian pincode returns non-serviceable response with error message")
    void SERV_1_invalidPincodeFormat_returnsNotServiceable() {
        ShippingApplicationService service = new ShippingApplicationService(shiprocketAdapter, shiprocketRestClient, "411001");

        ShippingDtos.PincodeServiceabilityResponse response = service.checkPincodeServiceability("123");
        assertFalse(response.isServiceable());
        assertTrue(response.getMessage().contains("Must be 6 digits"));

        response = service.checkPincodeServiceability("012345");
        assertFalse(response.isServiceable());
    }

    @Test
    @DisplayName("SERV-2: Mock mode returns deterministic serviceability and estimated days")
    void SERV_2_mockMode_returnsDeterministicServiceability() {
        when(shiprocketAdapter.isMockMode()).thenReturn(true);

        ShippingApplicationService service = new ShippingApplicationService(shiprocketAdapter, shiprocketRestClient, "411001");

        ShippingDtos.PincodeServiceabilityResponse response = service.checkPincodeServiceability("560001");
        assertTrue(response.isServiceable());
        assertEquals(2, response.getEstimatedDeliveryDays());
        assertEquals(new BigDecimal("70"), response.getShippingFeeInr());
        verifyNoInteractions(shiprocketRestClient);
    }

    @Test
    @DisplayName("SERV-3: Live mode queries Shiprocket and selects lowest rate courier")
    void SERV_3_liveMode_queriesShiprocketAndSelectsLowestRate() {
        when(shiprocketAdapter.isMockMode()).thenReturn(false);

        ShiprocketDtos.ServiceabilityResponse responseDto = ShiprocketDtos.ServiceabilityResponse.builder()
                .status(200)
                .data(new ShiprocketDtos.ServiceabilityResponse.ServiceabilityData(List.of(
                        new ShiprocketDtos.ServiceabilityResponse.AvailableCourierCompany(1L, "Blue Dart", new BigDecimal("95.00"), "2 Days", 2),
                        new ShiprocketDtos.ServiceabilityResponse.AvailableCourierCompany(2L, "Delhivery Surface", new BigDecimal("65.00"), "3 Days", 3)
                )))
                .build();

        when(shiprocketRestClient.checkServiceability(eq("411001"), eq("400001"), any(), eq(false)))
                .thenReturn(responseDto);

        ShippingApplicationService service = new ShippingApplicationService(shiprocketAdapter, shiprocketRestClient, "411001");

        ShippingDtos.PincodeServiceabilityResponse result = service.checkPincodeServiceability("400001");
        assertTrue(result.isServiceable());
        assertEquals("Delhivery Surface", result.getCourierName());
        assertEquals(new BigDecimal("65.00"), result.getShippingFeeInr());
        assertEquals(3, result.getEstimatedDeliveryDays());
    }

    @Test
    @DisplayName("SERV-4: Live mode falls back gracefully to default serviceability on client exception")
    void SERV_4_liveMode_fallsBackOnException() {
        when(shiprocketAdapter.isMockMode()).thenReturn(false);
        when(shiprocketRestClient.checkServiceability(anyString(), anyString(), any(), anyBoolean()))
                .thenThrow(new RuntimeException("Shiprocket network timeout"));

        ShippingApplicationService service = new ShippingApplicationService(shiprocketAdapter, shiprocketRestClient, "411001");

        ShippingDtos.PincodeServiceabilityResponse result = service.checkPincodeServiceability("411001");
        assertTrue(result.isServiceable());
        assertEquals(new BigDecimal("70"), result.getShippingFeeInr());
    }
}
