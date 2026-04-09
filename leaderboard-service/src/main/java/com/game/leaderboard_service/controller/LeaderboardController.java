package com.game.leaderboard_service.controller;

import com.game.leaderboard_service.dto.response.ApiResponse;
import com.game.leaderboard_service.dto.response.LeaderboardEntryResponse;
import com.game.leaderboard_service.dto.response.LeaderboardResponse;
import com.game.leaderboard_service.service.LeaderboardService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/leaderboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LeaderboardController {

    LeaderboardService leaderboardService;

    @GetMapping
    public ApiResponse<LeaderboardResponse> getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.<LeaderboardResponse>builder()
                .result(leaderboardService.getLeaderboard(page, size))
                .build();
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<LeaderboardEntryResponse> getUserRank(@PathVariable String userId) {
        return ApiResponse.<LeaderboardEntryResponse>builder()
                .result(leaderboardService.getUserRank(userId))
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<LeaderboardEntryResponse> getMyRank() {
        return ApiResponse.<LeaderboardEntryResponse>builder()
                .result(leaderboardService.getMyRank())
                .build();
    }
}
