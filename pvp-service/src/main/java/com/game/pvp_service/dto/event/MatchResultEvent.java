package com.game.pvp_service.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResultEvent {
    private UUID matchId;
    private UUID player1Id;
    private UUID player2Id;
    private UUID winnerId;
    private String status;
    private LocalDateTime endTime;
}
