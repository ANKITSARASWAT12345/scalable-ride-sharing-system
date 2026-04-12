package com.rideapp.backend.controller;


import com.rideapp.backend.dto.request.UpdateLocationRequest;
import com.rideapp.backend.service.DriverLocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
public class DriverController {

    private final DriverLocationService driverLocationService;



    @PutMapping("/location")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Void> updateLocation(
            @Valid @RequestBody UpdateLocationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        driverLocationService.updateLocation(request, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
