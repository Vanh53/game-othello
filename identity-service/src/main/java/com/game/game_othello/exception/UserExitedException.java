package com.game.game_othello.exception;

public class UserExitedException extends RuntimeException{
    private ErrorCode errorCode;

    public UserExitedException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(ErrorCode errorCode) {
        this.errorCode = errorCode;
    }
}
