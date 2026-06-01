package com.game.leaderboard_service.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import com.game.leaderboard_service.dto.request.UserStatsCreationRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.game.leaderboard_service.dto.response.LeaderboardEntryResponse;
import com.game.leaderboard_service.dto.response.LeaderboardResponse;
import com.game.leaderboard_service.entity.UserStats;
import com.game.leaderboard_service.exception.AppException;
import com.game.leaderboard_service.exception.ErrorCode;
import com.game.leaderboard_service.mapper.LeaderboardMapper;
import com.game.leaderboard_service.repository.UserStatsRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LeaderboardService {

    UserStatsRepository userStatsRepository;
    LeaderboardMapper leaderboardMapper;

    public LeaderboardResponse getLeaderboard(int page, int size) {
        if (page < 0 || size <= 0 || size > 100) {
            throw new AppException(ErrorCode.INVALID_PAGE_SIZE);
        }

        Page<UserStats> userPage = userStatsRepository.findAllByIsDeletedFalseOrderByEloDescTotalMatchesDesc(PageRequest.of(page, size));

        List<UserStats> listUserStats = userPage.getContent();

        List<LeaderboardEntryResponse> entries = new ArrayList<>();

        int index = 0;
        for(UserStats userStats: listUserStats) {
            LeaderboardEntryResponse entry  = leaderboardMapper.toLeaderboardEntry(userStats);
            entry.setUserId(userStats.getUserId().toString());
            entry.setWinRate(calcWinRate(userStats.getTotalWins(), userStats.getTotalMatches()));
            entry.setRank(page * size + index + 1);
            entries.add(entry);
            index++;
        }

        return LeaderboardResponse.builder()
                .entries(entries)
                .page(page)
                .size(size)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .build();
    }

    public LeaderboardEntryResponse getUserRank(String userId) {
        UserStats stats = userStatsRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        return getRank(stats);
    }

    public LeaderboardEntryResponse getMyRank() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        UserStats stats = userStatsRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        return getRank(stats);
    }

    public void createUser(UserStatsCreationRequest request) {
        UserStats newUserStats = UserStats.builder()
                .userId(request.getUserId())
                .name(request.getName())
                .avatar(request.getAvatar())
                .build();
        userStatsRepository.save(newUserStats);
    }

    private LeaderboardEntryResponse getRank(UserStats stats) {
        long higherCount = userStatsRepository.countUsersWithHigherElo(stats.getElo(), stats.getTotalMatches());
        LeaderboardEntryResponse entry = leaderboardMapper.toLeaderboardEntry(stats);
        entry.setRank((int) higherCount + 1);
        entry.setWinRate(calcWinRate(stats.getTotalWins(), stats.getTotalMatches()));
        return entry;
    }

    private double calcWinRate(int wins, int matches) {
        if (matches == 0) return 0.0;
        return Math.round((wins * 100.0 / matches) * 100.0) / 100.0;
    }

    public void deleteUser(String userId) {
        UserStats stats = userStatsRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        stats.setDeleted(true);
        userStatsRepository.save(stats);
    }

    public void restoreUser(String userId) {
        UserStats stats = userStatsRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        stats.setDeleted(false);
        userStatsRepository.save(stats);
    }


    // bổ sung api gọi từ phía identity-service: update thông tin, update avatar, xóa user
    // update xóa mềm

}
