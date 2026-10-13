package com.sporekart.identity.application;

import com.sporekart.identity.domain.User;
import com.sporekart.identity.domain.UserRole;
import com.sporekart.identity.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final UserRepository userRepository;

    public Optional<User> findAdminUserByEmail(String email) {
        if (email == null || email.isBlank()) return Optional.empty();
        String normalized = email.trim().toLowerCase();
        if (!"thepravara2026@gmail.com".equals(normalized) && !"admin@sporekart.in".equals(normalized)) {
            log.warn("Access attempt to admin auth with unauthorized email: {}", normalized);
            return Optional.empty();
        }
        Optional<User> user = userRepository.findByEmail(normalized);
        if (user.isPresent() && user.get().getRole() == UserRole.ROLE_ADMIN) {
            return user;
        }
        return Optional.empty();
    }
}
