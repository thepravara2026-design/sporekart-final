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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final CustomerIdentityRepository customerIdentityRepository;
    private final JwtTokenProvider jwtTokenProvider;

    private static final int MAX_OTP_ATTEMPTS = 3;
    private static final int RATE_LIMIT_MAX_REQUESTS = 3;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 10;
    private static final int OTP_EXPIRATION_MINUTES = 5;

    @Transactional
    public String requestOtp(AuthDtos.OtpRequest request, OtpType type) {
        String identifier = request.getIdentifier().trim().toLowerCase();

        // 1. Rate Limiting Check
        LocalDateTime tenMinsAgo = LocalDateTime.now().minusMinutes(RATE_LIMIT_WINDOW_MINUTES);
        int recentRequests = otpRepository.countByIdentifierAndOtpTypeAndCreatedAtAfter(identifier, type, tenMinsAgo);
        if (recentRequests >= RATE_LIMIT_MAX_REQUESTS) {
            throw new IllegalArgumentException("Rate limit exceeded. Maximum 3 OTP requests allowed every 10 minutes.");
        }

        String otpCode = String.format("%06d", new Random().nextInt(900000) + 100000);

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
        return otpCode;
    }

    @Transactional
    public AuthDtos.AuthResponse verifyOtp(AuthDtos.VerifyOtpRequest request, OtpType type) {
        String identifier = request.getIdentifier().trim().toLowerCase();
        String code = request.getOtpCode().trim();

        Otp otp = otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(identifier, type)
                .orElseThrow(() -> new IllegalArgumentException("No active OTP found or OTP has already been used"));

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

        // Validate OTP code strictly against generated code
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
            return userRepository.findById(existingIdentity.get().getUserId())
                    .orElseThrow(() -> new IllegalStateException("User associated with identity not found"));
        }

        // 2. Search by phone or email to link to existing account (prevents duplicate accounts)
        boolean isEmail = emailOrPhone != null && emailOrPhone.contains("@");
        Optional<User> existingUser = isEmail
                ? userRepository.findByEmail(emailOrPhone)
                : userRepository.findByPhone(emailOrPhone);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            String firstName = reqFirstName != null && !reqFirstName.isBlank() ? reqFirstName : "Mushroom";
            String lastName = reqLastName != null && !reqLastName.isBlank() ? reqLastName : "Grower";
            String fullName = reqFullName != null && !reqFullName.isBlank() ? reqFullName : (firstName + " " + lastName);

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
                user.setEmail(emailOrPhone);
            } else {
                user.setPhone(emailOrPhone);
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
