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

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://localhost:8080}")
    private List<String> allowedOrigins;

    public SecurityConfig(JwtTokenProvider tokenProvider, RequestIdFilter requestIdFilter, RateLimitingFilter rateLimitingFilter) {
        this.tokenProvider = tokenProvider;
        this.requestIdFilter = requestIdFilter;
        this.rateLimitingFilter = rateLimitingFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/auth/**", "/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/catalog/**", "/api/v1/catalog/**", "/products/**", "/api/v1/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/search", "/search/**", "/api/v1/search/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/content/**", "/api/v1/content/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/training/**", "/api/v1/training/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/shipping/**", "/api/v1/shipping/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/seo/**", "/api/v1/seo/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/media/**", "/api/v1/media/**").permitAll()
                .requestMatchers("/cart/**", "/api/v1/cart/**").permitAll()
                .requestMatchers("/orders/**", "/api/v1/orders/**").permitAll()
                .requestMatchers("/payment/**", "/api/v1/payment/**").permitAll()
                .requestMatchers("/analytics/**", "/api/v1/analytics/**").permitAll()
                .requestMatchers("/admin/**", "/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
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
