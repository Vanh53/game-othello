package com.game.pvp_service.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.game.pvp_service.entity.Match;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID> {

    @Query("SELECT m FROM Match m WHERE (m.player1Id = :userId OR m.player2Id = :userId) AND m.status = 'ONGOING'")
    Optional<Match> findOngoingMatchByPlayerId(@Param("userId") UUID userId);

    @Query("SELECT m FROM Match m " +
            "WHERE ((m.player1Id = :userId OR m.player2Id = :userId) AND m.status != 'ONGOING') " +
            "ORDER BY m.startTime DESC")
    Page<Match> findByPlayerIdOrderByStartTimeDesc(@Param("userId") UUID userId, Pageable pageable);
}
