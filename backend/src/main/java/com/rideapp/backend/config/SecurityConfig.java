package com.rideapp.backend.config;


import com.rideapp.backend.security.JwtAuthenticationEntryPoint;
import com.rideapp.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity          // allows @PreAuthorize("hasRole('RIDER')") on individual endpoints
@RequiredArgsConstructor

public class SecurityConfig {


    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                // CSRF disabled because we use JWT (stateless) — not cookie-based sessions

                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // allow Angular (localhost:4200) to call our backend

                .authorizeHttpRequests(auth -> auth
                                .requestMatchers("/api/auth/**").permitAll()
                                // /api/auth/register and /api/auth/login are PUBLIC — no token needed

                                .requestMatchers("/api/locations/**").permitAll()
                                // public landing page uses these curated city/address suggestions

                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                // only ADMIN role can access admin endpoints

                                .requestMatchers("/ws/**").permitAll()
                                // WebSocket handshake happens over HTTP first — must be public
                                // Authentication is handled separately inside the WebSocket connection itself

                                // Add to the authorizeHttpRequests block in SecurityConfig.java
                                .requestMatchers("/api/payments/webhook").permitAll()
                                // Webhook comes from Razorpay's servers — no user JWT, verified by signature instead


                                .anyRequest().authenticated()
                        // everything else requires a valid JWT token
                )

                .sessionManagement(session -> session
                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                        // STATELESS = no server-side sessions. Each request must carry its own JWT.
                        // This is how all modern REST APIs work — scalable and clean.
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                )

                .authenticationProvider(authenticationProvider)
                // our custom auth provider (defined in ApplicationConfig below)

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        // run our JWT filter BEFORE Spring's default auth filter

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));  // Angular dev server
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
