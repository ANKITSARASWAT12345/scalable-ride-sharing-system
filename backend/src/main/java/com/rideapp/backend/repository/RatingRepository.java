package com.rideapp.backend.repository;

import com.rideapp.backend.model.Rating;
import com.rideapp.backend.model.Ride;
import com.rideapp.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RatingRepository extends JpaRepository<Rating, UUID> {

    // Check if a user already rated for this ride (prevent duplicate)
    Optional<Rating> findByRideAndRater(Ride ride, User rater);

    // Get the average of all ratings received by a user
    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.ratee = :user")
    Optional<Double> findAverageRatingForUser(@Param("user") User user);

    // Get count of ratings received
    long countByRatee(User user);
}
