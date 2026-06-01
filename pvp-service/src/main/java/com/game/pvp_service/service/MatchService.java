package com.game.pvp_service.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.game.pvp_service.dto.event.MatchResultEvent;
import com.game.pvp_service.repository.httpclient.LeaderboardClient;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.game.pvp_service.component.PresenceManager;
import com.game.pvp_service.dto.event.KafkaMatchResultEvent;
import com.game.pvp_service.dto.request.OpponentsRequest;
import com.game.pvp_service.dto.response.MatchResponse;
import com.game.pvp_service.dto.response.MatchSummaryResponse;
import com.game.pvp_service.dto.response.OpponentResponse;
import com.game.pvp_service.dto.response.PagedResponse;
import com.game.pvp_service.dto.response.PlayerInfo;
import com.game.pvp_service.dto.websocket.GameStateResponse;
import com.game.pvp_service.entity.Match;
import com.game.pvp_service.entity.Room;
import com.game.pvp_service.exception.AppException;
import com.game.pvp_service.exception.ErrorCode;
import com.game.pvp_service.mapper.MatchMapper;
import com.game.pvp_service.repository.MatchRepository;
import com.game.pvp_service.repository.httpclient.UserClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MatchService {

    MatchRepository matchRepository;
    MatchMapper matchMapper;
    GameLogicService gameLogicService;
    PresenceManager presenceManager;
    SimpMessagingTemplate messagingTemplate;
    KafkaTemplate<String, Object> kafkaTemplate;
    RoomService roomService;
    UserClient userClient;
    ObjectMapper objectMapper;
    LeaderboardClient leaderboardClient;

    @NonFinal
    @Value("${kafka.topic.match-result}")
    String matchResultTopic;

    @Transactional
    public MatchResponse createMatch(String roomId) {
        Room room = roomService.getRoom(roomId).orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
        String player1Id = room.getHostUsername();
        String player2Id = room.getGuestUsername();
        if (player2Id == null) {
            throw new AppException(ErrorCode.ROOM_NOT_AVAILABLE);
        }
        Match match = Match.builder()
                .matchType("PVP")
                .player1Id(UUID.fromString(player1Id))
                .player2Id(UUID.fromString(player2Id))
                .status("ONGOING")
                .startTime(LocalDateTime.now())
                .moveLog("[]")
                .build();
        match = matchRepository.save(match);
        String matchIdStr = match.getId().toString();
        log.info("Match created: matchId={}, p1={}, p2={}", matchIdStr, player1Id, player2Id);


        gameLogicService.initGame(matchIdStr);
        presenceManager.joinMatch(matchIdStr, player1Id);
        presenceManager.joinMatch(matchIdStr, player2Id);
        sendInitialState(match);
        // Notify both players that match is ready to navigate to game page
//        notifyMatchReady(player1Id, matchIdStr);
//        notifyMatchReady(player2Id, matchIdStr);

        
        // Build response with player info
        MatchResponse response = matchMapper.toMatchResponse(match);
        response.setPlayer1(buildPlayerInfo(player1Id));
        response.setPlayer2(buildPlayerInfo(player2Id));

        messagingTemplate.convertAndSendToUser(player1Id, "/queue/status", response);
        messagingTemplate.convertAndSendToUser(player2Id, "/queue/status", response);
        return response;
    }

    public void sendInitialState(Match match) {
        GameStateResponse state = gameLogicService.buildGameState(match.getId().toString());
        state.setStatus("ONGOING");
        sendToPlayer(match.getPlayer1Id().toString(), state);
        sendToPlayer(match.getPlayer2Id().toString(), state);
    }

    @Transactional
    public void applyMove(String matchId, String username, int row, int col) {
        Match match = matchRepository.findById(UUID.fromString(matchId))
                .orElseThrow(() -> new AppException(ErrorCode.GAME_NOT_FOUND));

        if (!"ONGOING".equals(match.getStatus())) throw new AppException(ErrorCode.GAME_NOT_FOUND);

        String p1 = match.getPlayer1Id().toString();
        String p2 = match.getPlayer2Id().toString();

        if (!username.equals(p1) && !username.equals(p2)) {
            throw new AppException(ErrorCode.NOT_IN_MATCH);
        }

        int turn = gameLogicService.getCurrentTurn(matchId);
        System.out.println(turn);
        boolean isPlayer1 = username.equals(p1);
        if ((isPlayer1 && turn != 1) || (!isPlayer1 && turn != 2)) {
            throw new AppException(ErrorCode.NOT_YOUR_TURN);
        }

        List<String> moveEntries = parseMoveLogEntries(match.getMoveLog());
        int nextSeq = moveEntries.size() + 1;
        String color = (turn == 1) ? "B" : "W";

        if (!gameLogicService.isValidMove(matchId, row, col)) {
            throw new AppException(ErrorCode.INVALID_MOVE);
        }

        boolean applied = gameLogicService.applyMove(matchId, row, col);
        if (!applied) throw new AppException(ErrorCode.INVALID_MOVE);

        String entry = nextSeq + ":" + color + "(" + row + "," + col + ")";
        moveEntries.add(entry);
        match.setMoveLog(writeMoveLogEntries(moveEntries));

        if (gameLogicService.isGameOver(matchId)) {
            log.info("Game over");
            finishMatch(match);
        } else {
            matchRepository.save(match);
            GameStateResponse state = gameLogicService.buildGameState(matchId);
            int newTurn = gameLogicService.getCurrentTurn(matchId);
            if (newTurn == turn) {
                state.setMessage("Đối thủ không có nước đi hợp lệ, bạn đi tiếp!");
            }
            log.info("Sending game state to p1={}, p2={}, matchId={}, currentTurn={}", p1, p2, matchId, newTurn);
            sendToPlayer(p1, state);
            sendToPlayer(p2, state);
            log.info("Game state sent successfully to both players");
        }
    }

    @Transactional
    public void finishMatch(Match match) {
        String matchIdStr = match.getId().toString();
        int[] counts = gameLogicService.countPieces(matchIdStr);
        int black = counts[0], white = counts[1];
        UUID winnerId = null;
        String status;
        if (black > white) {
            winnerId = match.getPlayer1Id(); status = "FINISHED";
        } else if (white > black) {
            winnerId = match.getPlayer2Id(); status = "FINISHED";
        } else {
            status = "DRAW";
        }
        log.info("Set match.status=FINISHED successfully");

        match.setStatus(status);
        match.setWinnerId(winnerId);
        match.setEndTime(LocalDateTime.now());
        matchRepository.save(match);

        log.info("Game saved");

        String p1 = match.getPlayer1Id().toString();
        String p2 = match.getPlayer2Id().toString();
        String winnerStr = winnerId != null ? winnerId.toString() : null;

        GameStateResponse state = gameLogicService.buildGameState(matchIdStr);
        state.setStatus(status);
        state.setWinner(winnerStr);
        sendToPlayer(p1, state);
        sendToPlayer(p2, state);
        log.info("Game sended to player");
        publishMatchResult(match);
        log.info("Publish kafka successfully");
        cleanup(matchIdStr);
        log.info("Clean up successfully");
    }

    @Transactional
    public void forfeitMatch(String matchId, String forfeitingUsername) {
        Match match = matchRepository.findById(UUID.fromString(matchId))
                .orElseThrow(() -> new AppException(ErrorCode.GAME_NOT_FOUND));
        if (!"ONGOING".equals(match.getStatus())) return;

        String p1 = match.getPlayer1Id().toString();
        String p2 = match.getPlayer2Id().toString();
        String winnerId = forfeitingUsername.equals(p1) ? p2 : p1;

        match.setStatus("FORFEIT");
        match.setWinnerId(UUID.fromString(winnerId));
        match.setEndTime(LocalDateTime.now());
        matchRepository.save(match);

        GameStateResponse state = GameStateResponse.builder()
                .matchId(matchId).status("FORFEIT").winner(winnerId)
                .message("Đối thủ đã rời trận, bạn thắng!")
                .build();
        sendToPlayer(winnerId, state);

        publishMatchResult(match);
        cleanup(matchId);
        log.info("Match forfeited: matchId={}, forfeiter={}, winner={}", matchId, forfeitingUsername, winnerId);
    }

    public MatchResponse getMatch(String matchId) {
        Match match = matchRepository.findById(UUID.fromString(matchId))
                .orElseThrow(() -> new AppException(ErrorCode.GAME_NOT_FOUND));
        MatchResponse response = matchMapper.toMatchResponse(match);
        response.setPlayer1(buildPlayerInfo(match.getPlayer1Id().toString()));
        response.setPlayer2(buildPlayerInfo(match.getPlayer2Id().toString()));
        return response;
    }

    public GameStateResponse getGameState(String matchId) {
        if (!gameLogicService.hasGame(matchId)) throw new AppException(ErrorCode.GAME_NOT_FOUND);
        return gameLogicService.buildGameState(matchId);
    }

    public PagedResponse<MatchSummaryResponse> getMyHistory(String userId, int page, int size) {
        Page<Match> matchPage = matchRepository.findByPlayerIdOrderByStartTimeDesc(
                UUID.fromString(userId), PageRequest.of(page, size));
        List<MatchSummaryResponse> content = matchPage.getContent().stream()
                .map(m -> toSummary(m, userId))
                .collect(Collectors.toList());
        return PagedResponse.<MatchSummaryResponse>builder()
                .content(content).page(page).size(size)
                .totalElements(matchPage.getTotalElements())
                .totalPages(matchPage.getTotalPages())
                .build();
    }

    public PagedResponse<MatchSummaryResponse> getHistoryById(String userId, int page, int size) {
        Page<Match> matchPage = matchRepository.findByPlayerIdOrderByStartTimeDesc(
                UUID.fromString(userId), PageRequest.of(page, size));

        List<MatchSummaryResponse> content = matchPage.getContent().stream()
                .map(m -> toSummary(m, userId))
                .collect(Collectors.toList());
        Set<UUID> opponentIds = content.stream()
                .map(m -> m.getOpponentId())
                .collect(Collectors.toSet());

        OpponentsRequest opponentsRequest = new OpponentsRequest(opponentIds);

        List<OpponentResponse> opponents = userClient.getOpponents(opponentsRequest).getResult();

        Map<UUID, String> opponentName = new HashMap<>();
        for (OpponentResponse opponent : opponents) opponentName.put(opponent.getId(), opponent.getName());

        for(MatchSummaryResponse matchSummaryResponse: content) matchSummaryResponse.setOpponentName(opponentName.get(matchSummaryResponse.getOpponentId()));

        return PagedResponse.<MatchSummaryResponse>builder()
                .content(content).page(page).size(size)
                .totalElements(matchPage.getTotalElements())
                .totalPages(matchPage.getTotalPages())
                .build();
    }

    private MatchSummaryResponse toSummary(Match match, String userId) {
        String p1 = match.getPlayer1Id().toString();
        boolean isPlayer1 = userId.equals(p1);
        UUID opponentId = isPlayer1 ? match.getPlayer2Id() : match.getPlayer1Id();
        String result;
        if ("DRAW".equals(match.getStatus())) result = "DRAW";
        else if (match.getWinnerId() != null && userId.equals(match.getWinnerId().toString())) result = "WIN";
        else result = "LOSE";

        return MatchSummaryResponse.builder()
                .id(match.getId()).matchType(match.getMatchType())
                .opponentId(opponentId).result(result)
                .startTime(match.getStartTime()).endTime(match.getEndTime())
                .build();
    }

    private void publishMatchResult(Match match) {
//        KafkaMatchResultEvent event = KafkaMatchResultEvent.builder()
//                .matchId(match.getId())
//                .player1Id(match.getPlayer1Id())
//                .player2Id(match.getPlayer2Id())
//                .winnerId(match.getWinnerId())
//                .status(match.getStatus())
//                .endTime(match.getEndTime())
//                .build();
//        kafkaTemplate.send(matchResultTopic, match.getId().toString(), event);

        MatchResultEvent event = MatchResultEvent.builder()
                .matchId(match.getId())
                .player1Id(match.getPlayer1Id())
                .player2Id(match.getPlayer2Id())
                .winnerId(match.getWinnerId())
                .status(match.getStatus())
                .endTime(match.getEndTime())
                .build();
        leaderboardClient.updateMatchResult(event);
        log.info("Kafka event sent: matchId={}, status={}", match.getId(), match.getStatus());
    }

    private void cleanup(String matchId) {
        gameLogicService.removeGame(matchId);
        presenceManager.removeMatch(matchId);
    }

    public void sendToPlayer(String username, GameStateResponse state) {
        messagingTemplate.convertAndSendToUser(username, "/queue/game", state);
    }

    private void notifyMatchReady(String username, String matchId) {
        Map<String, String> notification = Map.of("id", matchId, "status", "MATCHED");
        messagingTemplate.convertAndSendToUser(username, "/queue/status", notification);
    }

    private PlayerInfo buildPlayerInfo(String username) {
        // Fallback PlayerInfo if fetch fails
        PlayerInfo fallback = PlayerInfo.builder()
                .username(username)
                .name(username)
                .avatar(null)
                .elo(1000.0)
                .build();
        
        try {
            // Try to fetch user info from identity-service
            var opponents = userClient.getOpponents(new OpponentsRequest(Set.of(UUID.fromString(username)))).getResult();
            if (!opponents.isEmpty()) {
                OpponentResponse opponent = opponents.get(0);
                return PlayerInfo.builder()
                        .username(username)
                        .name(opponent.getName() != null ? opponent.getName() : username)
                        .avatar(opponent.getAvatar())
                        .elo(1000.0) // TODO: Fetch elo from leaderboard-service
                        .build();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch player info for {}: {}", username, e.getMessage());
        }
        return fallback;
    }

    public boolean isMoveAlreadyLogged(String moveLog, int seq) {
        for (String part : parseMoveLogEntries(moveLog)) {
            try {
                if (Integer.parseInt(part.split(":")[0]) == seq) return true;
            } catch (Exception ignored) {}
        }
        return false;
    }

    private List<String> parseMoveLogEntries(String moveLog) {
        if (moveLog == null || moveLog.isBlank()) {
            return new ArrayList<>();
        }

        String trimmed = moveLog.trim();
        if (trimmed.startsWith("[")) {
            try {
                return new ArrayList<>(objectMapper.readValue(trimmed, new TypeReference<List<String>>() {}));
            } catch (Exception e) {
                log.warn("Failed to parse move_log JSON, fallback to legacy format: {}", e.getMessage());
            }
        }

        List<String> legacyEntries = new ArrayList<>();
        for (String part : trimmed.split(";")) {
            String p = part == null ? "" : part.trim();
            if (!p.isEmpty()) {
                legacyEntries.add(p);
            }
        }
        return legacyEntries;
    }

    private String writeMoveLogEntries(List<String> moveEntries) {
        try {
            return objectMapper.writeValueAsString(moveEntries);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize move_log as JSON", e);
        }
    }
}
