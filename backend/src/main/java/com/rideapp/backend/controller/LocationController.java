package com.rideapp.backend.controller;

import com.rideapp.backend.dto.response.LocationSuggestionResponse;
import com.rideapp.backend.service.LocationDiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationDiscoveryService locationDiscoveryService;

    @GetMapping("/featured")
    public ResponseEntity<List<LocationSuggestionResponse>> getFeaturedLocations() {
        return ResponseEntity.ok(locationDiscoveryService.getFeaturedLocations());
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<LocationSuggestionResponse>> searchSuggestions(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "8") Integer limit
    ) {
        return ResponseEntity.ok(locationDiscoveryService.searchSuggestions(query, limit));
    }
}
