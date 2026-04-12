package com.rideapp.backend.repository;

import com.rideapp.backend.model.Ride;
import com.rideapp.backend.model.RideStatus;
import com.rideapp.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RideRepository extends JpaRepository<Ride, UUID> {

    List<Ride> findByRiderOrderByRequestedAtDesc(User rider);

    List<Ride> findByDriverOrderByRequestedAtDesc(User driver);

    Optional<Ride> findByRiderAndStatusIn(User rider, List<RideStatus> statuses);

    Optional<Ride> findByDriverAndStatusIn(User driver, List<RideStatus> statuses);

    // find all rides waiting for a driver (for the matching algorithm)
    List<Ride> findByStatus(RideStatus status);
}
