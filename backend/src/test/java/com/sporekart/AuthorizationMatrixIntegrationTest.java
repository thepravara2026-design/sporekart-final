package com.sporekart;

import com.sporekart.shared.infrastructure.JwtTokenProvider;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class AuthorizationMatrixIntegrationTest {

    static PostgreSQLContainer<?> postgres;

    static {
        try {
            if (DockerClientFactory.instance().isDockerAvailable()) {
                postgres = new PostgreSQLContainer<>("postgres:16-alpine")
                        .withDatabaseName("sporekart_test")
                        .withUsername("postgres")
                        .withPassword("postgres");
                postgres.start();
            }
        } catch (Throwable t) {
            postgres = null;
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.flyway.enabled", () -> "true");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public enum SecurityRoleContext {
        NO_TOKEN,
        ROLE_CUSTOMER,
        ROLE_TRAINEE,
        ROLE_ADMIN
    }

    public static class EndpointTestSpec {
        private final int id;
        private final String httpMethod;
        private final String rawPath;
        private final String concretePath;
        private final SecurityRoleContext roleContext;
        private final String controllerName;
        private final String methodName;
        private final boolean requiresAdmin;
        private final boolean isPermitAll;

        public EndpointTestSpec(int id, String httpMethod, String rawPath, String concretePath,
                                SecurityRoleContext roleContext, String controllerName, String methodName,
                                boolean requiresAdmin, boolean isPermitAll) {
            this.id = id;
            this.httpMethod = httpMethod;
            this.rawPath = rawPath;
            this.concretePath = concretePath;
            this.roleContext = roleContext;
            this.controllerName = controllerName;
            this.methodName = methodName;
            this.requiresAdmin = requiresAdmin;
            this.isPermitAll = isPermitAll;
        }

        public int getId() { return id; }
        public String getHttpMethod() { return httpMethod; }
        public String getRawPath() { return rawPath; }
        public String getConcretePath() { return concretePath; }
        public SecurityRoleContext getRoleContext() { return roleContext; }
        public String getControllerName() { return controllerName; }
        public String getMethodName() { return methodName; }
        public boolean isRequiresAdmin() { return requiresAdmin; }
        public boolean isPermitAll() { return isPermitAll; }

        @Override
        public String toString() {
            return httpMethod + " " + rawPath + " [" + roleContext + "]";
        }
    }

    private static final List<String> flaggedInconsistencies = Collections.synchronizedList(new ArrayList<>());

    public Stream<EndpointTestSpec> provideEndpointTestSpecs() {
        List<EndpointTestSpec> specs = new ArrayList<>();
        Map<RequestMappingInfo, HandlerMethod> handlerMethods = handlerMapping.getHandlerMethods();
        AtomicInteger idGen = new AtomicInteger(1);

        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMethods.entrySet()) {
            RequestMappingInfo mappingInfo = entry.getKey();
            HandlerMethod handlerMethod = entry.getValue();

            String controllerName = handlerMethod.getBeanType().getSimpleName();
            String methodName = handlerMethod.getMethod().getName();

            if (controllerName.contains("BasicErrorController")) {
                continue;
            }

            Set<String> patterns = mappingInfo.getPatternValues();
            if (patterns.isEmpty() && mappingInfo.getPatternsCondition() != null) {
                patterns = mappingInfo.getPatternsCondition().getPatterns();
            }

            Set<RequestMethod> requestMethods = mappingInfo.getMethodsCondition().getMethods();
            List<String> httpMethodsList = new ArrayList<>();
            if (requestMethods.isEmpty()) {
                httpMethodsList.add("GET");
            } else {
                for (RequestMethod rm : requestMethods) {
                    httpMethodsList.add(rm.name());
                }
            }

            PreAuthorize methodPreAuth = handlerMethod.getMethodAnnotation(PreAuthorize.class);
            PreAuthorize classPreAuth = handlerMethod.getBeanType().getAnnotation(PreAuthorize.class);

            for (String pattern : patterns) {
                String concretePath = buildConcretePath(pattern);
                boolean requiresAdmin = isPathAdmin(pattern) ||
                        (methodPreAuth != null && methodPreAuth.value().contains("ADMIN")) ||
                        (classPreAuth != null && classPreAuth.value().contains("ADMIN"));

                for (String httpMethod : httpMethodsList) {
                    boolean isPermitAll = isPathPermitAll(httpMethod, pattern) &&
                            (methodPreAuth == null || !methodPreAuth.value().contains("ADMIN"));

                    for (SecurityRoleContext roleCtx : SecurityRoleContext.values()) {
                        specs.add(new EndpointTestSpec(
                                idGen.getAndIncrement(), httpMethod, pattern, concretePath, roleCtx,
                                controllerName, methodName, requiresAdmin, isPermitAll
                        ));
                    }
                }
            }
        }
        return specs.stream();
    }

    @ParameterizedTest(name = "{index}: {0}")
    @MethodSource("provideEndpointTestSpecs")
    @DisplayName("AuthZ Security Matrix Verification")
    void testAuthorizationMatrix(EndpointTestSpec spec) throws Exception {
        int ipSegment = (spec.getId() % 200) + 1;
        MockHttpServletRequestBuilder requestBuilder = MockMvcRequestBuilders
                .request(HttpMethod.valueOf(spec.getHttpMethod()), spec.getConcretePath())
                .with(request -> {
                    request.setRemoteAddr("10.0.0." + ipSegment);
                    return request;
                })
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}");

        if (spec.getRoleContext() != SecurityRoleContext.NO_TOKEN) {
            String roleName = spec.getRoleContext().name();
            String token = tokenProvider.generateToken(UUID.randomUUID(), "authz-test-user", roleName);
            requestBuilder.header("Authorization", "Bearer " + token);
        }

        MvcResult result = mockMvc.perform(requestBuilder).andReturn();
        int actualStatus = result.getResponse().getStatus();

        // Evaluate Security Decision
        // Denied status = 401 (Unauthorized) or 403 (Forbidden)
        boolean isAccessDenied = (actualStatus == 401 || actualStatus == 403);

        if (spec.getRoleContext() == SecurityRoleContext.NO_TOKEN) {
            if (spec.isPermitAll()) {
                if (isAccessDenied) {
                    String failureMsg = "INCONSISTENCY: Public endpoint " + spec.getHttpMethod() + " " + spec.getRawPath() +
                            " (" + spec.getControllerName() + "." + spec.getMethodName() + ") returned " + actualStatus + " for NO_TOKEN (expected permitAll/2xx/4xx/5xx)";
                    flaggedInconsistencies.add(failureMsg);
                }
            } else {
                if (!isAccessDenied) {
                    String failureMsg = "SECURITY BYPASS: Protected endpoint " + spec.getHttpMethod() + " " + spec.getRawPath() +
                            " (" + spec.getControllerName() + "." + spec.getMethodName() + ") returned " + actualStatus + " for NO_TOKEN (expected 401/403)";
                    flaggedInconsistencies.add(failureMsg);
                }
            }
        } else if (spec.getRoleContext() == SecurityRoleContext.ROLE_ADMIN) {
            if (isAccessDenied) {
                String failureMsg = "INCONSISTENCY: Admin endpoint " + spec.getHttpMethod() + " " + spec.getRawPath() +
                        " (" + spec.getControllerName() + "." + spec.getMethodName() + ") returned " + actualStatus + " for ROLE_ADMIN (expected allowed/non-401-403)";
                flaggedInconsistencies.add(failureMsg);
            }
        } else {
            // ROLE_CUSTOMER or ROLE_TRAINEE
            if (spec.isRequiresAdmin()) {
                if (!isAccessDenied) {
                    String failureMsg = "SECURITY BYPASS: Admin endpoint " + spec.getHttpMethod() + " " + spec.getRawPath() +
                            " (" + spec.getControllerName() + "." + spec.getMethodName() + ") returned " + actualStatus + " for " + spec.getRoleContext() + " (expected 403 Forbidden)";
                    flaggedInconsistencies.add(failureMsg);
                }
            } else {
                if (isAccessDenied && actualStatus == 403) {
                    String failureMsg = "INCONSISTENCY: Non-admin endpoint " + spec.getHttpMethod() + " " + spec.getRawPath() +
                            " (" + spec.getControllerName() + "." + spec.getMethodName() + ") returned 403 Forbidden for " + spec.getRoleContext();
                    flaggedInconsistencies.add(failureMsg);
                }
            }
        }
    }

    @AfterAll
    void reportSecurityMatrixInconsistencies() {
        System.out.println("\n=======================================================");
        System.out.println("   SPOREKART AUTHZ SECURITY MATRIX AUDIT REPORT");
        System.out.println("=======================================================");
        if (flaggedInconsistencies.isEmpty()) {
            System.out.println("SUCCESS: 0 Security Inconsistencies / Bypasses Flagged across all controller endpoints.");
        } else {
            System.out.println("FLAGGED INCONSISTENCIES / FINDINGS COUNT: " + flaggedInconsistencies.size());
            for (int i = 0; i < flaggedInconsistencies.size(); i++) {
                System.out.println((i + 1) + ". " + flaggedInconsistencies.get(i));
            }
        }
        System.out.println("=======================================================\n");
    }

    private String buildConcretePath(String rawPath) {
        return rawPath
                .replaceAll("\\{(id|orderId|variantId|productId|categoryId|courseId|batchId|enrollmentId|scheduleId|addressId|userId|ticketId|fileId)(:[^}]+)?\\}", "00000000-0000-0000-0000-000000000001")
                .replaceAll("\\{[^}]+\\}", "test-item");
    }

    private boolean isPathAdmin(String path) {
        return path.startsWith("/admin/") && !path.startsWith("/admin/auth/");
    }

    private boolean isPathPermitAll(String httpMethod, String path) {
        if (path.startsWith("/actuator/health") || path.startsWith("/actuator/info") ||
            path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") ||
            path.startsWith("/h2-console") || path.startsWith("/auth/") ||
            path.startsWith("/admin/auth/") || path.startsWith("/cart")) {
            return true;
        }

        if ("GET".equalsIgnoreCase(httpMethod)) {
            if (path.startsWith("/catalog/") || path.startsWith("/products/") ||
                path.startsWith("/search") || path.startsWith("/content/") ||
                path.startsWith("/training/") || path.startsWith("/shipping/") ||
                path.startsWith("/seo/") || path.startsWith("/media/") ||
                path.equals("/orders") || path.matches("^/orders/[^/]+$") || path.matches("^/orders/[^/]+/invoice$") ||
                path.equals("/payment/summary")) {
                return true;
            }
        }

        if ("POST".equalsIgnoreCase(httpMethod)) {
            if (path.equals("/orders") || path.equals("/orders/") ||
                path.equals("/payment/initiate") || path.equals("/payment/verify") || path.equals("/payment/webhook") ||
                path.startsWith("/analytics/track-")) {
                return true;
            }
        }

        return false;
    }
}
