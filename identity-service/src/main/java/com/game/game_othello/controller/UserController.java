package com.game.game_othello.controller;

import com.game.game_othello.dto.request.*;
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

import java.security.Principal;
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
    @PreAuthorize("hasAuthority('USER_VIEW')")
    ApiResponse<UserResponse> getUser(@PathVariable String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
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

    // update xóa mềm

    @PutMapping("/{userId}/delete")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder()
                .result("Xóa User thành công")
                .build();
    }

    @PutMapping("/{userId}/restore")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    ApiResponse<String> restoreUser(@PathVariable String userId) {
        userService.restoreUser(userId);
        return ApiResponse.<String>builder()
                .result("Khôi phục User thành công")
                .build();
    }

//    @PutMapping("/{userId}")
//    @PreAuthorize("isAuthenticated()")
//    ApiResponse<UserResponse> updateAvatar() {
//        return ApiResponse.<UserResponse>builder()
//                .result(userService.updateAvatar())
//                .build();
//    }

    @PutMapping("/{userId}/changePassword")
    @PreAuthorize("isAuthenticated()")
    ApiResponse<String> changePassword(@RequestBody ChangePasswordRequest request, Principal principal) {
        String userId = principal.getName();
        userService.changePassword(request);
        return ApiResponse.<String>builder()
                .result("Change password successfully")
                .build();
    }



//    @PutMapping("/{userId}")
//    @PreAuthorize("hasAuthority('USER_MANAGE_PERMISSION') or hasAuthority('ALL_PERMISSION')")
//    ApiResponse<String> updatePermission() {
//        return ApiResponse.<UserResponse>builder()
//                .result(userService.updatePermission())
//                .build();
//    }

}
