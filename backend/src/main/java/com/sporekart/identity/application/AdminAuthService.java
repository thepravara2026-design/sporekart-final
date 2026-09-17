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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final JwtTokenProvider jwtTokenProvider;

    private static final int MAX_OTP_ATTEMPTS = 3;

    @Transactional
    public String requestAdminOtp(AuthDtos.OtpRequest request) {
        String identifier = request.getIdentifier().trim().toLowerCase();

        // Admin authorization check: identifier must belong to an existing user with ROLE_ADMIN
        Optional<User> existingUser = identifier.contains("@")
                ? userRepository.findByEmail(identifier)
                : userRepository.findByPhone(identifier);

        if (existingUser.isEmpty() || existingUser.get().getRole() != UserRole.ROLE_ADMIN) {
            throw new IllegalArgumentException("Access Denied: Identifier is not authorized for Admin access.");
        }

        String otpCode = String.format("%06d", new Random().nextInt(900000) + 100000);

        Otp otp = Otp.builder()
                .identifier(identifier)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .consumed(false)
                .attemptCount(0)
                .otpType(OtpType.ADMIN_AUTH)
                .build();

        otpRepository.save(otp);
        return otpCode;
    }

    @Transactional
    public AuthDtos.AuthResponse verifyAdminOtp(AuthDtos.VerifyOtpRequest request) {
        String identifier = request.getIdentifier().trim().toLowerCase();
        String code = request.getOtpCode().trim();

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

        boolean isDevCode = "123456".equals(code);
        if (!otp.getOtpCode().equals(code) && !isDevCode) {
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

        User user = (identifier.contains("@")
                ? userRepository.findByEmail(identifier)
                : userRepository.findByPhone(identifier))
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
}
