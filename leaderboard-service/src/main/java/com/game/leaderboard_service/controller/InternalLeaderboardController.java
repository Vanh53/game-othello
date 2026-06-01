package com.game.leaderboard_service.controller;

import com.game.leaderboard_service.dto.event.MatchResultEvent;
import com.game.leaderboard_service.dto.request.UserStatsCreationRequest;
import com.game.leaderboard_service.dto.response.ApiResponse;
import com.game.leaderboard_service.service.LeaderboardService;
import com.game.leaderboard_service.service.MatchResultConsumer;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalLeaderboardController {
    LeaderboardService leaderboardService;
    MatchResultConsumer matchResultConsumer;

    @PostMapping("/createUser")
    public ApiResponse<String> createUserStats(@RequestBody UserStatsCreationRequest request) {
        leaderboardService.createUser(request);
        return ApiResponse.<String>builder()
                .result("Create user stats successfully")
                .build();
    }

    @PutMapping("/updateMatchResult")
    public ApiResponse<String> updateMatchResult(@RequestBody MatchResultEvent request) {
        matchResultConsumer.consume(request);
        return ApiResponse.<String>builder()
                .result("Update user stats successfully")
                .build();
    }

    // bổ sung api gọi từ phía identity-service: update thông tin, update avatar, xóa user

//    @PutMapping("/{userId}")
//    @PreAuthorize("hasAuthority('USER_UPDATE_ANY') or #userId == authentication.name")
//    ApiResponse<UserResponse> updateUser(@PathVariable String userId, @RequestBody @Valid UserUpdateRequest userUpdateRequest) {
//        return ApiResponse.<UserResponse>builder()
//                .result(userService.updateUser(userId, userUpdateRequest))
//                .build();
//    }
//
    @PutMapping("/{userId}/delete")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        leaderboardService.deleteUser(userId);
        return ApiResponse.<String>builder()
                .result("Xóa UserStats thành công")
                .build();
    }

    @PutMapping("/{userId}/restore")
    ApiResponse<String> restoreUser(@PathVariable String userId) {
        leaderboardService.restoreUser(userId);
        return ApiResponse.<String>builder()
                .result("Khôi phục UserStats thành công")
                .build();
    }

//    @PutMapping("/{userId}")
//    @PreAuthorize("isAuthenticated()")
//    ApiResponse<UserResponse> updateAvatar() {
//        return ApiResponse.<UserResponse>builder()
//                .result(userService.updateAvatar())
//                .build();
//    }
}
