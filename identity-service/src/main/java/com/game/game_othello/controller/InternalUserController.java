package com.game.game_othello.controller;

import com.game.game_othello.dto.request.ApiResponse;
import com.game.game_othello.dto.request.OpponentsRequest;
import com.game.game_othello.dto.response.OpponentResponse;
import com.game.game_othello.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalUserController {
    UserService userService;

    @PostMapping("/opponents")
    ApiResponse<List<OpponentResponse>> getOpponents(@RequestBody OpponentsRequest opponentsRequest) {
        return ApiResponse.<List<OpponentResponse>>builder()
                .result(userService.getOpponents(opponentsRequest))
                .build();
    }
}
