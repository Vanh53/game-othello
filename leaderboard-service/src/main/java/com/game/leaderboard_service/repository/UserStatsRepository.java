package com.game.leaderboard_service.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.game.leaderboard_service.entity.UserStats;

@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, UUID> {

    Page<UserStats> findAllByOrderByEloDescTotalMatchesDesc(Pageable pageable);

    @Query("SELECT COUNT(u) FROM UserStats u WHERE u.elo > :elo OR (u.elo = :elo AND u.totalMatches > :totalMatches)")
    long countUsersWithHigherElo(@Param("elo") int elo, @Param("totalMatches") int totalMatches);
}
