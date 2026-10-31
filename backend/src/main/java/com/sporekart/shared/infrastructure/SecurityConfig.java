package com.sporekart.shared.infrastructure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AnyRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtTokenProvider tokenProvider;
    private final RequestIdFilter requestIdFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final CsrfOriginValidationFilter csrfOriginValidationFilter;
    private final Environment environment;

    @Value("${app.cors.allowed-origins:${CORS_ALLOWED_ORIGINS:https://sporekart.in,https://www.sporekart.in,https://sporekart.com,https://www.sporekart.com,https://sporekart.vercel.app}}")
    private List<String> allowedOrigins;

    public SecurityConfig(JwtTokenProvider tokenProvider, RequestIdFilter requestIdFilter, RateLimitingFilter rateLimitingFilter, CsrfOriginValidationFilter csrfOriginValidationFilter, Environment environment) {
        this.tokenProvider = tokenProvider;
        this.requestIdFilter = requestIdFilter;
        this.rateLimitingFilter = rateLimitingFilter;
        this.csrfOriginValidationFilter = csrfOriginValidationFilter;
        this.environment = environment;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean isDevOrTest = environment.acceptsProfiles(Profiles.of("dev", "test"));
        http
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> {
                headers.frameOptions(frame -> frame.sameOrigin());
                headers.contentTypeOptions(org.springframework.security.config.Customizer.withDefaults());
                headers.referrerPolicy(referrer -> referrer.policy(
                        org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                headers.permissionsPolicy(permissions -> permissions.policy("camera=(), microphone=(), geolocation=()"));
                headers.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'self'; object-src 'none';"));
                if (!isDevOrTest) {
                    headers.httpStrictTransportSecurity(hsts -> hsts
                            .includeSubDomains(true)
                            .maxAgeInSeconds(31536000)
                            .requestMatcher(AnyRequestMatcher.INSTANCE));
                }
            });
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    String json = new com.fasterxml.jackson.databind.ObjectMapper()
                            .writeValueAsString(com.sporekart.shared.api.ApiResponse.error("UNAUTHORIZED", "Authentication required or token expired"));
                    response.getWriter().write(json);
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    String json = new com.fasterxml.jackson.databind.ObjectMapper()
                            .writeValueAsString(com.sporekart.shared.api.ApiResponse.error("FORBIDDEN", "Access denied"));
                    response.getWriter().write(json);
                })
            )
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers("/actuator/health", "/actuator/info").permitAll();
                if (environment.acceptsProfiles(Profiles.of("dev"))) {
                    auth.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**", "/v3/api-docs.yaml").permitAll();
                } else {
                    auth.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**", "/v3/api-docs.yaml").hasRole("ADMIN");
                }
                if (isDevOrTest) {
                    auth.requestMatchers("/h2-console/**").permitAll();
                }
                auth.requestMatchers("/auth/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/catalog/**", "/catalog", "/products/**", "/products", "/categories/**", "/categories", "/reviews/**", "/activities/**", "/activities").permitAll()
                    .requestMatchers(HttpMethod.GET, "/search", "/search/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/content/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/training/courses/**", "/training/courses", "/training/glimpses").permitAll()
                    .requestMatchers(HttpMethod.POST, "/training/enroll", "/training/bookings").permitAll()
                    .requestMatchers(HttpMethod.GET, "/shipping/check-pincode/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/seo/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/media/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/promotions/available", "/promotions/**").permitAll()
                    .requestMatchers("/cart", "/cart/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/orders", "/orders/").permitAll()
                    .requestMatchers(HttpMethod.GET, "/orders/*", "/orders/*/invoice").permitAll()
                    .requestMatchers(HttpMethod.POST,
                        "/create-order",
                        "/verify-payment",
                        "/payment/initiate", "/payment/verify", "/payment/webhook").permitAll()
                    .requestMatchers(HttpMethod.POST, "/shipping/webhook").permitAll()
                    .requestMatchers(HttpMethod.GET, "/payment/summary").permitAll()
                    .requestMatchers(HttpMethod.POST, "/analytics/track-*").permitAll()
                    .requestMatchers("/admin/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/shipping/create", "/shipping/cancel/**", "/shipping/simulate-event/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.GET, "/shipping/label/**").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.POST, "/media/link").hasRole("ADMIN")
                    .requestMatchers(HttpMethod.DELETE, "/media/**").hasRole("ADMIN")
                    .anyRequest().authenticated();

            })
            .addFilterBefore(csrfOriginValidationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(requestIdFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new JwtAuthenticationFilter(tokenProvider, environment), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        boolean isDevOrTest = environment.acceptsProfiles(Profiles.of("dev", "test"));
        if (isDevOrTest) {
            configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://localhost:5173",
                "http://localhost:3000",
                "https://*.trycloudflare.com"
            ));
        } else {
            // Strictly exclude localhost, 127.0.0.1, or wildcard in production
            List<String> prodOrigins = (allowedOrigins != null ? allowedOrigins : List.<String>of()).stream()
                    .filter(origin -> origin != null && !origin.isBlank())
                    .map(String::trim)
                    .filter(origin -> !origin.contains("localhost") && !origin.contains("127.0.0.1") && !origin.equals("*"))
                    .toList();
            if (prodOrigins.isEmpty()) {
                prodOrigins = List.of("https://sporekart.in", "https://www.sporekart.in", "https://sporekart.com", "https://www.sporekart.com", "https://sporekart.vercel.app");
            }
            configuration.setAllowedOrigins(prodOrigins);
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("X-Request-ID", "Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> shallowEtagHeaderFilter() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> filter =
                new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        filter.addUrlPatterns("/catalog/*", "/products/*", "/training/*", "/content/*", "/categories/*");
        filter.setName("shallowEtagHeaderFilter");
        return filter;
    }
}
