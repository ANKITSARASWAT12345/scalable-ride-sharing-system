package com.rideapp.backend.repository;

import com.rideapp.backend.model.DriverLocation;
import com.rideapp.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface DriverLocationRepository extends JpaRepository<DriverLocation, UUID> {

    Optional<DriverLocation> findByDriver(User driver);

    @Query(value = """
        SELECT dl.* FROM driver_locations dl
        JOIN driver_profiles dp ON dp.user_id = dl.driver_id
        WHERE dl.is_available = true
          AND dp.vehicle_type = :vehicleType
          AND dp.is_verified = true
          AND (
            6371 * acos(
              cos(radians(:lat)) * cos(radians(dl.latitude))
              * cos(radians(dl.longitude) - radians(:lng))
              + sin(radians(:lat)) * sin(radians(dl.latitude))
            )
          ) <= :radiusKm
        ORDER BY (
            6371 * acos(
              cos(radians(:lat)) * cos(radians(dl.latitude))
              * cos(radians(dl.longitude) - radians(:lng))
              + sin(radians(:lat)) * sin(radians(dl.latitude))
            )
        ) ASC
        LIMIT 10
        """, nativeQuery = true)
    List<DriverLocation> findNearbyAvailableDrivers(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusKm") Double radiusKm,
            @Param("vehicleType") String vehicleType
    );


    // Add to DriverLocationRepository.java
    @Query(value = """
    SELECT COUNT(*) FROM driver_locations dl
    WHERE dl.is_available = true
    AND (6371 * acos(
        cos(radians(:lat)) * cos(radians(dl.latitude))
        * cos(radians(dl.longitude) - radians(:lng))
        + sin(radians(:lat)) * sin(radians(dl.latitude))
    )) <= :radiusKm
    """, nativeQuery = true)
    long countNearbyAvailableDrivers(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusKm") Double radiusKm
    );


}