package com.game.leaderboard_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LeaderboardResponse {

    List<LeaderboardEntryResponse> entries;
    int page;
    int size;
    long totalElements;
    int totalPages;
}
