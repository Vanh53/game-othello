package com.game.pvp_service.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.game.pvp_service.entity.Room;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.game.pvp_service.component.PresenceManager;
import com.game.pvp_service.dto.event.KafkaMatchResultEvent;
import com.game.pvp_service.dto.response.MatchResponse;
import com.game.pvp_service.dto.response.MatchSummaryResponse;
import com.game.pvp_service.dto.response.PagedResponse;
import com.game.pvp_service.dto.websocket.GameStateResponse;
import com.game.pvp_service.entity.Match;
import com.game.pvp_service.exception.AppException;
import com.game.pvp_service.exception.ErrorCode;
import com.game.pvp_service.mapper.MatchMapper;
import com.game.pvp_service.repository.MatchRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MatchService {

    final MatchRepository matchRepository;
    final MatchMapper matchMapper;
    final GameLogicService gameLogicService;
    final PresenceManager presenceManager;
    final SimpMessagingTemplate messagingTemplate;
    final KafkaTemplate<String, Object> kafkaTemplate;
    final RoomService roomService;

    @Value("${kafka.topic.match-result}")
    String matchResultTopic;

    @Transactional
    public MatchResponse createMatch(String roomId) {
        Room room = roomService.getRoom(roomId).get();
        String player1Id = room.getHostUsername();
        String player2Id = room.getGuestUsername();
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
        gameLogicService.initGame(matchIdStr);
        presenceManager.joinMatch(matchIdStr, player1Id);
        presenceManager.joinMatch(matchIdStr, player2Id);
        sendInitialState(match);
        log.info("Match created: matchId={}, p1={}, p2={}", matchIdStr, player1Id, player2Id);
        return matchMapper.toMatchResponse(match);
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
        boolean isPlayer1 = username.equals(p1);
        if ((isPlayer1 && turn != 1) || (!isPlayer1 && turn != 2)) {
            throw new AppException(ErrorCode.NOT_YOUR_TURN);
        }

        int nextSeq = getNextSeq(match.getMoveLog());
        String color = (turn == 1) ? "B" : "W";

        if (!gameLogicService.isValidMove(matchId, row, col)) {
            throw new AppException(ErrorCode.INVALID_MOVE);
        }

        boolean applied = gameLogicService.applyMove(matchId, row, col);
        if (!applied) throw new AppException(ErrorCode.INVALID_MOVE);

        String entry = nextSeq + ":" + color + "(" + row + "," + col + ")";
        String moveLog = (match.getMoveLog() == null || match.getMoveLog().isEmpty())
                ? entry : match.getMoveLog() + ";" + entry;
        match.setMoveLog(moveLog);

        if (gameLogicService.isGameOver(matchId)) {
            finishMatch(match);
        } else {
            matchRepository.save(match);
            GameStateResponse state = gameLogicService.buildGameState(matchId);
            int newTurn = gameLogicService.getCurrentTurn(matchId);
            if (newTurn == turn) {
                state.setMessage("Đối thủ không có nước đi hợp lệ, bạn đi tiếp!");
            }
            sendToPlayer(p1, state);
            sendToPlayer(p2, state);
        }
    }

    @Transactional
    public void finishMatch(Match match) {
        String matchIdStr = match.getId().toString();
        int[] counts = gameLogicService.countPieces(matchIdStr);
        int black = counts[0], white = counts[1];
        UUID winnerId = null;
        String status;
        if (black > white) { winnerId = match.getPlayer1Id(); status = "FINISHED"; }
        else if (white > black) { winnerId = match.getPlayer2Id(); status = "FINISHED"; }
        else { status = "DRAW"; }

        match.setStatus(status);
        match.setWinnerId(winnerId);
        match.setEndTime(LocalDateTime.now());
        matchRepository.save(match);

        String p1 = match.getPlayer1Id().toString();
        String p2 = match.getPlayer2Id().toString();
        String winnerStr = winnerId != null ? winnerId.toString() : null;

        GameStateResponse state = gameLogicService.buildGameState(matchIdStr);
        state.setStatus(status);
        state.setWinner(winnerStr);
        sendToPlayer(p1, state);
        sendToPlayer(p2, state);

        publishMatchResult(match);
        cleanup(matchIdStr);
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
        return matchMapper.toMatchResponse(match);
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
        KafkaMatchResultEvent event = KafkaMatchResultEvent.builder()
                .matchId(match.getId()).player1Id(match.getPlayer1Id())
                .player2Id(match.getPlayer2Id()).winnerId(match.getWinnerId())
                .status(match.getStatus()).endTime(match.getEndTime())
                .build();
        kafkaTemplate.send(matchResultTopic, match.getId().toString(), event);
        log.info("Kafka event sent: matchId={}, status={}", match.getId(), match.getStatus());
    }

    private void cleanup(String matchId) {
        gameLogicService.removeGame(matchId);
        presenceManager.removeMatch(matchId);
    }

    public void sendToPlayer(String username, GameStateResponse state) {
        messagingTemplate.convertAndSendToUser(username, "/queue/game", state);
    }

    private int getNextSeq(String moveLog) {
        if (moveLog == null || moveLog.isEmpty()) return 1;
        String[] parts = moveLog.split(";");
        String last = parts[parts.length - 1];
        try {
            return Integer.parseInt(last.split(":")[0]) + 1;
        } catch (Exception e) {
            return parts.length + 1;
        }
    }

    public boolean isMoveAlreadyLogged(String moveLog, int seq) {
        if (moveLog == null || moveLog.isEmpty()) return false;
        for (String part : moveLog.split(";")) {
            try {
                if (Integer.parseInt(part.split(":")[0]) == seq) return true;
            } catch (Exception ignored) {}
        }
        return false;
    }
}
