package com.game.game_othello.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.Set;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    UUID id;
    String name;
    String avatar;
    String email;
    String status;
}
