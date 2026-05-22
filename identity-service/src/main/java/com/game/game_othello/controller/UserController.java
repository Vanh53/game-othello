package com.game.game_othello.controller;

import com.game.game_othello.dto.request.ApiResponse;
import com.game.game_othello.dto.request.OpponentsRequest;
import com.game.game_othello.dto.request.UserCreationRequest;
import com.game.game_othello.dto.request.UserUpdateRequest;
import com.game.game_othello.dto.response.OpponentResponse;
import com.game.game_othello.dto.response.UserResponse;
import com.game.game_othello.entity.User;
import com.game.game_othello.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest userCreationRequest) {
        ApiResponse<UserResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(userService.createUser(userCreationRequest));
        return apiResponse;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_VIEW_ALL')")
    ApiResponse<List<UserResponse>> getUsers() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Username: {}", authentication.getName());
        authentication.getAuthorities().forEach(grantedAuthority -> log.info(grantedAuthority.getAuthority()));
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsers())
                .build();
    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @PostMapping("/opponents")
    ApiResponse<List<OpponentResponse>> getOpponents(@RequestBody OpponentsRequest opponentsRequest) {
        return ApiResponse.<List<OpponentResponse>>builder()
                .result(userService.getOpponents(opponentsRequest))
                .build();
    }

    @GetMapping("/myInfo")
    @PreAuthorize("isAuthenticated()")
    ApiResponse<UserResponse> getInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_UPDATE_ANY') or #userId == authentication.name")
    ApiResponse<UserResponse> updateUser(@PathVariable String userId, @RequestBody @Valid UserUpdateRequest userUpdateRequest) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, userUpdateRequest))
                .build();
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder()
                .result("Xóa User thành công")
                .build();
    }
}
