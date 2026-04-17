package com.rideapp.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealTimeService {

    private final SimpMessagingTemplate messagingTemplate;

    // 🔧 helper method to avoid ambiguity issue in Spring Boot 4
    private void send(String destination, Object payload) {
        messagingTemplate.convertAndSend((String) destination, (Object) payload);
    }

    // 🚗 Called when driver updates location
    public void broadcastDriverLocation(UUID rideId, Double lat, Double lng, UUID driverId) {

        if (rideId == null || lat == null || lng == null || driverId == null) {
            log.warn("Invalid driver location data. rideId={}, lat={}, lng={}, driverId={}",
                    rideId, lat, lng, driverId);
            return;
        }

        final String destination = "/topic/ride/" + rideId + "/driver-location";

        Map<String, Object> payload = new HashMap<>();
        payload.put("driverId", driverId.toString());
        payload.put("latitude", lat);
        payload.put("longitude", lng);
        payload.put("timestamp", System.currentTimeMillis());

        send(destination, payload);

        log.debug("Broadcasted driver location for ride {}: ({}, {})",
                rideId, lat, lng);
    }

    // 🚦 Ride status updates
    public void broadcastRideStatusUpdate(UUID rideId, String status, Map<String, String> extraData) {

        if (rideId == null || status == null) {
            log.warn("Invalid ride status update. rideId={}, status={}", rideId, status);
            return;
        }

        final String destination = "/topic/ride/" + rideId + "/status";

        Map<String, Object> payload = new HashMap<>();

        if (extraData != null) {
            payload.putAll(extraData);
        }

        payload.put("rideId", rideId.toString());
        payload.put("status", status);
        payload.put("timestamp", System.currentTimeMillis());

        send(destination, payload);

        log.info("Broadcasted status update for ride {}: {}", rideId, status);
    }

    // 📢 Notify drivers in a zone about new ride
    public void notifyDriversNewRide(String zoneId, Object rideData) {

        if (zoneId == null || rideData == null) {
            log.warn("Invalid new ride notification. zoneId={}, rideData={}", zoneId, rideData);
            return;
        }

        final String destination = "/topic/zone/" + zoneId + "/new-ride";

        send(destination, rideData);

        log.info("Notified zone {} of new ride request", zoneId);
    }

    // 🔔 Private notification
    public void sendPrivateNotification(String username, String type, Object data) {

        if (username == null || type == null) {
            log.warn("Invalid private notification. username={}, type={}", username, type);
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("data", data);
        payload.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSendToUser(
                username, // ⚠️ must match authenticated principal
                "/queue/notifications",
                payload
        );

        log.debug("Sent private notification to {} of type {}", username, type);
    }
}