package com.game.leaderboard_service.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.leaderboard_service.dto.response.ApiResponse;
import com.game.leaderboard_service.dto.response.LeaderboardEntryResponse;
import com.game.leaderboard_service.dto.response.LeaderboardResponse;
import com.game.leaderboard_service.service.LeaderboardService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/leaderboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LeaderboardController {

    LeaderboardService leaderboardService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LeaderboardResponse> getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<LeaderboardResponse>builder()
                .result(leaderboardService.getLeaderboard(page, size))
                .build();
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LeaderboardEntryResponse> getUserRank(@PathVariable String userId) {
        return ApiResponse.<LeaderboardEntryResponse>builder()
                .result(leaderboardService.getUserRank(userId))
                .build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LeaderboardEntryResponse> getMyRank() {
        return ApiResponse.<LeaderboardEntryResponse>builder()
                .result(leaderboardService.getMyRank())
                .build();
    }
}
