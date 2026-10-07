package com.sporekart.customer.api;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class CustomerAddressValidationTest {

    private static Validator validator;

    @BeforeAll
    public static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Negative Scenario: Reject Invalid Indian Phone Numbers (Non 10-digit or Starting with <6)")
    public void testRejectInvalidIndianPhoneNumbers() {
        CustomerDtos.AddressRequest request = CustomerDtos.AddressRequest.builder()
                .recipientName("Praveen Kumar")
                .phone("1234567890") // Starts with 1 - invalid for Indian mobile
                .line1("Plot 12, Green Agro Farm Road")
                .city("Davangere")
                .state("Karnataka")
                .pincode("577001")
                .build();

        Set<ConstraintViolation<CustomerDtos.AddressRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Phone number starting with 1 must fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("phone")));
    }

    @Test
    @DisplayName("Negative Scenario: Reject PIN Code Starting with 0 or Short Digits")
    public void testRejectInvalidIndianPincodes() {
        CustomerDtos.AddressRequest request = CustomerDtos.AddressRequest.builder()
                .recipientName("Praveen Kumar")
                .phone("9876543210")
                .line1("Plot 12, Green Agro Farm Road")
                .city("Davangere")
                .state("Karnataka")
                .pincode("012345") // Starts with 0 - invalid Indian postal code
                .build();

        Set<ConstraintViolation<CustomerDtos.AddressRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "PIN code starting with 0 must fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("pincode")));
    }

    @Test
    @DisplayName("Negative Scenario: Reject City Containing Numbers or Special Characters")
    public void testRejectInvalidCityNames() {
        CustomerDtos.AddressRequest request = CustomerDtos.AddressRequest.builder()
                .recipientName("Praveen Kumar")
                .phone("9876543210")
                .line1("Plot 12, Green Agro Farm Road")
                .city("Davangere99#") // Contains digits and symbol
                .state("Karnataka")
                .pincode("577001")
                .build();

        Set<ConstraintViolation<CustomerDtos.AddressRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "City with numbers and symbols must fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("city")));
    }

    @Test
    @DisplayName("Negative Scenario: Reject Short Address Line 1 (<5 characters)")
    public void testRejectShortAddressLine1() {
        CustomerDtos.AddressRequest request = CustomerDtos.AddressRequest.builder()
                .recipientName("Praveen Kumar")
                .phone("9876543210")
                .line1("Plot") // 4 chars - less than min 5
                .city("Davangere")
                .state("Karnataka")
                .pincode("577001")
                .build();

        Set<ConstraintViolation<CustomerDtos.AddressRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Line 1 shorter than 5 chars must fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("line1")));
    }

    @Test
    @DisplayName("Positive Scenario: Accept Valid Indian Address Request")
    public void testAcceptValidIndianAddressRequest() {
        CustomerDtos.AddressRequest request = CustomerDtos.AddressRequest.builder()
                .recipientName("Praveen Kumar")
                .phone("9876543210")
                .line1("Plot 12, Green Agro Farm Road")
                .city("Davangere")
                .state("Karnataka")
                .pincode("577001")
                .isDefault(true)
                .build();

        Set<ConstraintViolation<CustomerDtos.AddressRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid address request should have 0 constraint violations");
    }
}
