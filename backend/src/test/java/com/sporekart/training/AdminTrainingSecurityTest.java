package com.sporekart.training;

import com.sporekart.shared.infrastructure.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminTrainingSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String customerToken;

    @BeforeEach
    void setUp() {
        customerToken = jwtTokenProvider.generateToken(UUID.randomUUID(), "customer@sporekart.in", "ROLE_CUSTOMER");
    }

    @Test
    void testAnonymousAccessDenied() throws Exception {
        mockMvc.perform(post("/admin/training/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test\",\"slug\":\"test\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCustomerRoleAccessDenied() throws Exception {
        mockMvc.perform(post("/admin/training/categories")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test\",\"slug\":\"test\"}"))
                .andExpect(status().isForbidden());
    }
}
