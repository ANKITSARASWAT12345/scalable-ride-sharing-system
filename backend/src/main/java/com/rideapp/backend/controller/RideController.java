package com.rideapp.backend.controller;


import com.rideapp.backend.dto.request.BookRideRequest;
import com.rideapp.backend.dto.response.RideResponse;
import com.rideapp.backend.model.RideStatus;
import com.rideapp.backend.service.RideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideService rideService;


    @PostMapping("/book")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<RideResponse>  bookRide(

            @Valid @RequestBody BookRideRequest request,
            @AuthenticationPrincipal UserDetails userDetails){
        return ResponseEntity.ok(rideService.bookRide(request,userDetails.getUsername()));
    }


    @GetMapping("/my-rides")
    @PreAuthorize("hasRole('RIDER')")
    public ResponseEntity<List<RideResponse>> getMyRides(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(rideService.getRiderHistory(userDetails.getUsername()));
    }


    @PostMapping("/{rideId}/cancel")
    public ResponseEntity<RideResponse> cancelRide(
            @PathVariable UUID rideId,
            @RequestParam(defaultValue = "Cancelled by user") String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(rideService.cancelRide(rideId, userDetails.getUsername(), reason));
    }

    @GetMapping("/{rideId}")
    public ResponseEntity<RideResponse> getRide(@PathVariable UUID rideId) {
        return ResponseEntity.ok(rideService.getRide(rideId));
    }

    //===driver endpoints


    @GetMapping("/available")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<RideResponse>> getAvailableRides(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(rideService.getAvailableRides(userDetails.getUsername()));
    }



    @PostMapping("/{rideId}/accept")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<RideResponse> acceptRide(
            @PathVariable UUID rideId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(rideService.acceptRide(rideId, userDetails.getUsername()));
    }


    @PatchMapping("/{rideId}/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<RideResponse> updateStatus(
            @PathVariable UUID rideId,
            @RequestParam RideStatus status,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                rideService.updateRideStatus(rideId, status, userDetails.getUsername())
        );
    }



    @GetMapping("/my-trips")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<RideResponse>> getDriverTrips(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(rideService.getDriverHistory(userDetails.getUsername()));
    }


}
