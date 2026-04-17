package com.rideapp.backend.service;


import com.rideapp.backend.repository.DriverLocationRepository;
import com.rideapp.backend.repository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class SurgePricingService {


    private final RideRepository rideRepository;
    private  final DriverLocationRepository driverLocationRepository;

    // Stores the PREVIOUS surge value per zone for EMA smoothing
    // ConcurrentHashMap = thread-safe, important because multiple ride requests
    // can come in simultaneously from different threads
    private final ConcurrentHashMap<String, Double> previousSurgeByZone = new ConcurrentHashMap<>();


    // EMA smoothing factor — 0.3 means "30% new value, 70% old value"
    // Lower value = smoother but slower to react. Higher = faster but jumpy.

    private static final double EMA_ALPHA = 0.3;

    // Hard cap — surge never exceeds 3x no matter how bad demand is

    private static final double MAX_SURGE = 3.0;
    private static final double MIN_SURGE = 1.0;


    public BigDecimal getSurgeMultiplier(Double lat, Double lng){

        String zoneKey= createZoneKey(lat,lng);

        // Count demand: REQUESTED rides in this zone waiting for drivers
        long pendingRides = rideRepository.countRequestedRidesNear(lat, lng, 3.0);

        // Count supply: online, available drivers in this zone
        long availableDrivers = driverLocationRepository
                .countNearbyAvailableDrivers(lat, lng, 3.0);


        // Calculate raw demand ratio
        double ratio;
        if (availableDrivers == 0) {
            // No drivers at all — maximum surge
            ratio = MAX_SURGE;
        } else {
            ratio = (double) pendingRides / availableDrivers;
        }


        // Map ratio → raw surge multiplier using threshold table
        double rawSurge = calculateRawSurge(ratio);

        // Apply EMA smoothing to avoid jarring price jumps
        double previousSurge = previousSurgeByZone.getOrDefault(zoneKey, 1.0);
        double smoothedSurge = (EMA_ALPHA * rawSurge) + ((1 - EMA_ALPHA) * previousSurge);


        // Clamp between 1.0 and 3.0
        smoothedSurge = Math.max(MIN_SURGE, Math.min(MAX_SURGE, smoothedSurge));

        // Store for next calculation
        previousSurgeByZone.put(zoneKey, smoothedSurge);

        log.info("Zone {}: pendingRides={}, availableDrivers={}, ratio={}, rawSurge={}, smoothed={}",
                zoneKey, pendingRides, availableDrivers,
                String.format("%.2f", ratio),
                String.format("%.2f", rawSurge),
                String.format("%.2f", smoothedSurge));

        return BigDecimal.valueOf(smoothedSurge).setScale(2, RoundingMode.HALF_UP);
    }


    // ── THRESHOLD TABLE ────────────────────────────────────────────────
    // This translates the raw demand ratio into a clean multiplier
    // Thresholds are tunable — in production you'd A/B test these
    private double calculateRawSurge(double demandRatio) {
        if (demandRatio < 1.0)  return 1.0;  // supply > demand, no surge
        if (demandRatio < 1.5)  return 1.2;  // slightly more demand
        if (demandRatio < 2.0)  return 1.5;  // moderate surge
        if (demandRatio < 3.0)  return 2.0;  // high demand (rush hour, rain)
        return 3.0;                           // extreme demand, hard cap
    }


    // ── ZONE KEY ──────────────────────────────────────────────────────
    // We create a grid of 3km × 3km cells.
    // All coordinates that round to the same cell share the same surge.
    // 0.03 degrees ≈ 3.3km at Delhi's latitude — good enough for city zones.
    private String createZoneKey(Double lat, Double lng) {
        long latZone = Math.round(lat / 0.03);
        long lngZone = Math.round(lng / 0.03);
        return latZone + ":" + lngZone;
    }


    // Called by the fare calculator to apply surge to the base fare
    public BigDecimal applysurge(BigDecimal baseFare, BigDecimal surgeMultiplier) {
        return baseFare.multiply(surgeMultiplier).setScale(2, RoundingMode.HALF_UP);
    }




}
