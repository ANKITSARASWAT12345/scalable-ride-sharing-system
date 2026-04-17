package com.rideapp.backend.repository;

import com.rideapp.backend.model.Ride;
import com.rideapp.backend.model.RideStatus;
import com.rideapp.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // Add to RideRepository.java
    @Query("SELECT COUNT(r) FROM Ride r WHERE r.driver = :driver AND r.status = 'COMPLETED'")
    long countByDriverAndStatusCompleted(@Param("driver") User driver);


    // Add to RideRepository.java
    @Query(value = """
    SELECT COUNT(*) FROM rides r
    WHERE r.status = 'REQUESTED'
    AND (6371 * acos(
        cos(radians(:lat)) * cos(radians(
            (SELECT dl.latitude FROM driver_locations dl LIMIT 1)
        )) * cos(radians(
            (SELECT dl.longitude FROM driver_locations dl LIMIT 1)
        ) - radians(:lng))
        + sin(radians(:lat)) * sin(radians(
            (SELECT dl.latitude FROM driver_locations dl LIMIT 1)
        ))
    )) <= :radiusKm
    """, nativeQuery = true)
    long countRequestedRidesNear(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusKm") Double radiusKm
    );


}
