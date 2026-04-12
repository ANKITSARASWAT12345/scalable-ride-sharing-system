package com.rideapp.backend.dto.request;


import com.rideapp.backend.model.VehicleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookRideRequest {

    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    @NotNull(message = "Pickup latitude is required")
    private Double pickupLat;

    @NotNull(message = "Pickup longitude is required")
    private Double pickupLng;

    @NotBlank(message = "Drop address is required")
    private String dropAddress;

    @NotNull(message = "Drop latitude is required")
    private Double dropLat;

    @NotNull(message = "Drop longitude is required")
    private Double dropLng;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;
}
