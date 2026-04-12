package com.rideapp.backend.service;


import com.rideapp.backend.model.VehicleType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class FareCalculatorService {


    //Base Fares
    private static final BigDecimal BIKE_BASE_FARE    = new BigDecimal("20.00");
    private static final BigDecimal AUTO_BASE_FARE    = new BigDecimal("30.00");
    private static final BigDecimal CAR_BASE_FARE     = new BigDecimal("50.00");


    //Per-km rates
    private static final BigDecimal BIKE_PER_KM      = new BigDecimal("8.00");
    private static final BigDecimal AUTO_PER_KM      = new BigDecimal("12.00");
    private static final BigDecimal CAR_PER_KM       = new BigDecimal("18.00");


    //Minimum Fares
    private static final BigDecimal BIKE_MIN_FARE    = new BigDecimal("30.00");
    private static final BigDecimal AUTO_MIN_FARE    = new BigDecimal("50.00");
    private static final BigDecimal CAR_MIN_FARE     = new BigDecimal("80.00");


    public BigDecimal calculate(VehicleType vehicleType, BigDecimal distanceKm){

        BigDecimal baseFare;
        BigDecimal perKmRates;
        BigDecimal minimumFare;

        switch (vehicleType) {
            case BIKE -> {
                baseFare = BIKE_BASE_FARE;
                perKmRates = BIKE_PER_KM;
                minimumFare = BIKE_MIN_FARE;
            }
            case AUTO -> {
                baseFare = AUTO_BASE_FARE;
                perKmRates = AUTO_PER_KM;
                minimumFare = AUTO_MIN_FARE;
            }
            default -> {
                baseFare = CAR_BASE_FARE;
                perKmRates = CAR_PER_KM;
                minimumFare = CAR_MIN_FARE;
            }
        }

            BigDecimal calculatedFare = baseFare.add(distanceKm.multiply(perKmRates));

            BigDecimal finalFare = calculatedFare.max(minimumFare);

            return finalFare.setScale(2, RoundingMode.HALF_UP);

        }

    public BigDecimal calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        final int EARTH_RADIUS_KM = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distanceKm = EARTH_RADIUS_KM * c;

        return new BigDecimal(distanceKm).setScale(2, RoundingMode.HALF_UP);
      }
}

