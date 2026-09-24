package com.sporekart.identity.application;

import com.sporekart.identity.api.AuthDtos;
import com.sporekart.identity.domain.Otp;
import com.sporekart.identity.domain.OtpType;
import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.OtpRepository;
import com.sporekart.identity.infrastructure.UserRepository;
import com.sporekart.shared.infrastructure.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;
    private final Environment environment;

    private static final int MAX_OTP_ATTEMPTS = 3;
    public static final String MOCK_DEV_OTP = "123456";

    @Transactional
    public void requestAdminOtp(AuthDtos.OtpRequest request) {
        String identifier = request.getIdentifier().trim().toLowerCase();
        boolean isDevOrTest = environment.acceptsProfiles(Profiles.of("dev", "test"));

        Optional<User> existingUser = findAdminUserFlexible(identifier);

        // Auto-bootstrap dev admin if requested with admin credentials in dev mode
        if (existingUser.isEmpty() && isDevOrTest) {
            if (identifier.startsWith("admin@") || identifier.contains("admin") || identifier.endsWith("9999999999") || identifier.equals("9999999999")) {
                User devAdmin = User.builder()
                        .email(identifier.contains("@") ? identifier : "admin@sporekart.in")
                        .phone(identifier.contains("@") ? "+919999999999" : normalizePhone(identifier))
                        .firstName("Sporekart")
                        .lastName("Admin")
                        .fullName("Sporekart Admin")
                        .role(UserRole.ROLE_ADMIN)
                        .isVerified(true)
                        .isEmailVerified(true)
                        .isPhoneVerified(true)
                        .build();
                devAdmin = userRepository.save(devAdmin);
                existingUser = Optional.of(devAdmin);
                log.info("[Dev Mode] Auto-created dev admin account for identifier: {}", identifier);
            }
        }

        if (existingUser.isEmpty() || existingUser.get().getRole() != UserRole.ROLE_ADMIN) {
            throw new IllegalArgumentException("Access Denied: Identifier is not authorized for Admin access.");
        }

        String otpCode = isDevOrTest ? MOCK_DEV_OTP : String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        Otp otp = Otp.builder()
                .identifier(identifier)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .consumed(false)
                .attemptCount(0)
                .otpType(OtpType.ADMIN_AUTH)
                .build();

        otpRepository.save(otp);
        log.info("Generated Admin OTP [{}] for identifier: {}", otpCode, identifier);

        if (identifier.contains("@")) {
            notificationService.sendOtpEmail(identifier, otpCode);
        } else {
            notificationService.sendOtpSms(identifier, otpCode);
        }
    }

    @Transactional
    public AuthDtos.AuthResponse verifyAdminOtp(AuthDtos.VerifyOtpRequest request) {
        String identifier = request.getIdentifier().trim().toLowerCase();
        String code = request.getOtpCode().trim();
        boolean isDevOrTest = environment.acceptsProfiles(Profiles.of("dev", "test"));

        boolean isMockDevOtp = isDevOrTest && MOCK_DEV_OTP.equals(code);

        if (!isMockDevOtp) {
            Otp otp = otpRepository.findTopByIdentifierAndOtpTypeAndConsumedFalseOrderByCreatedAtDesc(identifier, OtpType.ADMIN_AUTH)
                    .orElseThrow(() -> new IllegalArgumentException("No active Admin OTP found or OTP has already been used"));

            if (otp.isConsumed() || otp.isUsed()) {
                throw new IllegalArgumentException("OTP has already been used");
            }

            if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("OTP has expired. Please request a new one.");
            }

            if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
                otp.setConsumed(true);
                otpRepository.save(otp);
                throw new IllegalArgumentException("Maximum OTP verification attempts exceeded.");
            }

            // Validate Admin OTP code strictly against generated code
            if (!otp.getOtpCode().equals(code)) {
                otp.setAttemptCount(otp.getAttemptCount() + 1);
                if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
                    otp.setConsumed(true);
                }
                otpRepository.save(otp);
                throw new IllegalArgumentException("Invalid Admin OTP code.");
            }

            // Mark OTP as consumed (Replay Protection)
            otp.setConsumed(true);
            otp.setUsed(true);
            otpRepository.save(otp);
        }

        User user = findAdminUserFlexible(identifier)
                .orElseThrow(() -> new IllegalArgumentException("Admin account not found"));

        if (user.getRole() != UserRole.ROLE_ADMIN) {
            throw new SecurityException("Privilege Escalation Blocked: User does not hold ROLE_ADMIN");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), identifier, user.getRole().name());

        return AuthDtos.AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .build();
    }

    private Optional<User> findAdminUserFlexible(String identifier) {
        if (identifier.contains("@")) {
            return userRepository.findByEmail(identifier);
        }
        
        // Flexible phone matching
        String cleaned = identifier.replaceAll("[^0-9]", "");
        String last10 = cleaned.length() >= 10 ? cleaned.substring(cleaned.length() - 10) : cleaned;

        Optional<User> user = userRepository.findByPhone(identifier);
        if (user.isPresent()) return user;

        user = userRepository.findByPhone("+91" + last10);
        if (user.isPresent()) return user;

        return userRepository.findByPhone(last10);
    }

    private static String normalizePhone(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) return "+919999999999";
        String cleaned = rawPhone.replaceAll("[^0-9+]", "");
        if (cleaned.startsWith("+91")) return cleaned;
        String digitsOnly = cleaned.replaceAll("[^0-9]", "");
        if (digitsOnly.length() == 10) return "+91" + digitsOnly;
        return cleaned;
    }
}
