package com.game.leaderboard_service.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "user_stats", schema = "schema_leaderboard")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserStats {

    @Id
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "user_id")
    UUID userId;

    @Column(name = "name")
    String name;

    @Column(name = "avatar")
    String avatar;

    @Builder.Default
    @Column(name = "elo")
    int elo = 1200;

    @Builder.Default
    @Column(name = "total_matches")
    int totalMatches = 0;

    @Builder.Default
    @Column(name = "total_wins")
    int totalWins = 0;

    @Builder.Default
    @Column(name = "total_draws")
    int totalDraws = 0;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}
