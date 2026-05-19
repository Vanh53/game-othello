package com.game.pvp_service.service;

import java.util.Set;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.game.pvp_service.dto.response.MatchResponse;
import com.game.pvp_service.dto.response.RoomResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MatchmakingService {

    static final String QUEUE_KEY = "matchmaking:queue";

    RedisTemplate<String, Object> redisTemplate;
    SimpMessagingTemplate messagingTemplate;
    MatchService matchService;
    RoomService roomService;

    public void joinQueue(String username, double elo) {
        redisTemplate.opsForZSet().add(QUEUE_KEY, username, elo);
        log.info("User {} joined matchmaking queue with elo={}", username, elo);

        messagingTemplate.convertAndSendToUser(username, "/queue/status",
                java.util.Map.of("status", "WAITING", "message", "Đang tìm đối thủ..."));

        tryMatch(username, elo);
    }

    public void leaveQueue(String username) {
        Long removed = redisTemplate.opsForZSet().remove(QUEUE_KEY, username);
        if (removed != null && removed > 0) {
            messagingTemplate.convertAndSendToUser(username, "/queue/status",
                    java.util.Map.of("status", "LEFT", "message", "Đã rời hàng chờ"));
            log.info("User {} left matchmaking queue", username);
        }
    }

    public boolean isInQueue(String username) {
        return redisTemplate.opsForZSet().score(QUEUE_KEY, username) != null;
    }

    private void tryMatch(String username, double elo) {
        Long cntAround = redisTemplate.opsForZSet().count(QUEUE_KEY, elo - 200, elo + 200);
        if (cntAround < 2) return;

        Set<Object> around = redisTemplate.opsForZSet().rangeByScore(QUEUE_KEY, elo - 200, elo + 200);
        if (around == null || around.isEmpty()) return;

        String player1 = username;
        String player2 = "";
        for (Object player: around) {
            if (!player.toString().equals(player1)) {
                player2 = player.toString();
                break;
            }
        }
        redisTemplate.opsForZSet().remove(QUEUE_KEY, player1, player2);
        log.info("Matching");
        RoomResponse room = roomService.createRoom(player1);
        roomService.joinRoom(room.getRoomId(), player2);
        MatchResponse matchResponse = matchService.createMatch(room.getRoomId());
        log.info("Matched: {} vs {} -> matchId={}", player1, player2, matchResponse.getId());
    }
}
