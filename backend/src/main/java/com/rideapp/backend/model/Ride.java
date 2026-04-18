package com.rideapp.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="rides")

public class Ride {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="rider_id", nullable = false)
    private User rider;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="driver_id")
    private User driver;


    @Column(name="pickup_address", nullable = false)
    private String pickupAddress;


    @Column(name="drop_address", nullable = false)
    private String dropAddress;

    @Column(name="pickup_lng", nullable = false)
    private Double pickupLng;

    @Column(name="pickup_lat", nullable = false)
    private Double pickupLat;


    @Column(name="drop_lng", nullable = false)
    private Double dropLng;

    @Column(name="drop_lat", nullable = false)
    private Double dropLat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RideStatus status;

    @Column(precision = 10, scale = 2)
    private BigDecimal fare;

    @Column(name="distance_km", precision = 6, scale = 2)
    private BigDecimal distanceKm;

    @Enumerated(EnumType.STRING)
    @Column(name="vehicle_type")
    private VehicleType vehicleType;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "surge_multiplier", precision = 4, scale = 2)
    private BigDecimal surgeMultiplier = BigDecimal.ONE;

    @Column(name = "eta_minutes")
    private Integer etaMinutes;

    @PrePersist
    protected  void Oncreate(){
        requestedAt= LocalDateTime.now();
    }

}
