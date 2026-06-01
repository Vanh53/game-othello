package com.game.pvp_service.config;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new GatewayHeaderHandshakeInterceptor())
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
                    if (sessionAttrs == null) {
                        log.warn("WebSocket CONNECT rejected: no session attributes");
                        return null;
                    }

                    String userId = (String) sessionAttrs.get("X-User-Id");
                    if (userId == null || userId.isBlank()) {
                        log.warn("WebSocket CONNECT rejected: missing X-User-Id header from Gateway");
                        return null;
                    }

                    // Xây dựng authorities giống hệt InternalSecurityFilter
                    List<GrantedAuthority> authorities = new ArrayList<>();

                    String rolesHeader = (String) sessionAttrs.get("X-User-Roles");
                    if (rolesHeader != null && !rolesHeader.isBlank()) {
                        for (String role : rolesHeader.split(" ")) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                        }
                    }

                    String permsHeader = (String) sessionAttrs.get("X-User-Permissions");
                    if (permsHeader != null && !permsHeader.isBlank()) {
                        for (String perm : permsHeader.split(" ")) {
                            authorities.add(new SimpleGrantedAuthority(perm));
                        }
                    }

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    accessor.setUser(auth);

                    log.info("WebSocket CONNECT authenticated: userId={}", userId);
                }
                return message;
            }
        });
    }

    /**
     * Interceptor bắt các header X-User-Id, X-User-Roles, X-User-Permissions
     * mà API Gateway đã nhét vào HTTP request (sau khi verify JWT).
     * Lưu vào WebSocket session attributes để dùng khi STOMP CONNECT.
     */
    private static class GatewayHeaderHandshakeInterceptor implements HandshakeInterceptor {

        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Map<String, Object> attributes) {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                HttpServletRequest httpRequest = servletRequest.getServletRequest();

                String userId = httpRequest.getHeader("X-User-Id");
                String roles = httpRequest.getHeader("X-User-Roles");
                String permissions = httpRequest.getHeader("X-User-Permissions");

                if (userId != null) attributes.put("X-User-Id", userId);
                if (roles != null) attributes.put("X-User-Roles", roles);
                if (permissions != null) attributes.put("X-User-Permissions", permissions);
            }
            return true; // Luôn cho phép handshake, kiểm tra auth ở bước STOMP CONNECT
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Exception exception) {
            // Không cần xử lý gì
        }
    }
}
