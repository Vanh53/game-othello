package com.game.game_othello.repository.httpclient;

import com.game.game_othello.dto.request.ApiResponse;
import com.game.game_othello.dto.request.UserStatsCreationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;


@FeignClient(name = "leaderboard-service", url = "${services.leaderboard-service.url}")
public interface LeaderboardClient {

    @PostMapping(value = "/internal/createUser", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<String> createUserStats(@RequestBody UserStatsCreationRequest request);

    @PutMapping(value = "/internal/{userId}/delete", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<String> deleteUserStats(@PathVariable String userId);

    @PutMapping(value = "/internal/{userId}/restore", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<String> restoreUserStats(@PathVariable String userId);
}
