package com.game.pvp_service.component;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý trạng thái kết nối WebSocket.
 * sessionId <-> username
 * matchId <-> set of usernames
 */
@Slf4j
@Component
public class PresenceManager {

    private final Map<String, String> sessionToUser = new ConcurrentHashMap<>();
    private final Map<String, String> userToSession = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> matchToUsers = new ConcurrentHashMap<>();
    private final Map<String, String> userToMatch = new ConcurrentHashMap<>();

    public void register(String sessionId, String username) {
        sessionToUser.put(sessionId, username);
        userToSession.put(username, sessionId);
        log.debug("Registered session={} for user={}", sessionId, username);
    }

    public void unregister(String sessionId) {
        String username = sessionToUser.remove(sessionId);
        if (username != null) {
            userToSession.remove(username);
            log.debug("Unregistered session={} for user={}", sessionId, username);
        }
    }

    public String getUserBySession(String sessionId) {
        return sessionToUser.get(sessionId);
    }

    public String getSessionByUser(String username) {
        return userToSession.get(username);
    }

    public void joinMatch(String matchId, String username) {
        matchToUsers.computeIfAbsent(matchId, k -> ConcurrentHashMap.newKeySet()).add(username);
        userToMatch.put(username, matchId);
    }

    public void leaveMatch(String matchId, String username) {
        Set<String> users = matchToUsers.get(matchId);
        if (users != null) users.remove(username);
        userToMatch.remove(username);
    }

    public void removeMatch(String matchId) {
        Set<String> users = matchToUsers.remove(matchId);
        if (users != null) users.forEach(userToMatch::remove);
    }

    public String getMatchByUser(String username) {
        return userToMatch.get(username);
    }

    public Set<String> getUsersInMatch(String matchId) {
        return matchToUsers.getOrDefault(matchId, Set.of());
    }

    public boolean isUserInMatch(String username) {
        return userToMatch.containsKey(username);
    }
}
