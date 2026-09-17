package com.sporekart.customer.api;

import com.sporekart.admin.application.AdminApplicationService;
import com.sporekart.customer.application.CapabilityService;
import com.sporekart.customer.domain.CustomerCapability;
import com.sporekart.customer.domain.CustomerProfile;
import com.sporekart.customer.infrastructure.CustomerRepository;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.shared.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/customers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCustomerController {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final CapabilityService capabilityService;
    private final AdminApplicationService adminAuditService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminCustomerResponse>>> getAllCustomers() {
        List<User> users = userRepository.findAll();
        List<AdminCustomerResponse> response = users.stream().map(user -> {
            Set<CustomerCapability> capabilities = capabilityService.getUserCapabilities(user.getId());
            CustomerProfile profile = customerRepository.findByUserId(user.getId()).orElse(null);

            return AdminCustomerResponse.builder()
                    .userId(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .role(user.getRole().name())
                    .isVerified(user.isVerified())
                    .gstin(profile != null ? profile.getGstin() : null)
                    .farmSizeSqft(profile != null ? profile.getFarmSizeSqft() : null)
                    .capabilities(capabilities.stream().map(Enum::name).collect(Collectors.toSet()))
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{userId}/capability")
    public ResponseEntity<ApiResponse<String>> grantCapability(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody GrantCapabilityRequest request,
            Authentication authentication
    ) {
        CustomerCapability cap = CustomerCapability.valueOf(request.getCapability().toUpperCase());
        capabilityService.grantCapability(userId, cap);

        adminAuditService.logAction(
                getAdminId(authentication),
                "GRANT_CUSTOMER_CAPABILITY",
                "CUSTOMER",
                userId.toString(),
                null,
                cap.name(),
                "Granted capability " + cap.name() + " to user " + userId,
                null
        );

        return ResponseEntity.ok(ApiResponse.success("Capability granted successfully"));
    }

    private UUID getAdminId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        try {
            return UUID.fromString(auth.getName());
        } catch (Exception e) {
            return UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminCustomerResponse {
        private UUID userId;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private boolean isVerified;
        private String gstin;
        private Integer farmSizeSqft;
        private Set<String> capabilities;
    }

    @Data
    public static class GrantCapabilityRequest {
        private String capability;
    }
}
