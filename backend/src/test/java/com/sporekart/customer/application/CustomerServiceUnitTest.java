package com.sporekart.customer.application;

import com.sporekart.customer.api.CustomerDtos;
import com.sporekart.customer.domain.CustomerAddress;
import com.sporekart.customer.domain.CustomerCapability;
import com.sporekart.customer.domain.CustomerProfile;
import com.sporekart.customer.infrastructure.CustomerAddressRepository;
import com.sporekart.customer.infrastructure.CustomerRepository;
import com.sporekart.identity.application.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceUnitTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CustomerAddressRepository customerAddressRepository;
    @Mock
    private CapabilityService capabilityService;
    @Mock
    private AuthService authService;

    @InjectMocks
    private CustomerService customerService;

    private UUID userId;
    private CustomerProfile testProfile;
    private CustomerAddress testAddress;
    private UUID addressId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        addressId = UUID.randomUUID();

        testProfile = CustomerProfile.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .gstin("27AAAAA0000A1Z5")
                .farmSizeSqft(1000)
                .capabilities(new HashSet<>())
                .build();

        testAddress = CustomerAddress.builder()
                .id(addressId)
                .userId(userId)
                .recipientName("John Doe")
                .phone("9876543210")
                .line1("123 Farm Road")
                .city("Pune")
                .state("Maharashtra")
                .pincode("411001")
                .isDefault(true)
                .build();
    }

    @Test
    @DisplayName("CUST-1: CustomerService getOrCreateProfile creates profile if absent")
    void CUST_1_getOrCreateProfile_creates_when_absent() {
        when(customerRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(customerRepository.save(any(CustomerProfile.class))).thenAnswer(i -> i.getArgument(0));

        CustomerProfile profile = customerService.getOrCreateProfile(userId);

        assertNotNull(profile);
        assertEquals(userId, profile.getUserId());
        verify(customerRepository).save(any(CustomerProfile.class));
    }

    @Test
    @DisplayName("CUST-2: CustomerService updateProfile updates GSTIN and farm size")
    void CUST_2_updateProfile_updates_gstin_and_farm_size() {
        when(customerRepository.findByUserId(userId)).thenReturn(Optional.of(testProfile));
        when(customerRepository.save(any(CustomerProfile.class))).thenAnswer(i -> i.getArgument(0));

        CustomerDtos.UpdateProfileRequest request = new CustomerDtos.UpdateProfileRequest();
        request.setGstin("27BBBBB1111B2Z6");
        request.setFarmSizeSqft(2500);

        CustomerProfile updated = customerService.updateProfile(userId, request);

        assertEquals("27BBBBB1111B2Z6", updated.getGstin());
        assertEquals(2500, updated.getFarmSizeSqft());
        verify(customerRepository).save(testProfile);
    }

    @Test
    @DisplayName("CUST-3: CustomerService addAddress saves address and links phone")
    void CUST_3_addAddress_saves_and_links_phone() {
        when(customerAddressRepository.save(any(CustomerAddress.class))).thenAnswer(i -> i.getArgument(0));

        CustomerDtos.AddressRequest request = new CustomerDtos.AddressRequest();
        request.setRecipientName("Jane Doe");
        request.setPhone("9876543210");
        request.setLine1("456 Green Street");
        request.setCity("Mumbai");
        request.setState("Maharashtra");
        request.setPincode("400001");
        request.setDefault(false);

        CustomerDtos.AddressDto dto = customerService.addAddress(userId, request);

        assertNotNull(dto);
        assertEquals("Jane Doe", dto.getRecipientName());
        verify(authService).linkPhoneToUser(userId, "9876543210");
        verify(customerAddressRepository).save(any(CustomerAddress.class));
    }

    @Test
    @DisplayName("CUST-4: CustomerService addAddress clears default flag when new address is default")
    void CUST_4_addAddress_clears_existing_default() {
        CustomerAddress existingDefault = CustomerAddress.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .isDefault(true)
                .build();

        when(customerAddressRepository.findByUserIdAndIsDefaultTrue(userId))
                .thenReturn(Optional.of(existingDefault));
        when(customerAddressRepository.save(any(CustomerAddress.class))).thenAnswer(i -> i.getArgument(0));

        CustomerDtos.AddressRequest request = new CustomerDtos.AddressRequest();
        request.setRecipientName("Jane Doe");
        request.setPhone("9876543210");
        request.setLine1("456 Green Street");
        request.setCity("Mumbai");
        request.setState("Maharashtra");
        request.setPincode("400001");
        request.setDefault(true);

        CustomerDtos.AddressDto dto = customerService.addAddress(userId, request);

        assertNotNull(dto);
        assertTrue(dto.isDefault());
        assertFalse(existingDefault.isDefault());
    }

    @Test
    @DisplayName("CUST-5: CustomerService updateAddress updates existing address")
    void CUST_5_updateAddress_success() {
        when(customerAddressRepository.findByIdAndUserId(addressId, userId))
                .thenReturn(Optional.of(testAddress));
        when(customerAddressRepository.save(any(CustomerAddress.class))).thenAnswer(i -> i.getArgument(0));

        CustomerDtos.AddressRequest request = new CustomerDtos.AddressRequest();
        request.setRecipientName("John Smith");
        request.setPhone("9876543210");
        request.setLine1("123 Farm Road Updated");
        request.setCity("Pune");
        request.setState("Maharashtra");
        request.setPincode("411001");
        request.setDefault(true);

        CustomerDtos.AddressDto dto = customerService.updateAddress(userId, addressId, request);

        assertEquals("John Smith", dto.getRecipientName());
        assertEquals("123 Farm Road Updated", dto.getLine1());
    }

    @Test
    @DisplayName("CUST-6: CustomerService deleteAddress removes owned address")
    void CUST_6_deleteAddress_success() {
        when(customerAddressRepository.findByIdAndUserId(addressId, userId))
                .thenReturn(Optional.of(testAddress));

        customerService.deleteAddress(userId, addressId);

        verify(customerAddressRepository).delete(testAddress);
    }

    @Test
    @DisplayName("CUST-7: CapabilityService hasCapability returns true when user possesses capability")
    void CUST_7_capabilityService_hasCapability_true() {
        CapabilityService capService = new CapabilityService(customerRepository);
        testProfile.getCapabilities().add(CustomerCapability.TRAINING);
        when(customerRepository.findByUserId(userId)).thenReturn(Optional.of(testProfile));

        assertTrue(capService.hasCapability(userId, CustomerCapability.TRAINING));
        assertTrue(capService.hasCapability(userId, "TRAINING"));
    }

    @Test
    @DisplayName("CUST-8: CapabilityService hasCapability returns false when user lacks capability")
    void CUST_8_capabilityService_hasCapability_false() {
        CapabilityService capService = new CapabilityService(customerRepository);
        when(customerRepository.findByUserId(userId)).thenReturn(Optional.of(testProfile));

        assertFalse(capService.hasCapability(userId, CustomerCapability.TRAINING));
        assertFalse(capService.hasCapability(null, CustomerCapability.TRAINING));
        assertFalse(capService.hasCapability(userId, "UNKNOWN"));
    }

    @Test
    @DisplayName("CUST-9: CapabilityService grantCapability adds capability and sets training flag timestamp")
    void CUST_9_capabilityService_grantCapability() {
        CapabilityService capService = new CapabilityService(customerRepository);
        when(customerRepository.findByUserId(userId)).thenReturn(Optional.of(testProfile));
        when(customerRepository.save(any(CustomerProfile.class))).thenAnswer(i -> i.getArgument(0));

        CustomerProfile updated = capService.grantCapability(userId, CustomerCapability.TRAINING);

        assertTrue(updated.getCapabilities().contains(CustomerCapability.TRAINING));
        assertTrue(updated.isHasTrainingCapability());
        assertNotNull(updated.getTrainingCapabilityGrantedAt());
    }
}
