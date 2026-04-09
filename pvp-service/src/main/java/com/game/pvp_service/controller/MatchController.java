package com.game.pvp_service.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.game.pvp_service.dto.response.ApiResponse;
import com.game.pvp_service.dto.response.MatchResponse;
import com.game.pvp_service.dto.response.MatchSummaryResponse;
import com.game.pvp_service.dto.response.PagedResponse;
import com.game.pvp_service.dto.websocket.GameStateResponse;
import com.game.pvp_service.service.MatchService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/matches")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MatchController {

    MatchService matchService;

    @PostMapping("/{roomId}")
    public ApiResponse<MatchResponse> createMatch(@PathVariable String roomId) {
        return ApiResponse.<MatchResponse>builder()
                .result(matchService.createMatch(roomId))
                .build();
    }


    @GetMapping("/{matchId}")
    public ApiResponse<MatchResponse> getMatch(@PathVariable String matchId) {
        return ApiResponse.success(matchService.getMatch(matchId));
    }

    @GetMapping("/{matchId}/state")
    public ApiResponse<GameStateResponse> getGameState(@PathVariable String matchId) {
        return ApiResponse.success(matchService.getGameState(matchId));
    }

    @GetMapping("/my-history")
    public ApiResponse<PagedResponse<MatchSummaryResponse>> getMyHistory(
            @AuthenticationPrincipal String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(matchService.getMyHistory(username, page, size));
    }
}
