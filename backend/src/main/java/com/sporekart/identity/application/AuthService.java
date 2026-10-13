package com.sporekart.identity.application;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.domain.*;
import com.sporekart.identity.infrastructure.CustomerIdentityRepository;
import com.sporekart.identity.infrastructure.OtpRepository;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerIdentityRepository customerIdentityRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final org.springframework.core.env.Environment environment;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.customer.infrastructure.CustomerAddressRepository customerAddressRepository;

    public void checkIfPhoneIsAlternateDeliveryOnly(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank() || rawPhone.contains("@")) return;
        String cleaned = rawPhone.replaceAll("[^0-9]", "");
        if (cleaned.isEmpty()) return;
        String last10 = cleaned.length() >= 10 ? cleaned.substring(cleaned.length() - 10) : cleaned;
        String withPrefix = "+91" + last10;

        Optional<User> primaryUser = findUserByPhoneFlexible(rawPhone);
        if (primaryUser.isPresent()) return;

        if (customerAddressRepository != null && customerAddressRepository.isAlternateDeliveryPhoneExist(rawPhone, withPrefix, last10)) {
            throw new IllegalArgumentException(
                    "This phone number (" + normalizePhone(rawPhone) + ") is registered only as an alternative delivery contact for an order/address and cannot be used for account login. Please log in using Google authentication."
            );
        }
    }

    @Transactional
    public AuthDtos.AuthResponse loginWithGoogle(AuthDtos.GoogleOAuthRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String googleSub = request.getGoogleSub().trim();

        User user = findOrCreateUserForIdentity(IdentityProvider.GOOGLE, googleSub, email, request.getFirstName(), request.getLastName(), request.getFullName());

        // Single entity enforcement: only thepravara2026@gmail.com is permissible for ROLE_ADMIN via Google OAuth
        if ("thepravara2026@gmail.com".equalsIgnoreCase(email)) {
            if (user.getRole() != UserRole.ROLE_ADMIN) {
                user.setRole(UserRole.ROLE_ADMIN);
                user = userRepository.save(user);
            }
        } else {
            // Any other Google user can NEVER hold ROLE_ADMIN
            if (user.getRole() == UserRole.ROLE_ADMIN && !"admin@sporekart.in".equalsIgnoreCase(email)) {
                user.setRole(UserRole.ROLE_CUSTOMER);
                user = userRepository.save(user);
            }
        }

        String token = jwtTokenProvider.generateToken(user.getId(), email, user.getRole().name());

        List<String> providers = customerIdentityRepository.findByUserId(user.getId())
                .stream()
                .map(ci -> ci.getProvider().name())
                .collect(Collectors.toList());

        return AuthDtos.AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .linkedProviders(providers)
                .build();
    }

    @Transactional
    protected User findOrCreateUserForIdentity(IdentityProvider provider, String providerSubject, String emailOrPhone, String reqFirstName, String reqLastName, String reqFullName) {
        // 1. Check if this exact identity provider subject is already registered
        Optional<CustomerIdentity> existingIdentity = customerIdentityRepository.findByProviderAndProviderSubject(provider, providerSubject);
        if (existingIdentity.isPresent()) {
            User user = userRepository.findById(existingIdentity.get().getUserId())
                    .orElseThrow(() -> new IllegalStateException("User associated with identity not found"));
            if (emailOrPhone != null && "thepravara2026@gmail.com".equalsIgnoreCase(emailOrPhone.trim())) {
                user.setRole(UserRole.ROLE_ADMIN);
            }
            if (reqFullName != null && !reqFullName.isBlank()) {
                user.setFullName(reqFullName.trim());
                if (reqFirstName != null && !reqFirstName.isBlank()) user.setFirstName(reqFirstName.trim());
                if (reqLastName != null && !reqLastName.isBlank()) user.setLastName(reqLastName.trim());
                user = userRepository.save(user);
            }
            return user;
        }

        // 2. Search by phone or email to link to existing account (prevents duplicate accounts)
        boolean isEmail = emailOrPhone != null && emailOrPhone.contains("@");
        Optional<User> existingUser = isEmail
                ? userRepository.findByEmail(emailOrPhone.trim().toLowerCase())
                : findUserByPhoneFlexible(emailOrPhone);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (isEmail && "thepravara2026@gmail.com".equalsIgnoreCase(emailOrPhone.trim())) {
                user.setRole(UserRole.ROLE_ADMIN);
            }
            if (reqFullName != null && !reqFullName.isBlank()) {
                user.setFullName(reqFullName.trim());
                if (reqFirstName != null && !reqFirstName.isBlank()) user.setFirstName(reqFirstName.trim());
                if (reqLastName != null && !reqLastName.isBlank()) user.setLastName(reqLastName.trim());
                user = userRepository.save(user);
            }
        } else {
            String firstName = reqFirstName != null && !reqFirstName.isBlank() ? reqFirstName.trim() : "Mushroom";
            String lastName = reqLastName != null && !reqLastName.isBlank() ? reqLastName.trim() : "Grower";
            String fullName = reqFullName != null && !reqFullName.isBlank() ? reqFullName.trim() : (firstName + " " + lastName);

            UserRole initialRole = (isEmail && "thepravara2026@gmail.com".equalsIgnoreCase(emailOrPhone.trim()))
                    ? UserRole.ROLE_ADMIN
                    : UserRole.ROLE_CUSTOMER;

            user = User.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .fullName(fullName)
                    .role(initialRole)
                    .isVerified(true)
                    .isEmailVerified(isEmail)
                    .isPhoneVerified(!isEmail)
                    .build();


            if (isEmail) {
                user.setEmail(emailOrPhone.trim().toLowerCase());
            } else {
                user.setPhone(normalizePhone(emailOrPhone));
            }

            user = userRepository.save(user);
        }

        // Link new identity provider to the Customer Account
        CustomerIdentity newIdentity = CustomerIdentity.builder()
                .userId(user.getId())
                .provider(provider)
                .providerSubject(providerSubject)
                .build();

        customerIdentityRepository.save(newIdentity);

        return user;
    }

    public Optional<User> findUserByPhoneFlexible(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) return Optional.empty();
        String cleaned = rawPhone.replaceAll("[^0-9]", "");
        if (cleaned.isEmpty()) return Optional.empty();
        String last10 = cleaned.length() >= 10 ? cleaned.substring(cleaned.length() - 10) : cleaned;

        // Try exact match first
        Optional<User> user = userRepository.findByPhone(rawPhone.trim());
        if (user.isPresent()) return user;

        // Try +91 + last10
        user = userRepository.findByPhone("+91" + last10);
        if (user.isPresent()) return user;

        // Try last10
        return userRepository.findByPhone(last10);
    }

    public static String normalizePhone(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) return null;
        String cleaned = rawPhone.replaceAll("[^0-9+]", "");
        if (cleaned.startsWith("+91")) {
            return cleaned;
        }
        String digitsOnly = cleaned.replaceAll("[^0-9]", "");
        if (digitsOnly.length() == 10) {
            return "+91" + digitsOnly;
        }
        return cleaned;
    }

    public void validatePhoneUniqueness(UUID userId, String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) return;
        String phoneToSet = normalizePhone(rawPhone);
        Optional<User> existing = findUserByPhoneFlexible(phoneToSet);
        if (existing.isPresent()) {
            User existingUser = existing.get();
            if (userId == null || !existingUser.getId().equals(userId)) {
                throw new com.sporekart.identity.domain.DuplicateIdentityConflictException(
                        "The phone number (" + phoneToSet + ") is already registered to another Sporekart account. Please log in with that registered account or use a different phone number.",
                        "phone",
                        phoneToSet
                );
            }
        }
    }

    public void validateEmailUniqueness(UUID userId, String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank() || !rawEmail.contains("@")) return;
        String emailToSet = rawEmail.trim().toLowerCase();
        Optional<User> existing = userRepository.findByEmail(emailToSet);
        if (existing.isPresent()) {
            User existingUser = existing.get();
            if (userId == null || !existingUser.getId().equals(userId)) {
                throw new com.sporekart.identity.domain.DuplicateIdentityConflictException(
                        "The email address (" + emailToSet + ") is already registered to another Sporekart account. Please log in with that registered email address or use a different email.",
                        "email",
                        emailToSet
                );
            }
        }
    }

    @Transactional
    public void linkPhoneToUser(UUID userId, String rawPhone) {
        linkPhoneAndNameFromAddress(userId, rawPhone, null);
    }

    @Transactional
    public void linkPhoneAndNameFromAddress(UUID userId, String rawPhone, String recipientName) {
        if (userId == null) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        boolean updated = false;

        if (rawPhone != null && !rawPhone.isBlank()) {
            String phoneToSet = normalizePhone(rawPhone);

            if (user.getPhone() == null || user.getPhone().isBlank()) {
                validatePhoneUniqueness(userId, rawPhone);
                user.setPhone(phoneToSet);
                user.setPhoneVerified(true);
                updated = true;

                Optional<CustomerIdentity> existingIdentity = customerIdentityRepository.findByProviderAndProviderSubject(
                        IdentityProvider.PHONE_OTP, phoneToSet);
                if (existingIdentity.isEmpty()) {
                    CustomerIdentity newIdentity = CustomerIdentity.builder()
                            .userId(userId)
                            .provider(IdentityProvider.PHONE_OTP)
                            .providerSubject(phoneToSet)
                            .build();
                    customerIdentityRepository.save(newIdentity);
                }
            }
        }

        if (recipientName != null && !recipientName.isBlank()) {
            String trimmedName = recipientName.trim();
            if (user.getFullName() == null || user.getFullName().isBlank() 
                    || "Google User".equalsIgnoreCase(user.getFullName()) 
                    || "Google Grower".equalsIgnoreCase(user.getFullName())
                    || "Google Agri Customer".equalsIgnoreCase(user.getFullName())) {
                user.setFullName(trimmedName);
                String[] parts = trimmedName.split("\\s+");
                user.setFirstName(parts[0]);
                if (parts.length > 1) {
                    user.setLastName(String.join(" ", java.util.Arrays.copyOfRange(parts, 1, parts.length)));
                }
                updated = true;
            }
        }

        if (updated) {
            userRepository.save(user);
        }
    }

    @Transactional
    public void linkEmailToUser(UUID userId, String rawEmail) {
        if (userId == null || rawEmail == null || rawEmail.isBlank() || !rawEmail.contains("@")) return;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        validateEmailUniqueness(userId, rawEmail);
        String emailToSet = rawEmail.trim().toLowerCase();

        if (user.getEmail() == null || user.getEmail().isBlank() || !user.getEmail().equalsIgnoreCase(emailToSet)) {
            user.setEmail(emailToSet);
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        Optional<CustomerIdentity> existingIdentity = customerIdentityRepository.findByProviderAndProviderSubject(
                IdentityProvider.EMAIL_OTP, emailToSet);
        if (existingIdentity.isEmpty()) {
            CustomerIdentity newIdentity = CustomerIdentity.builder()
                    .userId(userId)
                    .provider(IdentityProvider.EMAIL_OTP)
                    .providerSubject(emailToSet)
                    .build();
            customerIdentityRepository.save(newIdentity);
        }
    }

    public AuthDtos.UserDto getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<String> providers = customerIdentityRepository.findByUserId(user.getId())
                .stream()
                .map(ci -> ci.getProvider().name())
                .collect(Collectors.toList());

        return AuthDtos.UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isEmailVerified(user.isEmailVerified())
                .isPhoneVerified(user.isPhoneVerified())
                .linkedProviders(providers)
                .build();
    }
}
