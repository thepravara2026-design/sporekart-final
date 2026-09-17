package com.sporekart.customer.api;

import com.sporekart.customer.application.CustomerService;
import com.sporekart.customer.domain.CustomerProfile;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/customer", "/customer"})
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/capabilities")
    public ResponseEntity<ApiResponse<CustomerDtos.CapabilityResponse>> getCapabilities(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated"));
        }
        UUID userId = UUID.fromString(authentication.getName());
        Set<com.sporekart.customer.domain.CustomerCapability> capabilities = customerService.getCustomerCapabilities(userId);
        CustomerDtos.CapabilityResponse response = CustomerDtos.CapabilityResponse.builder()
                .userId(userId)
                .capabilities(capabilities)
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<CustomerProfile>> getProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated"));
        }
        UUID userId = UUID.fromString(authentication.getName());
        CustomerProfile profile = customerService.getCustomerProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<CustomerProfile>> updateProfile(
            Authentication authentication,
            @RequestBody CustomerDtos.UpdateProfileRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated"));
        }
        UUID userId = UUID.fromString(authentication.getName());
        CustomerProfile updated = customerService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<List<CustomerDtos.AddressDto>>> getAddresses(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated"));
        }
        UUID userId = UUID.fromString(authentication.getName());
        List<CustomerDtos.AddressDto> addresses = customerService.getAddresses(userId);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<CustomerDtos.AddressDto>> addAddress(
            Authentication authentication,
            @Valid @RequestBody CustomerDtos.AddressRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated"));
        }
        UUID userId = UUID.fromString(authentication.getName());
        CustomerDtos.AddressDto created = customerService.addAddress(userId, request);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<ApiResponse<CustomerDtos.AddressDto>> updateAddress(
            Authentication authentication,
            @PathVariable("id") UUID addressId,
            @Valid @RequestBody CustomerDtos.AddressRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated"));
        }
        UUID userId = UUID.fromString(authentication.getName());
        CustomerDtos.AddressDto updated = customerService.updateAddress(userId, addressId, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAddress(
            Authentication authentication,
            @PathVariable("id") UUID addressId) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Unauthenticated"));
        }
        UUID userId = UUID.fromString(authentication.getName());
        customerService.deleteAddress(userId, addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
    }
}
