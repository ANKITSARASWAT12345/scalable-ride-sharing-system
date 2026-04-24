package com.rideapp.backend.service;

import com.rideapp.backend.dto.response.LocationSuggestionResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class LocationDiscoveryService {

    private final List<LocationSuggestionResponse> featuredLocations = List.of(
            location("blr-koramangala", "Koramangala", "Bengaluru, Karnataka", 12.9352, 77.6245, "DISTRICT"),
            location("blr-airport", "Kempegowda International Airport", "Devanahalli, Bengaluru", 13.1986, 77.7066, "AIRPORT"),
            location("blr-whitefield", "Whitefield", "Bengaluru, Karnataka", 12.9698, 77.7499, "DISTRICT"),
            location("hyd-hitech", "HITEC City", "Hyderabad, Telangana", 17.4435, 78.3772, "DISTRICT"),
            location("hyd-airport", "Rajiv Gandhi International Airport", "Shamshabad, Hyderabad", 17.2403, 78.4294, "AIRPORT"),
            location("mum-bkc", "Bandra Kurla Complex", "Mumbai, Maharashtra", 19.0675, 72.8698, "BUSINESS_HUB"),
            location("mum-airport", "Chhatrapati Shivaji Maharaj International Airport", "Mumbai, Maharashtra", 19.0896, 72.8656, "AIRPORT"),
            location("del-cp", "Connaught Place", "New Delhi, Delhi", 28.6315, 77.2167, "BUSINESS_HUB"),
            location("del-airport", "Indira Gandhi International Airport", "New Delhi, Delhi", 28.5562, 77.1000, "AIRPORT"),
            location("pune-hinjewadi", "Hinjewadi IT Park", "Pune, Maharashtra", 18.5912, 73.7389, "TECH_PARK"),
            location("che-omr", "OMR", "Chennai, Tamil Nadu", 12.9121, 80.2279, "CORRIDOR"),
            location("kol-sector5", "Salt Lake Sector V", "Kolkata, West Bengal", 22.5760, 88.4310, "TECH_PARK")
    );

    public List<LocationSuggestionResponse> getFeaturedLocations() {
        return featuredLocations;
    }

    public List<LocationSuggestionResponse> searchSuggestions(String query, int limit) {
        String normalizedQuery = normalize(query);

        if (normalizedQuery.isBlank()) {
            return featuredLocations.stream()
                    .limit(Math.max(limit, 1))
                    .toList();
        }

        return featuredLocations.stream()
                .filter(location -> matches(location, normalizedQuery))
                .limit(Math.max(limit, 1))
                .toList();
    }

    private boolean matches(LocationSuggestionResponse location, String query) {
        return normalize(location.getTitle()).contains(query)
                || normalize(location.getSubtitle()).contains(query)
                || normalize(location.getType()).contains(query);
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private LocationSuggestionResponse location(
            String id,
            String title,
            String subtitle,
            double latitude,
            double longitude,
            String type
    ) {
        return LocationSuggestionResponse.builder()
                .id(id)
                .title(title)
                .subtitle(subtitle)
                .latitude(latitude)
                .longitude(longitude)
                .type(type)
                .build();
    }
}
