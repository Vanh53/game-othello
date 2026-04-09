package com.game.leaderboard_service.dto.response;

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
public class LeaderboardEntryResponse {

    int rank;
    String userId;
    String name;
    String avatar;
    int elo;
    int totalMatches;
    int totalWins;
    int totalDraws;
    double winRate;
}
