package com.game.game_othello.service;

import com.game.game_othello.dto.request.AuthenticationRequest;
import com.game.game_othello.dto.request.IntrospectRequest;
import com.game.game_othello.dto.response.AuthenticationResponse;
import com.game.game_othello.dto.response.IntrospectResponse;
import com.game.game_othello.entity.Role;
import com.game.game_othello.entity.User;
import com.game.game_othello.exception.AppException;
import com.game.game_othello.exception.ErrorCode;
import com.game.game_othello.exception.UserExitedException;
import com.game.game_othello.repository.RoleRepository;
import com.game.game_othello.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${google.client-id}")
    protected String GOOGLE_CLIENT_ID;

    @NonFinal
    @Value("${google.client-secret}")
    protected String GOOGLE_CLIENT_SECRET;

    @NonFinal
    @Value("${google.redirect-uri}")
    protected String GOOGLE_REDIRECT_URI;

    @NonFinal
    @Value("${google.token-url}")
    protected String GOOGLE_TOKEN_URL;

    @NonFinal
    @Value("${google.userinfo-url}")
    protected String GOOGLE_USERINFO_URL;

    @NonFinal
    @Value("${mezon.client-id}")
    protected String MEZON_CLIENT_ID;

    @NonFinal
    @Value("${mezon.client-secret}")
    protected String MEZON_CLIENT_SECRET;

    @NonFinal
    @Value("${mezon.redirect-uri}")
    protected String MEZON_REDIRECT_URI;

    @NonFinal
    @Value("${mezon.token-url}")
    protected String MEZON_TOKEN_URL;

    @NonFinal
    @Value("${mezon.userinfo-url}")
    protected String MEZON_USERINFO_URL;

    public IntrospectResponse introspect (IntrospectRequest request)
            throws JOSEException, ParseException {
        var token = request.getToken();
        JWSVerifier jwsVerifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        var verified = signedJWT.verify(jwsVerifier);
        return IntrospectResponse.builder()
                .valid(verified && expTime.after(new Date()))
                .build();

    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UserExitedException(ErrorCode.USER_NOT_EXIST));
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!authenticated)
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        var token = generateToken(user);
        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    private String generateToken(User user) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId().toString())
                .issuer("game.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(24, ChronoUnit.HOURS).toEpochMilli()
                ))
                .claim("scope", buildScope(user))
                .claim("name", user.getName())
                .build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user) {
        Set<Role> roles = user.getRoles();
        StringJoiner stringJoiner = new StringJoiner(" ");
        for(Role role: roles) stringJoiner.add(role.getRoleName());
        return stringJoiner.toString();
    }

    @SuppressWarnings("unchecked")
    public AuthenticationResponse loginWithGoogle(String code) {
        RestTemplate restTemplate = new RestTemplate();

        // Đổi code lấy access_token từ Google
        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> tokenParams = new LinkedMultiValueMap<>();
        tokenParams.add("code", code);
        tokenParams.add("client_id", GOOGLE_CLIENT_ID);
        tokenParams.add("client_secret", GOOGLE_CLIENT_SECRET);
        tokenParams.add("redirect_uri", GOOGLE_REDIRECT_URI);
        tokenParams.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(tokenParams, tokenHeaders);
        Map<String, Object> tokenResponse = restTemplate.postForObject(GOOGLE_TOKEN_URL, tokenRequest, Map.class);

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        String accessToken = (String) tokenResponse.get("access_token");

        // Lấy thông tin user từ Google
        HttpHeaders userInfoHeaders = new HttpHeaders();
        userInfoHeaders.setBearerAuth(accessToken);
        HttpEntity<Void> userInfoRequest = new HttpEntity<>(userInfoHeaders);

        Map<String, Object> userInfo = restTemplate.exchange(
                GOOGLE_USERINFO_URL, HttpMethod.GET, userInfoRequest, Map.class
        ).getBody();

        if (userInfo == null || !userInfo.containsKey("email")) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String email = (String) userInfo.get("email");
        String name = (String) userInfo.getOrDefault("name", email);
        String picture = (String) userInfo.getOrDefault("picture", null);
        String googleSub = (String) userInfo.get("sub");

        // Tìm hoặc tạo user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            Role defaultRole = roleRepository.findByRoleName("USER")
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            Set<Role> roles = new HashSet<>();
            roles.add(defaultRole);
            // username = "google_" + sub để tránh trùng
            String username = "google_" + googleSub;

            User newUser = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .email(email)
                    .name(name)
                    .status("ACTIVE")
                    .avatar(picture)
                    .roles(roles)
                    .build();
            return userRepository.save(newUser);
        });

        String jwt = generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwt)
                .authenticated(true)
                .build();
    }

    @SuppressWarnings("unchecked")
    public AuthenticationResponse loginWithMezon(String code, String state) {
        RestTemplate restTemplate = new RestTemplate();

        // Đổi code lấy access_token từ Mezon
        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> tokenParams = new LinkedMultiValueMap<>();
        tokenParams.add("code", code);
        tokenParams.add("state", state);
        tokenParams.add("client_id", MEZON_CLIENT_ID);
        tokenParams.add("client_secret", MEZON_CLIENT_SECRET);
        tokenParams.add("redirect_uri", MEZON_REDIRECT_URI);
        tokenParams.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(tokenParams, tokenHeaders);
        Map<String, Object> tokenResponse = restTemplate.postForObject(MEZON_TOKEN_URL, tokenRequest, Map.class);

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        String accessToken = (String) tokenResponse.get("access_token");

        // Lấy thông tin user từ Mezon
        HttpHeaders userInfoHeaders = new HttpHeaders();
        userInfoHeaders.setBearerAuth(accessToken);
        HttpEntity<Void> userInfoRequest = new HttpEntity<>(userInfoHeaders);

        Map<String, Object> userInfo = restTemplate.exchange(
                MEZON_USERINFO_URL, HttpMethod.GET, userInfoRequest, Map.class
        ).getBody();

        if (userInfo == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Mezon userinfo: ưu tiên email, fallback sang sub làm định danh
        String email = (String) userInfo.get("email");
        String mezonSub = (String) userInfo.get("sub");
        String name = (String) userInfo.getOrDefault("name",
                userInfo.getOrDefault("preferred_username", mezonSub));
        String picture = (String) userInfo.getOrDefault("picture", null);

        // Nếu không có email, dùng sub làm email giả để tránh null
        if (email == null || email.isBlank()) {
            if (mezonSub == null) throw new AppException(ErrorCode.UNAUTHENTICATED);
            email = "mezon_" + mezonSub + "@mezon.ai";
        }

        // Tìm hoặc tạo user
        final String finalEmail = email;
        final String finalName = (String) name;
        final String finalSub = mezonSub;
        User user = userRepository.findByEmail(finalEmail).orElseGet(() -> {
            Role defaultRole = roleRepository.findByRoleName("USER")
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            Set<Role> roles = new HashSet<>();
            roles.add(defaultRole);

            String username = "mezon_" + finalSub;
            PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

            User newUser = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .email(finalEmail)
                    .name(finalName)
                    .status("ACTIVE")
                    .avatar(picture)
                    .roles(roles)
                    .build();
            return userRepository.save(newUser);
        });

        String jwt = generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwt)
                .authenticated(true)
                .build();
    }
}
