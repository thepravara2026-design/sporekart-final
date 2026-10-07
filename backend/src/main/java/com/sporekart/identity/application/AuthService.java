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

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final CustomerIdentityRepository customerIdentityRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;
    private final org.springframework.core.env.Environment environment;
    @org.springframework.context.annotation.Lazy
    private final com.sporekart.customer.infrastructure.CustomerAddressRepository customerAddressRepository;

    private static final int MAX_OTP_ATTEMPTS = 3;
    private static final int RATE_LIMIT_MAX_REQUESTS = 3;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 10;
    private static final int OTP_EXPIRATION_MINUTES = 5;

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
                    "This phone number (" + normalizePhone(rawPhone) + ") is registered only as an alternative delivery contact for an order/address and cannot be used for account login. Please log in using your primary account credential (email or primary phone number)."
            );
        }
    }

    @Transactional
    public void requestOtp(AuthDtos.OtpRequest request, OtpType type) {
        String identifier = request.getIdentifier().trim().toLowerCase();
        if (!identifier.contains("@")) {
            identifier = normalizePhone(identifier);
            checkIfPhoneIsAlternateDeliveryOnly(identifier);
        }

        // 1. Rate Limiting Check
        LocalDateTime tenMinsAgo = LocalDateTime.now().minusMinutes(RATE_LIMIT_WINDOW_MINUTES);
        int recentRequests = otpRepository.countByIdentifierAndOtpTypeAndCreatedAtAfter(identifier, type, tenMinsAgo);
        if (recentRequests >= RATE_LIMIT_MAX_REQUESTS) {
            throw new IllegalArgumentException("Rate limit exceeded. Maximum 3 OTP requests allowed every 10 minutes.");
        }

        String otpCode = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        Otp otp = Otp.builder()
                .identifier(identifier)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES))
                .isUsed(false)
                .consumed(false)
                .attemptCount(0)
                .otpType(type)
                .build();

        otpRepository.save(otp);

        if (identifier.contains("@")) {
            notificationService.sendOtpEmail(identifier, otpCode);
        } else {
            notificationService.sendOtpSms(identifier, otpCode);
        }
    }

    @Transactional
    public AuthDtos.AuthResponse verifyOtp(AuthDtos.VerifyOtpRequest request, OtpType type) {
        String rawIdentifier = request.getIdentifier().trim().toLowerCase();
        String identifier = rawIdentifier.contains("@") ? rawIdentifier : normalizePhone(rawIdentifier);
        if (!identifier.contains("@")) {
            checkIfPhoneIsAlternateDeliveryOnly(identifier);
        }
        String code = request.getOtpCode().trim();

        boolean isDevOrTest = environment != null && environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev", "test"));
        boolean isMockDevOtp = isDevOrTest && "123456".equals(code);

        if (!isMockDevOtp) {
            Otp otp = otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(identifier, type)
                    .orElseGet(() -> otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(rawIdentifier, type)
                            .orElseThrow(() -> new IllegalArgumentException("No active OTP found or OTP has already been used")));

            if (otp.isConsumed() || otp.isUsed()) {
                throw new IllegalArgumentException("OTP has already been used");
            }

            if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("OTP has expired. Please request a new one.");
            }

            if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
                otp.setConsumed(true);
                otpRepository.save(otp);
                throw new IllegalArgumentException("Maximum OTP verification attempts exceeded. Please request a new OTP.");
            }

            if (!otp.getOtpCode().equals(code)) {
                otp.setAttemptCount(otp.getAttemptCount() + 1);
                if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
                    otp.setConsumed(true);
                }
                otpRepository.save(otp);
                throw new IllegalArgumentException("Invalid OTP code provided. Attempts remaining: " + (MAX_OTP_ATTEMPTS - otp.getAttemptCount()));
            }

            // Mark OTP as consumed (Replay Protection)
            otp.setConsumed(true);
            otp.setUsed(true);
            otpRepository.save(otp);
        } else {
            // Dev Mock OTP: consume active OTP if present, enforcing expiration & replay protection
            Optional<Otp> activeOtpOpt = otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(identifier, type);
            if (activeOtpOpt.isEmpty()) {
                activeOtpOpt = otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(rawIdentifier, type);
            }
            if (activeOtpOpt.isPresent()) {
                Otp activeOtp = activeOtpOpt.get();
                if (activeOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
                    activeOtp.setConsumed(true);
                    otpRepository.save(activeOtp);
                    throw new IllegalArgumentException("OTP has expired. Please request a new one.");
                }
                activeOtp.setConsumed(true);
                activeOtp.setUsed(true);
                otpRepository.save(activeOtp);
            } else {
                // If an OTP was previously created and consumed for this identifier, block replay attempt
                if (otpRepository.existsByIdentifierAndOtpTypeAndConsumedTrue(identifier, type) ||
                    otpRepository.existsByIdentifierAndOtpTypeAndConsumedTrue(rawIdentifier, type)) {
                    throw new IllegalArgumentException("OTP has already been used");
                }
            }
        }

        // Find or create Customer
        boolean isEmail = identifier.contains("@");
        IdentityProvider provider = isEmail ? IdentityProvider.EMAIL_OTP : IdentityProvider.PHONE_OTP;

        User user = findOrCreateUserForIdentity(provider, identifier, identifier, request.getFirstName(), request.getLastName(), request.getFullName());

        String token = jwtTokenProvider.generateToken(user.getId(), identifier, user.getRole().name());

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
    public AuthDtos.AuthResponse loginWithGoogle(AuthDtos.GoogleOAuthRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String googleSub = request.getGoogleSub().trim();

        User user = findOrCreateUserForIdentity(IdentityProvider.GOOGLE, googleSub, email, request.getFirstName(), request.getLastName(), request.getFullName());

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

            user = User.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .fullName(fullName)
                    .role(UserRole.ROLE_CUSTOMER)
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
