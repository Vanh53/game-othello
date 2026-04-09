package com.game.pvp_service.entity;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Room được lưu trong Redis (không phải JPA entity).
 * Key: room:{roomId}, TTL: 30 phút
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Room {
    String roomId;
    String hostUsername;
    String guestUsername;
    String status; // WAITING / FULL / CLOSED
    LocalDateTime createdAt;
}
