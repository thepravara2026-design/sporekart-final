package com.sporekart.shared;

import com.sporekart.identity.infrastructure.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "app.jwt.secret=c3BvcmVrYXJ0LXByb2QtdGVzdC1qd3Qtc2VjcmV0LWtleS0yNTZiaXRzLWxvbmctZW5vdWdo",
    "app.razorpay.mock-mode=false",
    "app.razorpay.key-id=rzp_live_prod_test_12345678",
    "app.razorpay.key-secret=prod_test_razorpay_key_secret_valid_length_998877",
    "app.razorpay.webhook-secret=prod_test_razorpay_webhook_secret_valid_length_998877",
    "sporekart.shiprocket.use-real-shiprocket=true",
    "sporekart.shiprocket.email=admin@sporekart.in",
    "sporekart.shiprocket.password=prod_test_shiprocket_password_valid",
    "sporekart.shiprocket.pickup-location=Primary",
    "sporekart.shiprocket.pickup-pincode=560001",
    "sporekart.shiprocket.webhook-token=prod_test_shiprocket_webhook_token_valid",
    "app.supabase.url=https://test.supabase.co",
    "app.supabase.anon-key=test_anon_key_for_prod_profile_test",
    "spring.datasource.url=jdbc:h2:mem:prodtestdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=super_secure_prod_test_db_password_12345",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false",
    "spring.security.oauth2.client.registration.google.client-id=mock-client-id.apps.googleusercontent.com",
    "spring.security.oauth2.client.registration.google.client-secret=mock-client-secret-12345"
})
public class DataInitializerProdTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void testProdProfileDoesNotSeedPredictableAdmin() {
        assertTrue(userRepository.findByEmail("admin@sporekart.in").isEmpty(),
                "Prod profile must NEVER seed predictable admin@sporekart.in user");
    }
}
