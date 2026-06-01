package com.game.api_gateway.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule; // Bổ sung thư viện parse ngày tháng
import com.game.api_gateway.exception.ErrorResponse;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class GatewayAuthenticationEntryPoint implements ServerAuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    // Khởi tạo ObjectMapper có module hỗ trợ LocalDateTime (Giống hệt GlobalExceptionHandler)
    public GatewayAuthenticationEntryPoint() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body;
        try {
            // Đã tách khai báo biến ra khỏi hàm để không bị lỗi compile
            ErrorResponse errorResponse = ErrorResponse.builder()
                    .status(401)
                    .error("Unauthorized")
                    .message("Token không hợp lệ hoặc đã hết hạn")
                    .path(exchange.getRequest().getURI().getPath())
                    .build();

            body = objectMapper.writeValueAsString(errorResponse);

        } catch (JsonProcessingException e) {
            // Chỉnh lại format cho chuẩn với các trường của ErrorResponse
            body = "{\"status\": 401, \"error\": \"Unauthorized\", \"message\": \"Lỗi xác thực dữ liệu\"}";
        }

        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}