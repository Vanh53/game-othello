package com.game.pvp_service.dto.event;

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
public class KafkaMatchResultEvent {
    private UUID matchId;
    private UUID player1Id;
    private UUID player2Id;
    private UUID winnerId;
    private String status;
    private LocalDateTime endTime;
}
