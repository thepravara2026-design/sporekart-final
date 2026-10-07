package com.sporekart.customer.application;

import com.sporekart.customer.api.CustomerDtos;
import com.sporekart.customer.domain.CustomerAddress;
import com.sporekart.customer.domain.CustomerCapability;
import com.sporekart.customer.domain.CustomerProfile;
import com.sporekart.customer.infrastructure.CustomerAddressRepository;
import com.sporekart.customer.infrastructure.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;
    private final CapabilityService capabilityService;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.identity.application.AuthService authService;

    @Transactional(readOnly = true)
    public CustomerProfile getCustomerProfile(UUID userId) {
        return getOrCreateProfile(userId);
    }

    @Transactional
    public CustomerProfile getOrCreateProfile(UUID userId) {
        return customerRepository.findByUserId(userId)
                .orElseGet(() -> {
                    CustomerProfile profile = CustomerProfile.builder()
                            .userId(userId)
                            .build();
                    return customerRepository.save(profile);
                });
    }

    @Transactional
    public CustomerProfile updateProfile(UUID userId, CustomerDtos.UpdateProfileRequest request) {
        CustomerProfile profile = getOrCreateProfile(userId);
        if (request.getGstin() != null) {
            profile.setGstin(request.getGstin());
        }
        if (request.getFarmSizeSqft() != null) {
            profile.setFarmSizeSqft(request.getFarmSizeSqft());
        }

        if (userId != null) {
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                authService.linkPhoneAndNameFromAddress(userId, request.getPhone(), request.getFullName());
            } else if (request.getPhone() != null && !request.getPhone().isBlank()) {
                authService.linkPhoneToUser(userId, request.getPhone());
            }

            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                authService.linkEmailToUser(userId, request.getEmail());
            }

            if (request.getLine1() != null && !request.getLine1().isBlank()
                    && request.getCity() != null && !request.getCity().isBlank()
                    && request.getState() != null && !request.getState().isBlank()
                    && request.getPincode() != null && !request.getPincode().isBlank()) {

                String phoneForAddr = request.getPhone() != null && !request.getPhone().isBlank()
                        ? request.getPhone()
                        : "+919999999999";
                String nameForAddr = request.getFullName() != null && !request.getFullName().isBlank()
                        ? request.getFullName()
                        : "Customer";

                CustomerDtos.AddressRequest addrReq = CustomerDtos.AddressRequest.builder()
                        .recipientName(nameForAddr)
                        .phone(phoneForAddr)
                        .line1(request.getLine1())
                        .line2(request.getLine2() != null ? request.getLine2() : "")
                        .city(request.getCity())
                        .state(request.getState())
                        .pincode(request.getPincode())
                        .isDefault(true)
                        .build();

                List<CustomerAddress> existingAddrs = customerAddressRepository.findByUserId(userId);
                if (existingAddrs.isEmpty()) {
                    addAddress(userId, addrReq);
                } else {
                    CustomerAddress existingDefault = existingAddrs.stream()
                            .filter(CustomerAddress::isDefault)
                            .findFirst()
                            .orElse(existingAddrs.get(0));
                    updateAddress(userId, existingDefault.getId(), addrReq);
                }
            }
        }

        return customerRepository.save(profile);
    }

    @Transactional
    public CustomerProfile grantTrainingCapability(UUID userId, UUID enrollmentId, String courseTitle) {
        return capabilityService.grantCapability(userId, CustomerCapability.TRAINING);
    }

    @Transactional(readOnly = true)
    public java.util.Set<com.sporekart.customer.domain.CustomerCapability> getCustomerCapabilities(UUID userId) {
        return capabilityService.getUserCapabilities(userId);
    }

    @Transactional
    public CustomerDtos.AddressDto addAddress(UUID userId, CustomerDtos.AddressRequest request) {
        if (request.getAlternatePhone() != null && !request.getAlternatePhone().isBlank()) {
            authService.validatePhoneUniqueness(null, request.getAlternatePhone().trim());
        }

        if (userId != null) {
            authService.linkPhoneAndNameFromAddress(userId, request.getPhone(), request.getRecipientName());
        }

        if (request.isDefault()) {
            clearDefaultAddress(userId);
        }

        CustomerAddress address = CustomerAddress.builder()
                .userId(userId)
                .recipientName(request.getRecipientName())
                .phone(request.getPhone())
                .alternatePhone(request.getAlternatePhone() != null && !request.getAlternatePhone().isBlank() ? request.getAlternatePhone().trim() : null)
                .line1(request.getLine1())
                .line2(request.getLine2())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .isDefault(request.isDefault())
                .build();

        CustomerAddress saved = customerAddressRepository.save(address);
        return mapToAddressDto(saved);
    }

    @Transactional(readOnly = true)
    public Optional<CustomerAddress> findAddressById(UUID addressId) {
        return customerAddressRepository.findById(addressId);
    }

    @Transactional(readOnly = true)
    public List<CustomerDtos.AddressDto> getAddresses(UUID userId) {
        return customerAddressRepository.findByUserId(userId)
                .stream()
                .map(this::mapToAddressDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerDtos.AddressDto updateAddress(UUID userId, UUID addressId, CustomerDtos.AddressRequest request) {
        CustomerAddress address = customerAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or unauthorized"));

        if (request.getAlternatePhone() != null && !request.getAlternatePhone().isBlank()) {
            authService.validatePhoneUniqueness(null, request.getAlternatePhone().trim());
        }

        if (userId != null) {
            authService.linkPhoneAndNameFromAddress(userId, request.getPhone(), request.getRecipientName());
        }

        if (request.isDefault() && !address.isDefault()) {
            clearDefaultAddress(userId);
        }

        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setAlternatePhone(request.getAlternatePhone() != null && !request.getAlternatePhone().isBlank() ? request.getAlternatePhone().trim() : null);
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setDefault(request.isDefault());

        CustomerAddress updated = customerAddressRepository.save(address);
        return mapToAddressDto(updated);
    }

    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        CustomerAddress address = customerAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or unauthorized"));
        customerAddressRepository.delete(address);
    }

    private void clearDefaultAddress(UUID userId) {
        customerAddressRepository.findByUserIdAndIsDefaultTrue(userId)
                .ifPresent(a -> {
                    a.setDefault(false);
                    customerAddressRepository.save(a);
                });
    }

    private CustomerDtos.AddressDto mapToAddressDto(CustomerAddress entity) {
        return CustomerDtos.AddressDto.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .recipientName(entity.getRecipientName())
                .phone(entity.getPhone())
                .alternatePhone(entity.getAlternatePhone())
                .line1(entity.getLine1())
                .line2(entity.getLine2())
                .city(entity.getCity())
                .state(entity.getState())
                .pincode(entity.getPincode())
                .isDefault(entity.isDefault())
                .build();
    }
}
