package com.rideapp.backend.dto.response;

import com.rideapp.backend.model.VehicleType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class NearbyDriverResponse {
    private UUID driverId;
    private String driverName;
    private Double latitude;
    private Double longitude;
    private VehicleType vehicleType;
    private BigDecimal rating;
    private BigDecimal distanceKm;
    private Integer etaMinutes;
}
