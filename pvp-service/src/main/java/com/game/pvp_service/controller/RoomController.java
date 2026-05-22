package com.game.pvp_service.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.pvp_service.dto.response.ApiResponse;
import com.game.pvp_service.dto.response.RoomResponse;
import com.game.pvp_service.service.RoomService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;


@Slf4j
@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoomController {

    RoomService roomService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROOM_CREATE')")
    public ApiResponse<RoomResponse> createRoom() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        RoomResponse roomResponse = roomService.createRoom(username);
        return ApiResponse.<RoomResponse>builder()
                .result(roomResponse)
                .build();
    }

    @GetMapping
    public ApiResponse<List<RoomResponse>> getWaitingRooms() {
        return ApiResponse.<List<RoomResponse>>builder()
                .result(roomService.getWaitingRooms())
                .build();
    }

    @PutMapping("/join/{roomId}")
    @PreAuthorize("hasAuthority('ROOM_JOIN')")
    public ApiResponse<RoomResponse> joinRoom(@PathVariable String roomId) {
        RoomResponse roomResponse = roomService.joinRoom(roomId);
        return ApiResponse.<RoomResponse>builder()
                .result(roomResponse)
                .build();
    }

    @PutMapping("/leave/{roomId}")
    @PreAuthorize("hasAuthority('ROOM_LEAVE')")
    public ApiResponse<RoomResponse> leaveRoom(@PathVariable String roomId) {
        RoomResponse roomResponse = roomService.leaveRoom(roomId);
        return ApiResponse.<RoomResponse>builder()
            .result(roomResponse)
            .build();
    }
}
