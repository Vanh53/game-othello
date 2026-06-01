package com.game.leaderboard_service.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class InternalSecurityFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Đọc các Header mà API Gateway vừa nhét vào
        String userId = request.getHeader("X-User-Id");
        String rolesHeader = request.getHeader("X-User-Roles");
        String permsHeader = request.getHeader("X-User-Permissions");

        // Nếu có userId, tức là request này đã được Gateway kiểm duyệt
        if (userId != null) {
            List<GrantedAuthority> authorities = new ArrayList<>();

            // Xử lý Roles: Spring bắt buộc Role phải có chữ "ROLE_" đứng trước
            if (rolesHeader != null && !rolesHeader.isBlank()) {
                String[] roles = rolesHeader.split(" ");
                for (String role : roles) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                }
            }

            // Xử lý Permissions: Giữ nguyên tên
            if (permsHeader != null && !permsHeader.isBlank()) {
                String[] perms = permsHeader.split(" ");
                for (String perm : perms) {
                    authorities.add(new SimpleGrantedAuthority(perm));
                }
            }

            // Đóng gói thành đối tượng Authentication (Mật khẩu để null vì không cần thiết)
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);

            // Nhét vào SecurityContext để Spring Security nhận diện
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // Cho phép request đi tiếp vào Controller
        filterChain.doFilter(request, response);
    }
}