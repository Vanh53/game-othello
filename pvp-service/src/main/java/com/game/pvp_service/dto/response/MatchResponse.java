package com.game.pvp_service.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MatchResponse {
    UUID id;
    String matchType;
    UUID player1Id;
    UUID player2Id;
    UUID botId;
    UUID winnerId;
    String status;
    LocalDateTime startTime;
    LocalDateTime endTime;
    String moveLog;
    PlayerInfo player1;
    PlayerInfo player2;
}
