package com.sporekart.shipping.application;

import com.sporekart.shipping.api.ShippingDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ShippingApplicationService {

    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");

    public ShippingDtos.PincodeServiceabilityResponse checkPincodeServiceability(String pincode) {
        if (pincode == null || !PINCODE_PATTERN.matcher(pincode.trim()).matches()) {
            return ShippingDtos.PincodeServiceabilityResponse.builder()
                    .pincode(pincode)
                    .isServiceable(false)
                    .message("Invalid Indian Pincode format. Must be 6 digits.")
                    .build();
        }

        String cleanPincode = pincode.trim();

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
