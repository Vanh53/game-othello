package com.game.pvp_service.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.game.pvp_service.component.PresenceManager;
import com.game.pvp_service.dto.response.ApiResponse;
import com.game.pvp_service.dto.websocket.ErrorResponse;
import com.game.pvp_service.dto.websocket.GameStateRequest;
import com.game.pvp_service.dto.websocket.GameStateResponse;
import com.game.pvp_service.dto.websocket.MoveRequest;
import com.game.pvp_service.exception.AppException;
import com.game.pvp_service.exception.ErrorCode;
import com.game.pvp_service.service.MatchService;
import com.game.pvp_service.service.MatchmakingService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GameWebSocketController {

    MatchService matchService;
    MatchmakingService matchmakingService;
    PresenceManager presenceManager;
    SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/game.join")
    public ApiResponse<Void> joinMatchmaking(Principal principal) {
        String username = principal.getName();
        matchmakingService.joinQueue(username, 1000.0);
        return ApiResponse.<Void>builder().build();
    }

    @MessageMapping("/game.move")
    public void makeMove(MoveRequest request, Principal principal) {
        String username = principal.getName();
        try {
            log.info("📥 User {} yêu cầu đi cờ tại tọa độ: row={}, col={}, matchId={}", username, request.getRow(), request.getCol(), request.getMatchId());

            matchService.applyMove(request.getMatchId(), username, request.getRow(), request.getCol());

            log.info("✅ Nước đi của {} hợp lệ và đã lưu thành công!", username);
        } catch (AppException e) {
            log.warn("❌ Nước đi của {} bị TỪ CHỐI. Lý do: {} (code={})", username, e.getErrorCode(), e.getErrorCode().getCode());
            sendError(username, e.getErrorCode());
        } catch (Exception e) {
            log.error("❌ Unexpected error in game.move for user={}: {}", username, e.getMessage(), e);
            sendError(username, ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @MessageMapping("/game.leave")
    public void leaveGame(GameStateRequest request, Principal principal) {
        String username = principal.getName();
        try {
            // Nếu đang trong hàng chờ
            if (matchmakingService.isInQueue(username)) {
                matchmakingService.leaveQueue(username);
                return;
            }
            // Nếu đang trong trận
            String matchId = request != null ? request.getMatchId() : presenceManager.getMatchByUser(username);
            if (matchId != null) {
                matchService.forfeitMatch(matchId, username);
            }
        } catch (AppException e) {
            sendError(username, e.getErrorCode());
        }
    }

    @MessageMapping("/game.state")
    public void getGameState(GameStateRequest request, Principal principal) {
        String username = principal.getName();
        try {
            GameStateResponse state = matchService.getGameState(request.getMatchId());
            messagingTemplate.convertAndSendToUser(username, "/queue/game", state);
        } catch (AppException e) {
            sendError(username, e.getErrorCode());
        }
    }

    private void sendError(String username, ErrorCode errorCode) {
        messagingTemplate.convertAndSendToUser(username, "/queue/error",
                ErrorResponse.builder().code(errorCode.getCode()).message(errorCode.getMessage()).build());
    }
}
