package com.game.pvp_service.dto.response;

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
public class MatchSummaryResponse {
    private UUID id;
    private String matchType;
    private UUID opponentId;
    private String result;
    private int myScore;
    private int opponentScore;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
