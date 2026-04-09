package com.game.pvp_service.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "matches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Match {

    @Id
    @Column(name = "id")
    @JdbcTypeCode(SqlTypes.UUID)
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "match_type", nullable = false, length = 10)
    String matchType;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "player1_id", nullable = false)
    UUID player1Id;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "player2_id")
    UUID player2Id;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "bot_id")
    UUID botId;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "winner_id")
    UUID winnerId;

    @Column(name = "status", nullable = false, length = 20)
    String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "move_log", columnDefinition = "jsonb")
    String moveLog;

    @Column(name = "start_time", nullable = false)
    LocalDateTime startTime;

    @Column(name = "end_time")
    LocalDateTime endTime;
}
