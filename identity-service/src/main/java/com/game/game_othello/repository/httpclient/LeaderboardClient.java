package com.game.game_othello.repository.httpclient;

import com.game.game_othello.dto.request.ApiResponse;
import com.game.game_othello.dto.request.UserStatsCreationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@FeignClient(name = "leaderboard-service", url = "${services.leaderboard-service.url}")
public interface LeaderboardClient {

    @PostMapping(value = "/internal/createUser", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<String> createUserStats(@RequestBody UserStatsCreationRequest request);
}
