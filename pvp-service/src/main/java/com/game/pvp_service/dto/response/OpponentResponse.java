package com.game.pvp_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OpponentResponse {
    UUID id;
    String name;
    String avatar;
    String email;
    String status;
}
