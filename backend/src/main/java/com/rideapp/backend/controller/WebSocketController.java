package com.rideapp.backend.controller;


import com.rideapp.backend.dto.request.UpdateLocationRequest;
import com.rideapp.backend.service.DriverLocationService;
import com.rideapp.backend.service.RealTimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final DriverLocationService driverLocationService;
    private final RealTimeService realTimeService;

    @MessageMapping("/driver.location")


    public void handleDriverLocation(@Payload Map<String,Object> payload, Principal principal){

        String  driverEmail= principal.getName();

        Double lat= Double.valueOf(payload.get("latitude").toString());
        Double lng=Double.valueOf(payload.get("longitutde").toString());
        String rideIdStr = payload.get("rideId").toString();

        // 1. persist the new location to database
        UpdateLocationRequest locationReq = new UpdateLocationRequest();
        locationReq.setLatitude(lat);
        locationReq.setLongitude(lng);
        locationReq.setIsAvailable(false); // driver is in a ride, not available
        driverLocationService.updateLocation(locationReq, driverEmail);

        // 2. broadcast to the rider watching this ride in real-time
        UUID rideId = UUID.fromString(rideIdStr);
        UUID driverId = UUID.fromString(payload.get("driverId").toString());
        realTimeService.broadcastDriverLocation(rideId, lat, lng, driverId);



    }

    @MessageMapping("/driver.heartbeat")
    public void handleHeartbeat(Principal principal) {
        log.debug("Heartbeat from driver: {}", principal.getName());
    }
}
