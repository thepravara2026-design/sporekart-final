package com.sporekart.identity.infrastructure;

import com.sporekart.identity.application.GoogleIdTokenVerifier;
import com.sporekart.identity.application.GoogleTokenClaims;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Profile("test")
public class TestGoogleIdTokenVerifier implements GoogleIdTokenVerifier {

    private final Map<String, GoogleTokenClaims> tokenClaimsRegistry = new ConcurrentHashMap<>();

    public void registerToken(String idToken, GoogleTokenClaims claims) {
        tokenClaimsRegistry.put(idToken, claims);
    }

    public void clearTokens() {
        tokenClaimsRegistry.clear();
    }

    @Override
    public GoogleTokenClaims verify(String idToken) {
        if (!StringUtils.hasText(idToken)) {
            throw new BadCredentialsException("Google ID token is required for OAuth login");
        }

        if (tokenClaimsRegistry.containsKey(idToken)) {
            GoogleTokenClaims registered = tokenClaimsRegistry.get(idToken);
            if (!registered.emailVerified()) {
                throw new BadCredentialsException("Google account email is not verified");
            }
            return registered;
        }

        if ("invalid_token".equals(idToken) || idToken.startsWith("invalid_") || "forged_signature_token".equals(idToken)) {
            throw new BadCredentialsException("Invalid Google ID token signature or payload");
        }
        if ("unverified_email_token".equals(idToken) || idToken.contains("unverified")) {
            throw new BadCredentialsException("Google account email is not verified");
        }
        if ("mismatched_aud_token".equals(idToken) || idToken.contains("bad_aud")) {
            throw new BadCredentialsException("Google ID token audience mismatch");
        }
        if ("expired_token".equals(idToken) || idToken.contains("expired")) {
            throw new BadCredentialsException("Google ID token has expired");
        }

        // Test token format fallback: test_token_<email_or_sub>
        String sub = "test_google_sub_123";
        String email = "test.user@sporekart.in";
        String name = "Test User";
        String givenName = "Test";
        String familyName = "User";

        if (idToken.startsWith("test_token_")) {
            String identifier = idToken.substring("test_token_".length());
            if (identifier.contains("@")) {
                email = identifier;
                sub = "sub_" + Math.abs(identifier.hashCode());
            } else {
                sub = identifier;
                email = identifier + "@example.com";
            }
        } else if (idToken.startsWith("sub_")) {
            sub = idToken;
            email = idToken + "@example.com";
        }

        return new GoogleTokenClaims(sub, email, true, name, givenName, familyName, null);
    }
}
