package com.rideapp.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class SubmitRatingRequest {
    @NotNull
    private UUID rideId;
    @Min(1) @Max(5) private int stars;
    @Size(max = 500) private String comment;
}


