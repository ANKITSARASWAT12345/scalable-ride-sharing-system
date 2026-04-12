package com.rideapp.backend.dto.response;


import com.rideapp.backend.model.RideStatus;
import com.rideapp.backend.model.VehicleType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RideResponse   {
    private UUID id;
    private UUID riderId;
    private String riderName;
    private UUID driverId;
    private String driverName;
    private String driverPhone;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private String dropAddress;
    private Double dropLat;
    private Double dropLng;
    private RideStatus status;
    private BigDecimal fare;
    private BigDecimal distanceKm;
    private VehicleType vehicleType;
    private LocalDateTime requestedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime completedAt;
}
