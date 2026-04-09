package com.game.pvp_service.dto.websocket;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameStateResponse {
    private String matchId;
    private int[][] board;
    private String currentTurn; // BLACK / WHITE
    private int blackCount;
    private int whiteCount;
    private String status;
    private String winner;
    private List<int[]> validMoves;
    private String message;
}
