package com.sporekart.shared.infrastructure;

import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile("prod")
@RequiredArgsConstructor
public class ProdAdminBootstrapInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Value("${ADMIN_BOOTSTRAP_EMAIL:}")
    private String bootstrapEmail;

    @Value("${ADMIN_BOOTSTRAP_PHONE:}")
    private String bootstrapPhone;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        boolean hasAdmin = userRepository.findAll().stream()
                .anyMatch(user -> user.getRole() == UserRole.ROLE_ADMIN);

        if (!hasAdmin) {
            if (bootstrapEmail != null && !bootstrapEmail.isBlank() && bootstrapPhone != null && !bootstrapPhone.isBlank()) {
                User admin = User.builder()
                        .email(bootstrapEmail.trim().toLowerCase())
                        .phone(bootstrapPhone.trim())
                        .firstName("Prod")
                        .lastName("Admin")
                        .fullName("Prod Admin")
                        .role(UserRole.ROLE_ADMIN)
                        .isVerified(true)
                        .isEmailVerified(true)
                        .isPhoneVerified(true)
                        .build();
                userRepository.save(admin);
                log.info("Production admin account successfully bootstrapped for email: {}", bootstrapEmail.trim());
            } else {
                log.warn("SECURITY NOTICE: No admin user exists. Set env vars ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PHONE and restart to create the first admin user.");
            }
        }
    }
}
