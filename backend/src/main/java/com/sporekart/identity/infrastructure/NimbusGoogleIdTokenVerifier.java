package com.sporekart.identity.infrastructure;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import com.sporekart.identity.application.GoogleIdTokenVerifier;
import com.sporekart.identity.application.GoogleTokenClaims;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URL;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@Profile("!test")
public class NimbusGoogleIdTokenVerifier implements GoogleIdTokenVerifier {

    private static final String DEFAULT_GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> ACCEPTED_ISSUERS = new HashSet<>(Arrays.asList(
            "https://accounts.google.com",
            "accounts.google.com"
    ));

    @Value("${spring.security.oauth2.client.registration.google.client-id:${GOOGLE_CLIENT_ID:}}")
    private String googleClientId;

    @Value("${app.google.jwks-url:" + DEFAULT_GOOGLE_JWKS_URL + "}")
    private String googleJwksUrl;

    private ConfigurableJWTProcessor<SecurityContext> jwtProcessor;

    @PostConstruct
    public void init() {
        try {
            ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
            URL jwksUrl = URI.create(googleJwksUrl).toURL();
            JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(jwksUrl);
            JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(
                    JWSAlgorithm.RS256,
                    keySource
            );
            processor.setJWSKeySelector(keySelector);
            this.jwtProcessor = processor;
        } catch (Exception e) {
            log.error("Failed to initialize Google ID token verifier: {}", e.getMessage(), e);
        }
    }

    @Override
    public GoogleTokenClaims verify(String idToken) {
        if (!StringUtils.hasText(idToken)) {
            throw new BadCredentialsException("Google ID token is required");
        }
        if (jwtProcessor == null) {
            init();
            if (jwtProcessor == null) {
                throw new BadCredentialsException("Google token verification service unavailable");
            }
        }
        try {
            JWTClaimsSet claimsSet = jwtProcessor.process(idToken, null);

            // 1. Verify Issuer
            String iss = claimsSet.getIssuer();
            if (iss == null || !ACCEPTED_ISSUERS.contains(iss)) {
                throw new BadCredentialsException("Invalid token issuer: " + iss);
            }

            // 2. Verify Audience
            List<String> audience = claimsSet.getAudience();
            if (StringUtils.hasText(googleClientId)) {
                if (audience == null || !audience.contains(googleClientId)) {
                    throw new BadCredentialsException("Google ID token audience mismatch");
                }
            } else {
                log.warn("GOOGLE_CLIENT_ID not configured; audience check skipped in non-prod configuration");
            }

            // 3. Verify Expiration
            Date exp = claimsSet.getExpirationTime();
            if (exp == null || exp.before(new Date())) {
                throw new BadCredentialsException("Google ID token has expired");
            }

            // 4. Verify email_verified
            Object emailVerifiedClaim = claimsSet.getClaim("email_verified");
            boolean emailVerified = false;
            if (emailVerifiedClaim instanceof Boolean b) {
                emailVerified = b;
            } else if (emailVerifiedClaim instanceof String s) {
                emailVerified = Boolean.parseBoolean(s);
            }
            if (!emailVerified) {
                throw new BadCredentialsException("Google account email is not verified");
            }

            String sub = claimsSet.getSubject();
            String email = (String) claimsSet.getClaim("email");
            if (!StringUtils.hasText(sub) || !StringUtils.hasText(email)) {
                throw new BadCredentialsException("Google ID token missing subject or email");
            }

            String name = (String) claimsSet.getClaim("name");
            String givenName = (String) claimsSet.getClaim("given_name");
            String familyName = (String) claimsSet.getClaim("family_name");
            String picture = (String) claimsSet.getClaim("picture");

            return new GoogleTokenClaims(sub, email, true, name, givenName, familyName, picture);
        } catch (BadCredentialsException bce) {
            throw bce;
        } catch (Exception e) {
            log.error("Google ID token verification failed: {}", e.getMessage());
            throw new BadCredentialsException("Invalid Google ID token: " + e.getMessage(), e);
        }
    }
}

