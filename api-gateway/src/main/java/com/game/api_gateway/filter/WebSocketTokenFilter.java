package com.game.api_gateway.filter;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class WebSocketTokenFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        if (request.getURI().getPath().startsWith("/ws")) {
            String token = request.getQueryParams().getFirst("token");

            if (token != null && !token.isBlank()) {
                ServerHttpRequest mutatedRequest = request.mutate()
                        .headers(headers -> {
                            headers.remove(HttpHeaders.AUTHORIZATION);
                            headers.setBearerAuth(token);
                        })
                        .build();

                return chain.filter(
                        exchange.mutate().request(mutatedRequest).build()
                );
            }
        }

        return chain.filter(exchange);
    }
}