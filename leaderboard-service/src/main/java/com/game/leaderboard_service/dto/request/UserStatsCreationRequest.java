package com.game.leaderboard_service.dto.request;

import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserStatsCreationRequest {
    UUID userId;
    String name;
    String avatar;
}
