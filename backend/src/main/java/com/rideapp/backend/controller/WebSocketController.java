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
    public void handleDriverLocation(@Payload Map<String, Object> payload, Principal principal) {
        if (principal == null) {
            log.warn("Rejected driver location update without an authenticated websocket principal");
            return;
        }

        String driverEmail = principal.getName();

        try {
            Double lat = getRequiredDouble(payload, "latitude");
            Double lng = getRequiredDouble(payload, "longitude", "longitutde");
            UUID rideId = getRequiredUuid(payload, "rideId");
            UUID driverId = getRequiredUuid(payload, "driverId");

            UpdateLocationRequest locationReq = new UpdateLocationRequest();
            locationReq.setLatitude(lat);
            locationReq.setLongitude(lng);
            locationReq.setIsAvailable(false);
            driverLocationService.updateLocation(locationReq, driverEmail);

            realTimeService.broadcastDriverLocation(rideId, lat, lng, driverId);
        } catch (IllegalArgumentException ex) {
            log.warn("Rejected invalid driver location payload from {}: {} payload={}",
                    driverEmail, ex.getMessage(), payload);
        }
    }

    @MessageMapping("/driver.heartbeat")
    public void handleHeartbeat(Principal principal) {
        if (principal == null) {
            log.debug("Heartbeat received from unauthenticated websocket session");
            return;
        }

        log.debug("Heartbeat from driver: {}", principal.getName());
    }

    private Double getRequiredDouble(Map<String, Object> payload, String... keys) {
        Object rawValue = getRequiredValue(payload, keys);
        try {
            return Double.valueOf(rawValue.toString());
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid number for field '" + keys[0] + "'");
        }
    }

    private UUID getRequiredUuid(Map<String, Object> payload, String key) {
        Object rawValue = getRequiredValue(payload, key);
        try {
            return UUID.fromString(rawValue.toString());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid UUID for field '" + key + "'");
        }
    }

    private Object getRequiredValue(Map<String, Object> payload, String... keys) {
        if (payload == null) {
            throw new IllegalArgumentException("Payload is required");
        }

        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null) {
                return value;
            }
        }

        throw new IllegalArgumentException("Missing required field '" + keys[0] + "'");
    }
}
