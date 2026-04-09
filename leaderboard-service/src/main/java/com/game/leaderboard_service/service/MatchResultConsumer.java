package com.game.leaderboard_service.service;

import java.util.UUID;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.game.leaderboard_service.dto.event.MatchResultEvent;
import com.game.leaderboard_service.entity.UserStats;
import com.game.leaderboard_service.repository.UserStatsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchResultConsumer {

    private final UserStatsRepository userStatsRepository;

    @KafkaListener(topics = "${kafka.topic.match-result}", groupId = "leaderboard-group")
    @Transactional
    public void consume(MatchResultEvent event) {
        log.info("Received match result: matchId={}, status={}", event.getMatchId(), event.getStatus());

        UserStats p1 = getOrCreate(event.getPlayer1Id());
        UserStats p2 = getOrCreate(event.getPlayer2Id());

        p1.setTotalMatches(p1.getTotalMatches() + 1);
        p2.setTotalMatches(p2.getTotalMatches() + 1);

        if ("DRAW".equals(event.getStatus())) {
            p1.setTotalDraws(p1.getTotalDraws() + 1);
            p2.setTotalDraws(p2.getTotalDraws() + 1);
            // Elo không đổi khi hòa
        } else {
            UUID winnerId = event.getWinnerId();
            UUID loserId = winnerId.equals(event.getPlayer1Id())
                    ? event.getPlayer2Id() : event.getPlayer1Id();

            UserStats winner = winnerId.equals(p1.getUserId()) ? p1 : p2;
            UserStats loser = loserId.equals(p1.getUserId()) ? p1 : p2;

            winner.setTotalWins(winner.getTotalWins() + 1);

            // Tính Elo theo công thức ELO chuẩn (K=32)
            int[] newElos = calculateElo(winner.getElo(), loser.getElo());
            winner.setElo(newElos[0]);
            loser.setElo(newElos[1]);
        }

        userStatsRepository.save(p1);
        userStatsRepository.save(p2);
        log.info("Updated stats for players {} and {}", event.getPlayer1Id(), event.getPlayer2Id());
    }

    private UserStats getOrCreate(UUID userId) {
        return userStatsRepository.findById(userId).orElseGet(() ->
                userStatsRepository.save(UserStats.builder().userId(userId).build())
        );
    }

    // Trả về [newWinnerElo, newLoserElo]
    private int[] calculateElo(int winnerElo, int loserElo) {
        int K = 32;
        double expectedWinner = 1.0 / (1 + Math.pow(10, (loserElo - winnerElo) / 400.0));
        int winnerNew = (int) Math.round(winnerElo + K * (1 - expectedWinner));
        int loserNew  = (int) Math.round(loserElo  + K * (0 - (1 - expectedWinner)));
        return new int[]{winnerNew, loserNew};
    }
}
