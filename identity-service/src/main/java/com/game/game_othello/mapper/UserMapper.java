package com.game.game_othello.mapper;

import com.game.game_othello.dto.request.UserCreationRequest;
import com.game.game_othello.dto.request.UserUpdateRequest;
import com.game.game_othello.dto.response.OpponentResponse;
import com.game.game_othello.dto.response.UserResponse;
import com.game.game_othello.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    // Map cac truong khac ten hoac ignore khong map
//    @Mapping(source = "", target = "")
//    @Mapping(target = "", ignore = true)
    UserResponse toUserResponse (User user);
    List<UserResponse> toListUserResponse (List<User> users);
    List<OpponentResponse> toListOpponent (List<User> users);
    void updateUser(@MappingTarget User user, UserUpdateRequest request);


}
