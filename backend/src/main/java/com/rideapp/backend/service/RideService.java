package com.rideapp.backend.service;


import com.rideapp.backend.dto.request.BookRideRequest;
import com.rideapp.backend.dto.response.RideResponse;
import com.rideapp.backend.exception.RideNotFoundException;
import com.rideapp.backend.exception.UnauthorizedActionException;
import com.rideapp.backend.model.DriverLocation;
import com.rideapp.backend.model.Ride;
import com.rideapp.backend.model.RideStatus;
import com.rideapp.backend.model.User;
import com.rideapp.backend.repository.DriverLocationRepository;
import com.rideapp.backend.repository.RideRepository;
import com.rideapp.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RideService {

    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final DriverLocationRepository driverLocationRepository;
    private final FareCalculatorService fareCalculatorService;

    private final DriverMatchingService driverMatchingService;
    private final SurgePricingService surgePricingService;
    private final EtaService etaService;
    private final RealTimeService realTimeService;



//    @Transactional
//    public RideResponse bookRide(BookRideRequest request,String riderEmail){
//
//        User rider= getUserByEmail(riderEmail);
//
//
//        List<RideStatus> activeStatus= List.of(
//                RideStatus.REQUESTED,RideStatus.IN_PROGRESS,RideStatus.ACCEPTED,RideStatus.PICKED_UP
//        );
//
//        rideRepository.findByDriverAndStatusIn(rider,activeStatus).ifPresent(r->{
//            throw  new IllegalStateException("You already have an active ridee");
//        });
//
//
//        BigDecimal distance= fareCalculatorService.calculateDistance(
//
//                request.getPickupLat(),request.getPickupLng(),
//                request.getDropLat(),request.getDropLng()
//        );
//
//        BigDecimal estimateFare=fareCalculatorService.calculate(request.getVehicleType(),distance);
//
//        List<DriverLocation> nearByDrivers=driverLocationRepository.findNearbyAvailableDrivers(
//                request.getPickupLat(),request.getPickupLng(),
//                5.0,
//                request.getVehicleType().name()
//        );
//
//        User assignedDriver=nearByDrivers.isEmpty()?null:nearByDrivers.get(0).getDriver();
//
//        Ride ride=Ride.builder()
//                .rider(rider)
//                .driver(assignedDriver)
//                .pickupAddress(request.getPickupAddress())
//                .pickupLat(request.getPickupLat())
//                .pickupLng(request.getPickupLng())
//                .dropLat(request.getDropLat())
//                .dropLng(request.getDropLng())
//                .vehicleType(request.getVehicleType())
//                .distanceKm(distance)
//                .fare(estimateFare)
//                .status(assignedDriver != null ? RideStatus.ACCEPTED : RideStatus.REQUESTED)
//                .acceptedAt(assignedDriver != null ? LocalDateTime.now() : null)
//                .build();
//
//        //if driver is assigned to this ride then make the driver as unavailable
//
//
//        if(assignedDriver!=null){
//            driverLocationRepository.findByDriver(assignedDriver).ifPresent(loc->{
//                loc.setAvailable(false);
//                driverLocationRepository.save(loc);
//            });
//        }
//
//        Ride saved=rideRepository.save(ride);
//
//        return toResponse(saved);
//
//
//    }


    @Transactional

    public RideResponse bookRide(BookRideRequest request, String riderEmail){

        User rider=getUserByEmail(riderEmail);

        // block double-booking
        List<RideStatus> activeStatuses = List.of(
                RideStatus.REQUESTED, RideStatus.ACCEPTED,
                RideStatus.PICKED_UP, RideStatus.IN_PROGRESS
        );

        rideRepository.findByRiderAndStatusIn(rider,activeStatuses).ifPresent(r->{
            throw new IllegalStateException("You already have an active ride");
        });


        // ── ALGORITHM 1: Smart driver matching ──
        Optional<User> bestDriver= driverMatchingService.findBestDriver(
                request.getPickupLat(), request.getPickupLng(), request.getVehicleType()
        );

        // ── ALGORITHM 2: Surge pricing ──
        BigDecimal surgeMultiplier = surgePricingService.getSurgeMultiplier(
                request.getPickupLat(), request.getPickupLng()
        );


        // ── ALGORITHM 3: ETA calculation ──
        int etaMinutes = 0;
        if (bestDriver.isPresent()) {
            driverLocationRepository.findByDriver(bestDriver.get()).ifPresent(loc -> {
                // store ETA in a local variable for use in the response
            });
            // simplified: just calculate from driver's stored location
            etaMinutes = bestDriver.map(driver ->
                    driverLocationRepository.findByDriver(driver)
                            .map(loc -> etaService.calculateEtaMinutes(
                                    loc.getLatitude(), loc.getLongitude(),
                                    request.getPickupLat(), request.getPickupLng(),
                                    request.getVehicleType()
                            )).orElse(5)
            ).orElse(0);
        }


        // Calculate distance and base fare
        BigDecimal distance = fareCalculatorService.calculateDistance(
                request.getPickupLat(), request.getPickupLng(),
                request.getDropLat(), request.getDropLng()
        );
        BigDecimal baseFare    = fareCalculatorService.calculate(request.getVehicleType(), distance);
        BigDecimal surgedFare  = surgePricingService.applysurge(baseFare, surgeMultiplier);


        // Build the ride
        Ride ride = Ride.builder()
                .rider(rider)
                .driver(bestDriver.orElse(null))
                .pickupAddress(request.getPickupAddress())
                .pickupLat(request.getPickupLat())
                .pickupLng(request.getPickupLng())
                .dropAddress(request.getDropAddress())
                .dropLat(request.getDropLat())
                .dropLng(request.getDropLng())
                .vehicleType(request.getVehicleType())
                .distanceKm(distance)
                .fare(surgedFare)
                .surgeMultiplier(surgeMultiplier)    // add this field to Ride entity
                .etaMinutes(etaMinutes)              // add this field to Ride entity
                .status(bestDriver.isPresent() ? RideStatus.ACCEPTED : RideStatus.REQUESTED)
                .acceptedAt(bestDriver.isPresent() ? LocalDateTime.now() : null)
                .build();
        // Mark driver as unavailable
        bestDriver.ifPresent(driver ->
                driverLocationRepository.findByDriver(driver).ifPresent(loc -> {
                    loc.setAvailable(false);
                    driverLocationRepository.save(loc);
                })
        );

        Ride saved = rideRepository.save(ride);

        // ── REAL-TIME: Notify driver they've been matched ──
        bestDriver.ifPresent(driver ->
                realTimeService.sendPrivateNotification(
                        driver.getEmail(),
                        "RIDE_ASSIGNED",
                        toResponse(saved)
                )
        );

        return toResponse(saved);
    }


    @Transactional

    public RideResponse cancelRide(UUID rideId,String userEmail,String reason){
        Ride ride=getRideById(rideId);
        User user=getUserByEmail(userEmail);

        //only rider and driver assigned to that ride can cancel that ride

        boolean isRider=ride.getRider().getId().equals(user.getId());

        boolean isDriver=ride.getDriver()!=null && ride.getDriver().getId().equals(user.getId());


        if(!isRider && !isDriver){
            throw new UnauthorizedActionException("Not authorized to cancel this ride");
        }

        // can only cancel before ride is in progress
        if (ride.getStatus() == RideStatus.IN_PROGRESS ||
                ride.getStatus() == RideStatus.COMPLETED ||
                ride.getStatus() == RideStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel a ride in status: " + ride.getStatus());
        }

        //free up the driver if assigned



        if(ride.getDriver()!=null){
            driverLocationRepository.findByDriver(ride.getDriver()).ifPresent(loc->{
                loc.setAvailable(true);
                driverLocationRepository.save(loc);
            });
        }

        ride.setStatus(RideStatus.CANCELLED);
        ride.setCancelledAt(LocalDateTime.now());
        ride.setCancellationReason(reason);

        Ride savedRide = rideRepository.save(ride);
        RideResponse response = toResponse(savedRide);

        Map<String, Object> statusMetadata = new HashMap<>();
        statusMetadata.put("reason", reason);
        statusMetadata.put("ride", response);

        broadcastRideStatusAfterCommit(savedRide.getId(), savedRide.getStatus(), statusMetadata);

        return response;

    }


    public List<RideResponse> getRiderHistory(String riderEmail) {
        User rider = getUserByEmail(riderEmail);
        return rideRepository.findByRiderOrderByRequestedAtDesc(rider)
                .stream().map(this::toResponse).toList();
    }



    @Transactional
    public RideResponse acceptRide(UUID rideId, String driverEmail) {
        Ride ride = getRideById(rideId);
        User driver = getUserByEmail(driverEmail);

        if (ride.getStatus() != RideStatus.REQUESTED) {
            throw new IllegalStateException("Ride is no longer available");
        }

        ride.setDriver(driver);
        ride.setStatus(RideStatus.ACCEPTED);
        ride.setAcceptedAt(LocalDateTime.now());

        // mark driver as unavailable
        driverLocationRepository.findByDriver(driver).ifPresent(loc -> {
            loc.setAvailable(false);
            driverLocationRepository.save(loc);
        });
        Ride savedRide = rideRepository.save(ride);
        RideResponse response = toResponse(savedRide);

        Map<String, Object> statusMetadata = new HashMap<>();
        statusMetadata.put("ride", response);

        broadcastRideStatusAfterCommit(savedRide.getId(), savedRide.getStatus(), statusMetadata);

        return response;
    }


    @Transactional
    public RideResponse updateRideStatus(UUID rideId, RideStatus newStatus, String driverEmail) {
        Ride ride = getRideById(rideId);
        User driver = getUserByEmail(driverEmail);

        // verify this driver owns this ride
        if (ride.getDriver() == null || !ride.getDriver().getId().equals(driver.getId())) {
            throw new UnauthorizedActionException("Not your ride");
        }

        // enforce valid state transitions
        validateStatusTransition(ride.getStatus(), newStatus);

        ride.setStatus(newStatus);

        switch (newStatus) {
            case PICKED_UP    -> ride.setPickedUpAt(LocalDateTime.now());
            case IN_PROGRESS  -> {} // no extra fields needed
            case COMPLETED    -> {
                ride.setCompletedAt(LocalDateTime.now());
                // recalculate final fare (could differ from estimate with traffic, route changes)
                BigDecimal finalFare = fareCalculatorService.calculate(
                        ride.getVehicleType(), ride.getDistanceKm()
                );
                ride.setFare(finalFare);
                // mark driver as available again
                driverLocationRepository.findByDriver(driver).ifPresent(loc -> {
                    loc.setAvailable(true);
                    driverLocationRepository.save(loc);
                });
            }
            default -> throw new IllegalStateException("Invalid transition: " + newStatus);
        }
        Ride savedRide = rideRepository.save(ride);
        RideResponse response = toResponse(savedRide);

        Map<String, Object> statusMetadata = new HashMap<>();
        statusMetadata.put("ride", response);

        broadcastRideStatusAfterCommit(savedRide.getId(), savedRide.getStatus(), statusMetadata);

        return response;
    }


    public List<RideResponse> getAvailableRides(String driverEmail) {
        // driver sees all REQUESTED rides waiting for someone to accept
        return rideRepository.findByStatus(RideStatus.REQUESTED)
                .stream().map(this::toResponse).toList();
    }



    public List<RideResponse> getDriverHistory(String driverEmail) {
        User driver = getUserByEmail(driverEmail);
        return rideRepository.findByDriverOrderByRequestedAtDesc(driver)
                .stream().map(this::toResponse).toList();
    }



    public RideResponse getRide(UUID rideId) {
        return toResponse(getRideById(rideId));
    }



    private void validateStatusTransition(RideStatus current, RideStatus next) {
        // defines the ONLY valid transitions — anything else is rejected
        boolean valid = switch (current) {
            case ACCEPTED    -> next == RideStatus.PICKED_UP   || next == RideStatus.CANCELLED;
            case PICKED_UP   -> next == RideStatus.IN_PROGRESS;
            case IN_PROGRESS -> next == RideStatus.COMPLETED;
            default          -> false;
        };
        if (!valid) {
            throw new IllegalStateException(
                    "Cannot transition from " + current + " to " + next
            );
        }
    }

    private void broadcastRideStatusAfterCommit(UUID rideId, RideStatus status, Map<String, Object> extraData) {
        Runnable broadcastAction = () ->
                realTimeService.broadcastRideStatusUpdate(rideId, status.name(), extraData);

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            broadcastAction.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                broadcastAction.run();
            }
        });
    }



    private RideResponse toResponse(Ride ride) {
        return RideResponse.builder()
                .id(ride.getId())
                .riderId(ride.getRider().getId())
                .riderName(ride.getRider().getName())
                .driverId(ride.getDriver() != null ? ride.getDriver().getId() : null)
                .driverName(ride.getDriver() != null ? ride.getDriver().getName() : null)
                .driverPhone(ride.getDriver() != null ? ride.getDriver().getPhone() : null)
                .pickupAddress(ride.getPickupAddress())
                .pickupLat(ride.getPickupLat())
                .pickupLng(ride.getPickupLng())
                .dropAddress(ride.getDropAddress())
                .dropLat(ride.getDropLat())
                .dropLng(ride.getDropLng())
                .status(ride.getStatus())
                .fare(ride.getFare())
                .distanceKm(ride.getDistanceKm())
                .vehicleType(ride.getVehicleType())
                .requestedAt(ride.getRequestedAt())
                .acceptedAt(ride.getAcceptedAt())
                .completedAt(ride.getCompletedAt())
                .build();
    }


    private Ride getRideById(UUID id) {
        return rideRepository.findById(id)
                .orElseThrow(() -> new RideNotFoundException("Ride not found: " + id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }


}
