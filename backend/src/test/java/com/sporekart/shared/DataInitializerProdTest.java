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
    "spring.datasource.url=jdbc:h2:mem:prodtestdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false"
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
