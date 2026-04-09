package com.game.pvp_service.mapper;

import com.game.pvp_service.dto.response.RoomResponse;
import com.game.pvp_service.entity.Room;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoomMapper {
    RoomResponse toRoomResponse(Room room);
    Room toRoom (RoomResponse roomResponse);
}
