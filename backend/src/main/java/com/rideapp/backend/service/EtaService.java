package com.rideapp.backend.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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




}
