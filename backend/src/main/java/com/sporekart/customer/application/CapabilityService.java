package com.sporekart.customer.application;

import com.sporekart.customer.domain.CustomerCapability;
import com.sporekart.customer.domain.CustomerProfile;
import com.sporekart.customer.infrastructure.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service("capabilityService")
@RequiredArgsConstructor
public class CapabilityService {

    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public boolean hasCapability(UUID userId, String capabilityName) {
        if (userId == null || capabilityName == null) return false;
        try {
            CustomerCapability capability = CustomerCapability.valueOf(capabilityName.trim().toUpperCase());
            return hasCapability(userId, capability);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown capability check requested: {}", capabilityName);
            return false;
        }
    }

    @Transactional(readOnly = true)
    public boolean hasCapability(UUID userId, CustomerCapability capability) {
        if (userId == null || capability == null) return false;
        return customerRepository.findByUserId(userId)
                .map(profile -> profile.getCapabilities().contains(capability))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public Set<CustomerCapability> getUserCapabilities(UUID userId) {
        if (userId == null) return Collections.emptySet();
        return customerRepository.findByUserId(userId)
                .map(CustomerProfile::getCapabilities)
                .orElse(Collections.emptySet());
    }

    @Transactional
    public CustomerProfile grantCapability(UUID userId, CustomerCapability capability) {
        log.info("Granting capability '{}' to customer user ID: {}", capability, userId);

        CustomerProfile profile = customerRepository.findByUserId(userId)
                .orElseGet(() -> CustomerProfile.builder()
                        .userId(userId)
                        .build());

        profile.addCapability(capability);

        if (capability == CustomerCapability.TRAINING) {
            profile.setHasTrainingCapability(true);
            if (profile.getTrainingCapabilityGrantedAt() == null) {
                profile.setTrainingCapabilityGrantedAt(ZonedDateTime.now());
            }
        }

        return customerRepository.save(profile);
    }
}
