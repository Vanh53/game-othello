package com.game.game_othello.dto.request;

import lombok.Data;

@Data
public class GoogleAuthCodeRequest {
    private String code;
    private String state;
}
