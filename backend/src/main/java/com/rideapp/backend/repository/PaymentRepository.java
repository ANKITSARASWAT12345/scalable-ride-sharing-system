package com.rideapp.backend.repository;

import com.rideapp.backend.model.Payment;
import com.rideapp.backend.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByRide(Ride ride);
    Optional<Payment> findByRazorpayOrderId(String orderId);
}
