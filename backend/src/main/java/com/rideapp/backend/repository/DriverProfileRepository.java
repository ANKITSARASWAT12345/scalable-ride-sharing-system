package com.rideapp.backend.repository;

import com.rideapp.backend.model.DriverProfile;
import com.rideapp.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DriverProfileRepository extends JpaRepository<DriverProfile, UUID> {

    Optional<DriverProfile> findByDriver(User driver);
}
