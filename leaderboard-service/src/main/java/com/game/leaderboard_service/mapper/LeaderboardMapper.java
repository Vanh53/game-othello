package com.game.leaderboard_service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.game.leaderboard_service.dto.response.LeaderboardEntryResponse;
import com.game.leaderboard_service.entity.UserStats;

@Mapper(componentModel = "spring")
public interface LeaderboardMapper {

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "rank", ignore = true)
    @Mapping(target = "winRate", ignore = true)
    LeaderboardEntryResponse toLeaderboardEntry(UserStats userStats);
}
