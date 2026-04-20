package com.rideapp.backend.model;


import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@RequiredArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name="payments")
public class Payment {



    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="rider_id",unique = true, nullable = false)
    private Ride ride;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rider_id", nullable = false)
    private User rider;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "platform_commission", precision = 12, scale = 2)
    private BigDecimal platformCommission;

    @Column(name = "driver_earning", precision = 12, scale = 2)
    private BigDecimal driverEarning;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;     // WALLET, UPI, CARD, NET_BANKING, CASH

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;


    // Razorpay identifiers — stored for reconciliation and refunds
    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now();

    }


}
