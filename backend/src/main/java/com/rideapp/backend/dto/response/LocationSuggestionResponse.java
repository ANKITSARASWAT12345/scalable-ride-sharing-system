package com.rideapp.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LocationSuggestionResponse {
    private String id;
    private String title;
    private String subtitle;
    private Double latitude;
    private Double longitude;
    private String type;
}
