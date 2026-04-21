package com.rideapp.backend.controller;


import com.rideapp.backend.dto.request.SubmitRatingRequest;
import com.rideapp.backend.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor

public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<Map<String, String>> submitRating(
            @Valid @RequestBody SubmitRatingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ratingService.submitRating(request, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Rating submitted successfully"));
    }
}
