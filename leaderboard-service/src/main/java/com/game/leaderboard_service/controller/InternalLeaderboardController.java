package com.game.leaderboard_service.controller;

import com.game.leaderboard_service.dto.request.UserStatsCreationRequest;
import com.game.leaderboard_service.dto.response.ApiResponse;
import com.game.leaderboard_service.service.LeaderboardService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalLeaderboardController {
    LeaderboardService leaderboardService;

    @PostMapping("/createUser")
    public ApiResponse<String> createUserStats(@RequestBody UserStatsCreationRequest request) {
        leaderboardService.createUser(request);
        return ApiResponse.<String>builder()
                .result("Create user stats successfully")
                .build();
    }
}
