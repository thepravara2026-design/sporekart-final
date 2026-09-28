package com.sporekart.shared.infrastructure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtTokenProvider tokenProvider;
    private final RequestIdFilter requestIdFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final org.springframework.core.env.Environment environment;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://localhost:8080}")
    private List<String> allowedOrigins;

    public SecurityConfig(JwtTokenProvider tokenProvider, RequestIdFilter requestIdFilter, RateLimitingFilter rateLimitingFilter, org.springframework.core.env.Environment environment) {
        this.tokenProvider = tokenProvider;
        this.requestIdFilter = requestIdFilter;
        this.rateLimitingFilter = rateLimitingFilter;
        this.environment = environment;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean isDevOrTest = environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev", "test"));
        http
            .csrf(AbstractHttpConfigurer::disable);
        if (isDevOrTest) {
            http.headers(headers -> headers.frameOptions(frame -> frame.disable()));
        } else {
            http.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));
        }
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication required or token expired\"}}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"FORBIDDEN\",\"message\":\"Access denied\"}}");
                })
            )
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers("/actuator/health", "/actuator/info").permitAll()
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll();
                if (isDevOrTest) {
                    auth.requestMatchers("/h2-console/**").permitAll();
                }
                auth.requestMatchers("/auth/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/catalog/**", "/products/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/search", "/search/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/content/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/training/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/shipping/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/seo/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/media/**").permitAll()
                    .requestMatchers("/cart/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/orders", "/orders/").permitAll()
                    .requestMatchers(HttpMethod.GET, "/orders/*", "/orders/*/invoice").permitAll()
                    .requestMatchers(HttpMethod.POST, "/payment/initiate", "/payment/verify", "/payment/webhook").permitAll()
                    .requestMatchers(HttpMethod.GET, "/payment/summary").permitAll()
                    .requestMatchers(HttpMethod.POST, "/analytics/track-*").permitAll()
                    .requestMatchers("/admin/auth/**").permitAll()
                    .requestMatchers("/admin/**").hasRole("ADMIN")
                    .anyRequest().authenticated();
            })
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(requestIdFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new JwtAuthenticationFilter(tokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("X-Request-ID"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
