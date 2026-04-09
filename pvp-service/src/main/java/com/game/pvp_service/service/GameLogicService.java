package com.game.pvp_service.service;

import com.game.pvp_service.dto.websocket.GameStateResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý trạng thái bàn cờ Othello trong bộ nhớ.
 * Board: 0=trống, 1=BLACK, 2=WHITE
 */
@Slf4j
@Service
public class GameLogicService {

    private static final int EMPTY = 0;
    private static final int BLACK = 1;
    private static final int WHITE = 2;
    private static final int SIZE = 8;
    private static final int[][] DIRECTIONS = {
        {-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}
    };

    // matchId -> board state
    private final Map<String, int[][]> boards = new ConcurrentHashMap<>();
    // matchId -> current turn (BLACK=1 or WHITE=2)
    private final Map<String, Integer> turns = new ConcurrentHashMap<>();

    public void initGame(String matchId) {
        int[][] board = new int[SIZE][SIZE];
        board[3][3] = WHITE;
        board[3][4] = BLACK;
        board[4][3] = BLACK;
        board[4][4] = WHITE;
        boards.put(matchId, board);
        turns.put(matchId, BLACK); // BLACK đi trước
        log.info("Game initialized for matchId={}", matchId);
    }

    public boolean hasGame(String matchId) {
        return boards.containsKey(matchId);
    }

    public int getCurrentTurn(String matchId) {
        return turns.getOrDefault(matchId, BLACK);
    }

    /**
     * Thực hiện nước đi. Trả về true nếu hợp lệ.
     */
    public boolean applyMove(String matchId, int row, int col) {
        int[][] board = boards.get(matchId);
        int turn = turns.get(matchId);
        if (!isValidMove(board, row, col, turn)) return false;

        List<int[]> flipped = getFlippedPieces(board, row, col, turn);
        board[row][col] = turn;
        for (int[] pos : flipped) board[pos[0]][pos[1]] = turn;

        // Chuyển lượt
        int next = (turn == BLACK) ? WHITE : BLACK;
        if (!getValidMoves(board, next).isEmpty()) {
            turns.put(matchId, next);
        } else if (!getValidMoves(board, turn).isEmpty()) {
            // Đối thủ không có nước đi, giữ lượt
            log.info("matchId={} opponent has no valid moves, keeping turn for {}", matchId, turn);
        } else {
            // Cả hai không có nước đi -> kết thúc
            turns.put(matchId, 0);
        }
        return true;
    }

    public boolean isValidMove(String matchId, int row, int col) {
        int[][] board = boards.get(matchId);
        int turn = turns.get(matchId);
        return isValidMove(board, row, col, turn);
    }

    public boolean isValidMove(int[][] board, int row, int col, int color) {
        if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return false;
        if (board[row][col] != EMPTY) return false;
        return !getFlippedPieces(board, row, col, color).isEmpty();
    }

    public List<int[]> getValidMoves(String matchId) {
        int[][] board = boards.get(matchId);
        int turn = turns.get(matchId);
        return getValidMoves(board, turn);
    }

    public List<int[]> getValidMoves(int[][] board, int color) {
        List<int[]> moves = new ArrayList<>();
        for (int r = 0; r < SIZE; r++)
            for (int c = 0; c < SIZE; c++)
                if (isValidMove(board, r, c, color)) moves.add(new int[]{r, c});
        return moves;
    }

    private List<int[]> getFlippedPieces(int[][] board, int row, int col, int color) {
        List<int[]> flipped = new ArrayList<>();
        int opponent = (color == BLACK) ? WHITE : BLACK;
        for (int[] dir : DIRECTIONS) {
            List<int[]> line = new ArrayList<>();
            int r = row + dir[0], c = col + dir[1];
            while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == opponent) {
                line.add(new int[]{r, c});
                r += dir[0]; c += dir[1];
            }
            if (!line.isEmpty() && r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == color) {
                flipped.addAll(line);
            }
        }
        return flipped;
    }

    public int[] countPieces(String matchId) {
        int[][] board = boards.get(matchId);
        int black = 0, white = 0;
        for (int[] row : board) for (int cell : row) {
            if (cell == BLACK) black++;
            else if (cell == WHITE) white++;
        }
        return new int[]{black, white};
    }

    public boolean isGameOver(String matchId) {
        return turns.getOrDefault(matchId, -1) == 0;
    }

    public boolean opponentHasNoMoves(String matchId) {
        int[][] board = boards.get(matchId);
        int turn = turns.get(matchId);
        int opponent = (turn == BLACK) ? WHITE : BLACK;
        // Sau khi applyMove, nếu lượt vẫn là turn (không đổi sang opponent) thì opponent không có nước
        return !getValidMoves(board, opponent).isEmpty() == false && !getValidMoves(board, turn).isEmpty();
    }

    public GameStateResponse buildGameState(String matchId) {
        int[][] board = boards.get(matchId);
        int turn = turns.get(matchId);
        int[] counts = countPieces(matchId);
        List<int[]> validMoves = turn > 0 ? getValidMoves(board, turn) : List.of();
        String status = (turn == 0) ? "FINISHED" : "ONGOING";

        return GameStateResponse.builder()
                .matchId(matchId)
                .board(board)
                .currentTurn(turn == BLACK ? "BLACK" : turn == WHITE ? "WHITE" : "NONE")
                .blackCount(counts[0])
                .whiteCount(counts[1])
                .status(status)
                .validMoves(validMoves)
                .build();
    }

    public void removeGame(String matchId) {
        boards.remove(matchId);
        turns.remove(matchId);
        log.info("Game state removed for matchId={}", matchId);
    }
}
