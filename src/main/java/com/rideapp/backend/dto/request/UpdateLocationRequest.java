package com.rideapp.backend.dto.request;


import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateLocationRequest {

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotNull
    private Boolean isAvailable;
}
