package com.game.pvp_service.repository.httpclient;


import com.game.pvp_service.dto.event.MatchResultEvent;
import com.game.pvp_service.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "leaderboard-service", url = "${services.leaderboard-service.url}")
public interface LeaderboardClient {

    @PutMapping(value = "/updateMatchResult", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<String> updateMatchResult(@RequestBody MatchResultEvent request);
}
