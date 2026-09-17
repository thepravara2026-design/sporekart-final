package com.sporekart.order.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderAddressSnapshot {

    private String recipientName;
    private String phone;
    private String line1;
    private String line2;
    private String city;
    private String state;
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
            return new OrderAddressSnapshot();
        }
    }
}
