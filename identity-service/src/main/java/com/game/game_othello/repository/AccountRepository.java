package com.game.game_othello.repository;

import com.game.game_othello.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    boolean existsByProviderAndProviderAccountId(String provider, String providerAccountId);

    Optional<Account> findByProviderAndProviderAccountId(String provider, String providerAccountId);
}
