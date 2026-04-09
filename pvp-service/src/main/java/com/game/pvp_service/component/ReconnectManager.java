package com.game.pvp_service.component;

import com.game.pvp_service.service.MatchService;
import com.game.pvp_service.service.MatchmakingService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReconnectManager {

    static final long GRACE_PERIOD_SECONDS = 30;

    PresenceManager presenceManager;
    MatchService matchService;
    MatchmakingService matchmakingService;
    TaskScheduler taskScheduler;

    Map<String, ScheduledFuture<?>> pendingForfeits = new ConcurrentHashMap<>();

    @EventListener
    public void onConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (accessor.getUser() != null) {
            String username = accessor.getUser().getName();
            presenceManager.register(sessionId, username);

            // Hủy forfeit task nếu đang chờ (reconnect trong grace period)
            ScheduledFuture<?> pending = pendingForfeits.remove(username);
            if (pending != null) {
                pending.cancel(false);
                log.info("User {} reconnected within grace period, forfeit cancelled", username);
            }
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String username = presenceManager.getUserBySession(sessionId);
        if (username == null) return;

        presenceManager.unregister(sessionId);

        // Xóa khỏi matchmaking queue nếu đang chờ
        matchmakingService.leaveQueue(username);

        // Nếu đang trong trận, kích hoạt grace period
        String matchId = presenceManager.getMatchByUser(username);
        if (matchId != null) {
            log.info("User {} disconnected from matchId={}, starting grace period", username, matchId);
            ScheduledFuture<?> future = taskScheduler.schedule(
                    () -> handleForfeitAfterGrace(username, matchId),
                    Instant.now().plusSeconds(GRACE_PERIOD_SECONDS)
            );
            pendingForfeits.put(username, future);
        }
    }

    private void handleForfeitAfterGrace(String username, String matchId) {
        pendingForfeits.remove(username);
        log.info("Grace period expired for user={}, matchId={}, processing forfeit", username, matchId);
        try {
            matchService.forfeitMatch(matchId, username);
        } catch (Exception e) {
            log.warn("Forfeit failed for matchId={}: {}", matchId, e.getMessage());
        }
    }
}
