package com.sporekart.shipping.application;

import com.sporekart.shipping.api.ShippingDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketDtos;
import com.sporekart.shipping.infrastructure.shiprocket.ShiprocketRestClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
public class ShippingApplicationService {

    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");

    private final ShiprocketAdapter shiprocketAdapter;
    private final ShiprocketRestClient shiprocketRestClient;
    private final String pickupPincode;

    @Autowired
    public ShippingApplicationService(
            ShiprocketAdapter shiprocketAdapter,
            ShiprocketRestClient shiprocketRestClient,
            @Value("${sporekart.shiprocket.pickup-pincode:411001}") String pickupPincode) {
        this.shiprocketAdapter = shiprocketAdapter;
        this.shiprocketRestClient = shiprocketRestClient;
        this.pickupPincode = pickupPincode;
    }

    // Default constructor for testing without spring context
    public ShippingApplicationService() {
        this.shiprocketAdapter = null;
        this.shiprocketRestClient = null;
        this.pickupPincode = "411001";
    }

    public ShippingDtos.PincodeServiceabilityResponse checkPincodeServiceability(String pincode) {
        if (pincode == null || !PINCODE_PATTERN.matcher(pincode.trim()).matches()) {
            return ShippingDtos.PincodeServiceabilityResponse.builder()
                    .pincode(pincode)
                    .isServiceable(false)
                    .message("Invalid Indian Pincode format. Must be 6 digits.")
                    .build();
        }

        String cleanPincode = pincode.trim();

        // If in LIVE mode and client is available, check real courier serviceability
        if (shiprocketAdapter != null && !shiprocketAdapter.isMockMode() && shiprocketRestClient != null) {
            try {
                log.info("Checking live Shiprocket serviceability from {} to {}", pickupPincode, cleanPincode);
                ShiprocketDtos.ServiceabilityResponse response = shiprocketRestClient.checkServiceability(
                        pickupPincode, cleanPincode, new BigDecimal("0.50"), false);

                if (response != null && response.getData() != null) {
                    List<ShiprocketDtos.ServiceabilityResponse.AvailableCourierCompany> couriers = response.getData().getAvailableCourierCompanies();
                    if (couriers != null && !couriers.isEmpty()) {
                        ShiprocketDtos.ServiceabilityResponse.AvailableCourierCompany best = couriers.stream()
                                .min(Comparator.comparing(c -> c.getRate() != null ? c.getRate() : BigDecimal.valueOf(999999)))
                                .orElse(couriers.get(0));

                        int days = best.getEstimatedDeliveryDays() != null ? best.getEstimatedDeliveryDays() : 3;
                        BigDecimal rate = best.getRate() != null ? best.getRate() : new BigDecimal("70");
                        String courierName = best.getCourierName() != null ? best.getCourierName() : "Shiprocket Express";

                        return ShippingDtos.PincodeServiceabilityResponse.builder()
                                .pincode(cleanPincode)
                                .isServiceable(true)
                                .estimatedDeliveryDays(days)
                                .shippingFeeInr(rate)
                                .courierName(courierName)
                                .message("Delivery available to pincode " + cleanPincode + " via " + courierName)
                                .build();
                    } else {
                        return ShippingDtos.PincodeServiceabilityResponse.builder()
                                .pincode(cleanPincode)
                                .isServiceable(false)
                                .message("Delivery currently not available to pincode " + cleanPincode)
                                .build();
                    }
                }
            } catch (Exception e) {
                log.warn("Live Shiprocket serviceability check failed for pincode {}: {}. Falling back to default serviceability.",
                        cleanPincode, e.getMessage());
            }
        }

        // Mock mode or fallback serviceability
        boolean serviceable = !cleanPincode.startsWith("999");
        int deliveryDays = cleanPincode.startsWith("11") || cleanPincode.startsWith("40") || cleanPincode.startsWith("56") ? 2 : 4;
        BigDecimal fee = new BigDecimal("70");

        return ShippingDtos.PincodeServiceabilityResponse.builder()
                .pincode(cleanPincode)
                .isServiceable(serviceable)
                .estimatedDeliveryDays(deliveryDays)
                .shippingFeeInr(fee)
                .courierName("Shiprocket Express / BlueDart")
                .message(serviceable ? "Delivery available to pincode " + cleanPincode : "Delivery currently not available to " + cleanPincode)
                .build();
    }
}
