package com.rideapp.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DriverAvailabilityResponse {
    private boolean online;
    private Double latitude;
    private Double longitude;
    private LocalDateTime updatedAt;
}
