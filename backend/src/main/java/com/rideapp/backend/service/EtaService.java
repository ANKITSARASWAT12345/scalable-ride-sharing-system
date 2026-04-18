package com.rideapp.backend.service;


import com.rideapp.backend.model.VehicleType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalTime;

@RequiredArgsConstructor
@Service
public class EtaService {

    private final FareCalculatorService fareCalculatorService;



    // Average speeds in km/h for each vehicle type in Indian city traffic
    // These are conservative estimates — better safe than optimistic
    private static final double BIKE_AVG_SPEED_KMH = 25.0;
    private static final double AUTO_AVG_SPEED_KMH = 20.0;
    private static final double CAR_AVG_SPEED_KMH  = 22.0;


    // Roads are never straight. A 2km straight-line distance is ~2.6km by road.
    // This factor (called "circuity factor") is empirically measured for Indian cities.
    private static final double ROAD_CIRCUITY_FACTOR = 1.3;



    public int calculateEtaMinutes(
            Double driverLat, Double driverLng,
            Double pickupLat, Double pickupLng,
            VehicleType vehicleType){

        // Step 1: straight-line distance using Haversine
        BigDecimal straightLineKm = fareCalculatorService.calculateDistance(
                driverLat, driverLng, pickupLat, pickupLng
        );

        // Step 2: estimate actual road distance
        double roadDistanceKm = straightLineKm.doubleValue() * ROAD_CIRCUITY_FACTOR;

        // Step 3: get vehicle's average speed
        double avgSpeedKmh = getAverageSpeed(vehicleType);

        // Step 4: get time-of-day traffic multiplier
        double trafficMultiplier = getTrafficMultiplier(LocalTime.now());

        // Step 5: calculate ETA
        // time = distance / speed   (in hours)
        // convert to minutes × traffic multiplier
        double etaHours   = roadDistanceKm / avgSpeedKmh;
        double etaMinutes = etaHours * 60 * trafficMultiplier;

        // Minimum 1 minute, round up
        int result = (int) Math.max(1, Math.ceil(etaMinutes));

        return result;
    }

    // ── TRAFFIC MULTIPLIER ────────────────────────────────────────────
    // Based on typical Delhi/Mumbai traffic patterns
    // 1.0 = normal speed, 1.6 = 60% slower than normal
    private double getTrafficMultiplier(LocalTime time) {
        int hour = time.getHour();

        if (hour >= 8 && hour < 11)  return 1.6; // morning rush hour
        if (hour >= 17 && hour < 21) return 1.6; // evening rush hour
        if (hour >= 11 && hour < 17) return 1.2; // afternoon, moderate
        if (hour >= 21 || hour < 6)  return 1.0; // late night, free flowing
        return 1.1; // early morning (6–8am), light traffic
    }


    // ── VEHICLE SPEEDS ────────────────────────────────────────────────
    private double getAverageSpeed(VehicleType type) {
        return switch (type) {
            case BIKE -> BIKE_AVG_SPEED_KMH; // bikes weave through traffic
            case AUTO -> AUTO_AVG_SPEED_KMH; // autos slower, smaller roads
            case CAR -> CAR_AVG_SPEED_KMH;  // cars faster on main roads
        };
    }


}
