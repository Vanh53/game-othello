package com.game.api_gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class LoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        String path = exchange.getRequest().getURI().getPath();

        log.info("Incoming Request: Method={}, URI={}, ClientIP={}",
                exchange.getRequest().getMethod(),
                path,
                exchange.getRequest().getRemoteAddress());

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            long executeTime = System.currentTimeMillis() - startTime;
            log.info("Outgoing Response: URI={}, Status={}, TimeTaken={}ms",
                    path,
                    exchange.getResponse().getStatusCode(),
                    executeTime);
        }));
    }

    @Override
    public int getOrder() {
        return -1; // Đứng đầu tiên để đếm thời gian cho chính xác
    }
}