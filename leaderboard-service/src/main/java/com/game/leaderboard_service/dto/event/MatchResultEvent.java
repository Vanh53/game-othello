package com.game.leaderboard_service.dto.event;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResultEvent {
    private UUID matchId;
    private UUID player1Id;
    private UUID player2Id;
    private UUID winnerId;  // null nếu hòa
    private String status;  // FINISHED, DRAW, FORFEIT
    private LocalDateTime endTime;
}
