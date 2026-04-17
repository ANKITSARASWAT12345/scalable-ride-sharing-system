package com.rideapp.backend.service;


import com.rideapp.backend.model.DriverLocation;
import com.rideapp.backend.model.User;
import com.rideapp.backend.model.VehicleType;
import com.rideapp.backend.repository.DriverLocationRepository;
import com.rideapp.backend.repository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.annotation.Documented;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DriverMatchingService {

    private final RideRepository rideRepository;
    private final FareCalculatorService fareCalculatorService;
    private final DriverLocationRepository driverLocationRepository;



    // search radius in km — start at 3, expand to 5, then 8 if no drivers found
    private static  final double[] SEARCH_RADII={3.0,5.0,8.0};

    // Scoring weights — must sum to 1.0
    private static final double WEIGHT_DISTANCE    = 0.40;
    private static final double WEIGHT_RATING      = 0.30;
    private static final double WEIGHT_ACCEPTANCE  = 0.20;
    private static final double WEIGHT_EXPERIENCE  = 0.10;


    public Optional<User> findBestDriver(Double pickupLat, Double pickupLng, VehicleType vehicleType){

        List<DriverLocation> candidates= findCandidatesWithExpanding(pickupLat,pickupLng,vehicleType);

        if (candidates.isEmpty()) {
            log.warn("No available drivers found for vehicleType={}", vehicleType);
            return Optional.empty();
        }

        //score every driver and pick  the higher scorer

        return candidates.stream()
                .map(dl-> new ScoredDriver(dl,calculateScore(dl,pickupLat,pickupLng)))
                .peek(sd->log.debug("Driver {} scored {}", sd.driverLocation.getDriver().getEmail(), sd.score))
                .max(Comparator.comparingDouble(sd->sd.score))
                .map(sd->sd.driverLocation.getDriver());



    }


    //make scoring engine

    private  Double calculateScore(DriverLocation driverLocation, Double riderLat, Double riderLng){


           //distance score (0-100)

        BigDecimal distKm= fareCalculatorService.calculateDistance(
                riderLat, riderLng,
                driverLocation.getLatitude(), driverLocation.getLongitude()
        );

        double distanceScore= Math.max(0,100-(distKm.doubleValue()/8.0*100));


        double rawRating = driverLocation.getDriver().getDriverProfile() != null
                ? driverLocation.getDriver().getDriverProfile().getRating().doubleValue()
                : 4.0;


        double ratingScore;


        if(rawRating< 3.5){
            ratingScore=rawRating/ 3.5*50;
        }
        else{
            ratingScore=50+((rawRating-3.5)/1.5*50);
        }

        //Acceptance Rate

        double acceptRate= driverLocation.getDriver().getDriverProfile()!=null
                ?driverLocation.getDriver().getDriverProfile().getAcceptanceRate()
                :0.8;

        double acceptScore = acceptRate * 100;


        //EXPERIENCE SCORE (0–100)

        // More trips = more experienced. Capped at 500 trips for max score.
        // New drivers aren't penalised heavily — we want them to gain experience.
        long totalTrips = rideRepository
                .countByDriverAndStatusCompleted(driverLocation.getDriver());
        double expScore = Math.min(100, (totalTrips / 500.0) * 100);


        double finalScore = (distanceScore    * WEIGHT_DISTANCE)
                + (ratingScore  * WEIGHT_RATING)
                + (acceptScore  * WEIGHT_ACCEPTANCE)
                + (expScore     * WEIGHT_EXPERIENCE);


        log.debug("Score breakdown — dist:{} rating:{} accept:{} exp:{} → final:{}",
                String.format("%.1f", distanceScore),
                String.format("%.1f", ratingScore),
                String.format("%.1f", acceptScore),
                String.format("%.1f", expScore),
                String.format("%.2f", finalScore));

        return finalScore;


    }


    //Expanding radius search

    // We don't start with a big radius because that wastes computation.
    // Start small (3km), expand if no results found.
    // This is called "iterative deepening" — same idea used in chess engines.

    private List<DriverLocation> findCandidatesWithExpanding(Double lat, Double lng,VehicleType vehicleType){

        for(double radius: SEARCH_RADII){
            List<DriverLocation> results= driverLocationRepository.findNearbyAvailableDrivers(lat,lng,radius,vehicleType.name());


            if (!results.isEmpty()) {
                log.info("Found {} drivers within {}km radius", results.size(), radius);
                return results;
            }
            log.info("No drivers within {}km, expanding search...", radius);




        }
        return List.of();
    }

    //INNER RECORD

    private record  ScoredDriver(DriverLocation driverLocation,double score){};



}
