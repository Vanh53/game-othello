package com.game.api_gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class HeaderRelayFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
                .filter(context -> context.getAuthentication() != null && context.getAuthentication().getPrincipal() instanceof Jwt)
                .map(context -> (Jwt) context.getAuthentication().getPrincipal())
                .map(jwt -> {
                    // Lấy các giá trị từ token
                    String userId = jwt.getSubject();
                    String role = jwt.getClaimAsString("scope");
                    String permissions = jwt.getClaimAsString("permissions");

                    ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                            .header("X-User-Id", userId)
                            .header("X-User-Role", role != null ? role : "USER")
                            .header("X-User-Permissions", permissions != null ? permissions : "")
                            .build();

                    return exchange.mutate().request(mutatedRequest).build();
                })
                .defaultIfEmpty(exchange) // Nếu là Public API (Không có JWT), giữ nguyên Request
                .flatMap(chain::filter);
    }

    @Override
    public int getOrder() {
        return 0; // Chạy sau Security Filter
    }
}