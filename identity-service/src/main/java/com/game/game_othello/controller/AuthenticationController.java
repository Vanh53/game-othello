package com.game.game_othello.controller;

import com.game.game_othello.dto.request.ApiResponse;
import com.game.game_othello.dto.request.AuthenticationRequest;
import com.game.game_othello.dto.request.GoogleAuthCodeRequest;
import com.game.game_othello.dto.request.IntrospectRequest;
import com.game.game_othello.dto.response.AuthenticationResponse;
import com.game.game_othello.dto.response.IntrospectResponse;
import com.game.game_othello.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;

    @PostMapping("/log-in")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        var result = authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/google")
    ApiResponse<AuthenticationResponse> loginWithGoogle(@RequestBody GoogleAuthCodeRequest request) {
        var result = authenticationService.loginWithGoogle(request.getCode());
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/mezon")
    ApiResponse<AuthenticationResponse> loginWithMezon(@RequestBody GoogleAuthCodeRequest request) {
        var result = authenticationService.loginWithMezon(request.getCode(), request.getState());
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }
}
