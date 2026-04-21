package com.rideapp.backend.service;


import com.rideapp.backend.dto.request.SubmitRatingRequest;
import com.rideapp.backend.exception.RideNotFoundException;
import com.rideapp.backend.model.*;
import com.rideapp.backend.repository.DriverProfileRepository;
import com.rideapp.backend.repository.RatingRepository;
import com.rideapp.backend.repository.RideRepository;
import com.rideapp.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
public class RatingService {


    private final RatingRepository ratingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;


    @Transactional
    public void submitRating(SubmitRatingRequest request, String raterEmail) {
        User rater = getUserByEmail(raterEmail);
        Ride ride  = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new RideNotFoundException("Ride not found"));

        // Only completed rides can be rated
        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new IllegalStateException("Can only rate completed rides");
        }

        // One rating per person per ride
        ratingRepository.findByRideAndRater(ride, rater).ifPresent(r -> {
            throw new IllegalStateException("You have already rated this ride");
        });

        User ratee = determineRatee(ride, rater);

        // Validate stars
        if (request.getStars() < 1 || request.getStars() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars");
        }

        // Save the rating
        ratingRepository.save(Rating.builder()
                .ride(ride)
                .rater(rater)
                .ratee(ratee)
                .stars(request.getStars())
                .comment(request.getComment())
                .build()
        );

        // If rider rated driver, update the driver's profile rating
        // This feeds directly into the Phase 3 matching algorithm
        if (rater.getRole() == Role.RIDER && ratee.getRole() == Role.DRIVER) {
            updateDriverRating(ratee, request.getStars());
        }

        log.info("Rating submitted: rater={}, ratee={}, stars={}, ride={}",
                rater.getEmail(), ratee.getEmail(), request.getStars(), ride.getId());
    }


    // ── Weighted rolling average ──────────────────────────────────────
    // This is smarter than a simple average.
    // New ratings count 2× — prevents old good reviews from masking recent bad behaviour.
    // A driver who was great 2 years ago but is now rude can't hide behind their old score.
    private void updateDriverRating(User driver, int newStars) {
        DriverProfile profile = driverProfileRepository.findByDriver(driver)
                .orElseThrow(() -> new IllegalStateException("Driver profile not found"));

        int totalRatings = profile.getTotalRatings();
        double currentRating = profile.getRating().doubleValue();

        // Weighted formula: new rating counts as 2 ratings
        // This gives recent feedback more influence than old ratings
        double updatedRating = ((currentRating * totalRatings) + (newStars * 2.0))
                / (totalRatings + 2);

        profile.setRating(BigDecimal.valueOf(updatedRating).setScale(2, RoundingMode.HALF_UP));
        profile.setTotalRatings(totalRatings + 1);
        driverProfileRepository.save(profile);

        log.info("Driver rating updated: driver={}, old={}, new={}, totalRatings={}",
                driver.getEmail(), currentRating, updatedRating, totalRatings + 1);
    }


    // ── Update acceptance rate ────────────────────────────────────────
    // Called from RideService when driver accepts or ignores a ride
    @Transactional
    public void updateAcceptanceRate(User driver, boolean accepted) {
        DriverProfile profile = driverProfileRepository.findByDriver(driver)
                .orElseThrow(() -> new IllegalStateException("Driver profile not found"));

        // Exponential moving average for acceptance rate too
        // Alpha = 0.1 — very smooth, slow to change (prevents single events from tanking score)
        double alpha = 0.1;
        double currentRate = profile.getAcceptanceRate();
        double newRate = (alpha * (accepted ? 1.0 : 0.0)) + ((1 - alpha) * currentRate);

        profile.setAcceptanceRate(newRate);
        driverProfileRepository.save(profile);
    }


    private User determineRatee(Ride ride, User rater) {
        if (rater.getRole() == Role.RIDER) {
            if (ride.getDriver() == null) throw new IllegalStateException("No driver to rate");
            return ride.getDriver();
        } else {
            return ride.getRider();
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

}
