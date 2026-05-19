package com.game.api_gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.core.convert.converter.Converter;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;

import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;

import org.springframework.security.web.server.SecurityWebFilterChain;

import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Value("${app.jwt.signerKey}")
    private String jwtSecret;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(
            ServerHttpSecurity http,
            Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthenticationConverter
    ) {
        return http
                // API Gateway thường dùng JWT/stateless nên tắt CSRF
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                // Không dùng form login trong REST API / API Gateway
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)

                // Không dùng HTTP Basic nếu đã dùng JWT
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)

                // Không cần logout server-side nếu dùng JWT stateless
                .logout(ServerHttpSecurity.LogoutSpec::disable)

                .authorizeExchange(exchange -> exchange

                        // Cho phép preflight CORS request
                        .pathMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                        // Public endpoint
                        .pathMatchers(
                                "/actuator/health",
                                "/actuator/info",

                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/webjars/**",

                                "/api/auth/**"
                        ).permitAll()

                        // Ví dụ route chỉ ADMIN được vào
                        .pathMatchers("/api/admin/**").hasRole("ADMIN")

                        // Ví dụ route USER hoặc ADMIN được vào
                        .pathMatchers("/api/users/**").hasAnyRole("USER", "ADMIN")

                        // Các request còn lại bắt buộc có token hợp lệ
                        .anyExchange().authenticated()
                )

                // Cấu hình Gateway là OAuth2 Resource Server dùng JWT
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter)
                        )
                )

                .build();
    }

    @Bean
    public ReactiveJwtDecoder reactiveJwtDecoder() {
        SecretKey key = new SecretKeySpec(
                jwtSecret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        );

        return NimbusReactiveJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public Converter<Jwt, Mono<AbstractAuthenticationToken>> jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();

        /*
         * Nếu trong JWT có claim:
         *
         * "roles": ["ADMIN", "USER"]
         *
         * thì Spring Security sẽ convert thành:
         * ROLE_ADMIN, ROLE_USER
         */
        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtConverter =
                new JwtAuthenticationConverter();

        jwtConverter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);

        return new ReactiveJwtAuthenticationConverterAdapter(jwtConverter);
    }
}