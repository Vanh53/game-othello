package com.game.game_othello.repository;

import com.game.game_othello.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    @Query("select u from User u " +
            "left join fetch u.roles r " +
            "left join fetch r.permissions p " +
            "where u.isDeleted = false")
    List<User> findAllWithQuery();
}
