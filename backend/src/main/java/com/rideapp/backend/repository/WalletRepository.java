package com.rideapp.backend.repository;

import com.rideapp.backend.model.User;
import com.rideapp.backend.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    Optional<Wallet> findByUser(User user);

    // Pessimistic lock — locks the row in DB so two simultaneous payments
    // can't both read the same balance and double-deduct.
    // This is critical for financial correctness.
    @Query("SELECT w FROM Wallet w WHERE w.user = :user")
    @org.springframework.data.jpa.repository.Lock(
            jakarta.persistence.LockModeType.PESSIMISTIC_WRITE
    )
    Optional<Wallet> findByUserWithLock(@Param("user") User user);

}
