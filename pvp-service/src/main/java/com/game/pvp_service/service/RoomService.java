package com.game.pvp_service.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.game.pvp_service.dto.response.RoomResponse;
import com.game.pvp_service.entity.Room;
import com.game.pvp_service.exception.AppException;
import com.game.pvp_service.exception.ErrorCode;
import com.game.pvp_service.mapper.RoomMapper;
import com.game.pvp_service.repository.MatchRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoomService {

    static final String ROOM_KEY_PREFIX = "room:";
    static final String ROOMS_WAITING_KEY = "rooms:waiting";
    static final long ROOM_TTL_MINUTES = 30;

    RedisTemplate<String, Object> redisTemplate;
    ObjectMapper objectMapper;
    RoomMapper roomMapper;
    MatchRepository matchRepository;
    SimpMessagingTemplate messagingTemplate;

    public RoomResponse createRoom(String hostUsername) {
        if (isUserInWaitingRoom(hostUsername)) {
            throw new AppException(ErrorCode.ALREADY_IN_ROOM);
        }
        matchRepository.findOngoingMatchByPlayerId(UUID.fromString(hostUsername)).ifPresent(m -> {
            throw new AppException(ErrorCode.ALREADY_IN_MATCH);
        });

        String roomId = UUID.randomUUID().toString();
        Room room = Room.builder()
                .roomId(roomId)
                .hostUsername(hostUsername)
                .status("WAITING")
                .createdAt(LocalDateTime.now())
                .build();

        String key = ROOM_KEY_PREFIX + roomId;
        redisTemplate.opsForValue().set(key, room, ROOM_TTL_MINUTES, TimeUnit.MINUTES);
        redisTemplate.opsForSet().add(ROOMS_WAITING_KEY, roomId);
        log.info("Room created: roomId={}, host={}", roomId, hostUsername);
        return roomMapper.toRoomResponse(room);
    }

    public List<RoomResponse> getWaitingRooms() {
        Set<Object> roomIds = redisTemplate.opsForSet().members(ROOMS_WAITING_KEY);
        if (roomIds == null || roomIds.isEmpty()) return List.of();
        return roomIds.stream()
                .map(id -> getRoom(id.toString()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .filter(r -> "WAITING".equals(r.getStatus()))
                .map(r -> roomMapper.toRoomResponse(r))
                .collect(Collectors.toList());
    }

    public RoomResponse joinRoom(String roomId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return joinRoom(roomId, username);
    }

    public RoomResponse joinRoom(String roomId, String username) {
        Room room = getRoom(roomId).orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));

        if ("FULL".equals(room.getStatus())) throw new AppException(ErrorCode.ROOM_IS_FULL);
        if (username.equals(room.getHostUsername())) throw new AppException(ErrorCode.CANNOT_JOIN_OWN_ROOM);

        room.setGuestUsername(username);
        room.setStatus("FULL");
        updateRoom(room);

        RoomResponse response = roomMapper.toRoomResponse(room);

        // Bắn tín hiệu WebSocket cho Host (U1) biết Guest (U2) đã vào
        messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
        return response;
    }

    public RoomResponse leaveRoom(String roomId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Room room = getRoom(roomId).orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_FOUND));
        String host = room.getHostUsername();
        String guest = room.getGuestUsername();

        if (guest == null) {
            closeRoom(roomId);
            return null;
        }

        if (host.equals(username)) {
            room.setHostUsername(guest);
            room.setGuestUsername(null);
            room.setStatus("WAITING");
            updateRoom(room);
        } else if (guest.equals(username)) {
            room.setGuestUsername(null);
            room.setStatus("WAITING");
            updateRoom(room);
        }

        RoomResponse response = roomMapper.toRoomResponse(room);

        // Bắn tín hiệu WebSocket báo rằng có người vừa rời đi
        messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
        return response;
    }

    public Optional<Room> getRoom(String roomId) {
        Object raw = redisTemplate.opsForValue().get(ROOM_KEY_PREFIX + roomId);
        if (raw == null) return Optional.empty();
        try {
            Room room = objectMapper.convertValue(raw, Room.class);
            return Optional.of(room);
        } catch (Exception e) {
            log.warn("Failed to deserialize room {}: {}", roomId, e.getMessage());
            return Optional.empty();
        }
    }

    public void updateRoom(Room room) {
        String key = ROOM_KEY_PREFIX + room.getRoomId();
        Long ttl = redisTemplate.getExpire(key, TimeUnit.MINUTES);
        long remaining = (ttl != null && ttl > 0) ? ttl : ROOM_TTL_MINUTES;
        redisTemplate.opsForValue().set(key, room, remaining, TimeUnit.MINUTES);
    }

    public void closeRoom(String roomId) {
        redisTemplate.delete(ROOM_KEY_PREFIX + roomId);
        redisTemplate.opsForSet().remove(ROOMS_WAITING_KEY, roomId);
        log.info("Room closed: roomId={}", roomId);
    }

    public boolean isUserInWaitingRoom(String username) {
        Set<Object> roomIds = redisTemplate.opsForSet().members(ROOMS_WAITING_KEY);
        if (roomIds == null) return false;
        return roomIds.stream()
                .map(id -> getRoom(id.toString()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .anyMatch(r -> username.equals(r.getHostUsername()) && "WAITING".equals(r.getStatus()));
    }

}
