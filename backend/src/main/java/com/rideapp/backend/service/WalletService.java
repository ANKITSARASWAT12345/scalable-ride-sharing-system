package com.rideapp.backend.service;


import com.rideapp.backend.exception.InsufficientBalanceException;
import com.rideapp.backend.model.*;
import com.rideapp.backend.repository.TransactionRepository;
import com.rideapp.backend.repository.UserRepository;
import com.rideapp.backend.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Value("${app.platform.commission-rate}")
    private double commissionRate;

    // ── Create wallet for new user (called at registration) ──────────
    @Transactional
    public Wallet createWallet(User user) {
        Wallet wallet = Wallet.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .totalEarned(BigDecimal.ZERO)
                .totalSpent(BigDecimal.ZERO)
                .build();
        return walletRepository.save(wallet);
    }


    @Transactional
    public Wallet topUp(User user, BigDecimal amount, String gatewayPaymentId) {
        // Use pessimistic lock — prevents race conditions
        Wallet wallet = walletRepository.findByUserWithLock(user)
                .orElseGet(() -> createWallet(user));

        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet saved = walletRepository.save(wallet);

        // Create an immutable transaction record
        transactionRepository.save(Transaction.builder()
                .wallet(saved)
                .type(TransactionType.TOPUP)
                .amount(amount)
                .balanceAfter(saved.getBalance())
                .description("Wallet top-up via Razorpay")
                .gatewayPaymentId(gatewayPaymentId)
                .build()
        );

        log.info("Wallet topped up: user={}, amount={}, newBalance={}",
                user.getEmail(), amount, saved.getBalance());
        return saved;
    }


    // ── Process ride payment from wallet ─────────────────────────────
    // This is an ATOMIC operation — both debit and credit happen together
    // or neither happens (ACID guarantee)
    @Transactional
    public void processRidePayment(Ride ride, User rider, User driver) {
        BigDecimal fare = ride.getFare();
        BigDecimal commission = fare.multiply(BigDecimal.valueOf(commissionRate));
        BigDecimal driverEarning = fare.subtract(commission);
        // e.g. fare=₹100 → commission=₹20 → driver gets ₹80

        // Step 1: Debit rider wallet (with lock to prevent race conditions)
        Wallet riderWallet = walletRepository.findByUserWithLock(rider)
                .orElseGet(() -> createWallet(rider));

        if (riderWallet.getBalance().compareTo(fare) < 0) {
            throw new InsufficientBalanceException(
                    "Insufficient balance. Need ₹" + fare + ", have ₹" + riderWallet.getBalance()
            );
        }

        riderWallet.setBalance(riderWallet.getBalance().subtract(fare));
        riderWallet.setTotalSpent(riderWallet.getTotalSpent().add(fare));
        walletRepository.save(riderWallet);

        // Record the debit
        transactionRepository.save(Transaction.builder()
                .wallet(riderWallet)
                .ride(ride)
                .type(TransactionType.DEBIT)
                .amount(fare)
                .balanceAfter(riderWallet.getBalance())
                .description("Ride to " + ride.getDropAddress())
                .build()
        );

        // Step 2: Credit driver wallet
        Wallet driverWallet = walletRepository.findByUserWithLock(driver)
                .orElseGet(() -> createWallet(driver));

        driverWallet.setBalance(driverWallet.getBalance().add(driverEarning));
        driverWallet.setTotalEarned(driverWallet.getTotalEarned().add(driverEarning));
        walletRepository.save(driverWallet);

        // Record the credit
        transactionRepository.save(Transaction.builder()
                .wallet(driverWallet)
                .ride(ride)
                .type(TransactionType.CREDIT)
                .amount(driverEarning)
                .balanceAfter(driverWallet.getBalance())
                .description("Earning from ride — " + rider.getName())
                .build()
        );

        log.info("Ride payment processed: rideId={}, fare={}, driverEarning={}, commission={}",
                ride.getId(), fare, driverEarning, commission);
    }




    // ── Refund on cancellation ────────────────────────────────────────
    @Transactional
    public void refundRide(Ride ride, User rider) {
        // Only refund if a payment was already made
        BigDecimal fare = ride.getFare();
        Wallet riderWallet = walletRepository.findByUserWithLock(rider)
                .orElseGet(() -> createWallet(rider));

        riderWallet.setBalance(riderWallet.getBalance().add(fare));
        riderWallet.setTotalSpent(riderWallet.getTotalSpent().subtract(fare));
        walletRepository.save(riderWallet);

        transactionRepository.save(Transaction.builder()
                .wallet(riderWallet)
                .ride(ride)
                .type(TransactionType.REFUND)
                .amount(fare)
                .balanceAfter(riderWallet.getBalance())
                .description("Refund — cancelled ride")
                .build()
        );

        log.info("Refund processed: rideId={}, amount={}", ride.getId(), fare);
    }

    public Wallet getWallet(User user) {
        return walletRepository.findByUser(user)
                .orElseGet(() -> createWallet(user));
    }

}
