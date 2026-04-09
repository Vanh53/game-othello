package com.game.pvp_service.mapper;

import com.game.pvp_service.dto.response.MatchResponse;
import com.game.pvp_service.entity.Match;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MatchMapper {
    MatchResponse toMatchResponse(Match match);
}
