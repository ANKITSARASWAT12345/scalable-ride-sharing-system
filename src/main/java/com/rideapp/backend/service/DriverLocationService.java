package com.rideapp.backend.service;


import com.rideapp.backend.dto.request.UpdateLocationRequest;
import com.rideapp.backend.model.DriverLocation;
import com.rideapp.backend.model.User;
import com.rideapp.backend.repository.DriverLocationRepository;
import com.rideapp.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DriverLocationService {


    private final DriverLocationRepository driverLocationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void updateLocation(UpdateLocationRequest request, String driverEmail) {
        User driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Driver not found"));

        // upsert — create if doesn't exist, update if it does
        DriverLocation location = driverLocationRepository
                .findByDriver(driver)
                .orElse(DriverLocation.builder().driver(driver).build());

        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setAvailable(request.getIsAvailable());

        driverLocationRepository.save(location);
    }
}
