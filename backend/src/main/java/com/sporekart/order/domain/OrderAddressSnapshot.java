package com.sporekart.order.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderAddressSnapshot {

    @Size(max = 100, message = "Recipient name cannot exceed 100 characters")
    private String recipientName;

    @Pattern(regexp = "^$|^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$", message = "Email must be a valid email address")
    private String email;

    @Pattern(regexp = "^$|^(?:\\+91[\\-\\s]?|0)?[6-9]\\d{9}$", message = "Phone number must be a valid 10-digit Indian mobile number")
    private String phone;

    @Size(max = 255, message = "Address line 1 cannot exceed 255 characters")
    private String line1;

    @Size(max = 255, message = "Address line 2 cannot exceed 255 characters")
    private String line2;

    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @Pattern(regexp = "^$|^[1-9][0-9]{5}$", message = "PIN code must be a valid 6-digit Indian postal code")
    private String pincode;

    private static final ObjectMapper mapper = new ObjectMapper();

    public String toJson() {
        try {
            return mapper.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize OrderAddressSnapshot to JSON", e);
        }
    }

    public static OrderAddressSnapshot fromJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            return new OrderAddressSnapshot();
        }
        try {
            return mapper.readValue(json, OrderAddressSnapshot.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse OrderAddressSnapshot JSON: {}", json, e);
            return new OrderAddressSnapshot();
        }
    }
}
