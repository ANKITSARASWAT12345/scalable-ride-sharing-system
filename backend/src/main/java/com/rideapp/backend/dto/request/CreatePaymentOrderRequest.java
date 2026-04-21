package com.rideapp.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePaymentOrderRequest {
    @NotNull
    private BigDecimal amount;
    @NotNull private String purpose;   // "WALLET_TOPUP" or "RIDE_PAYMENT"
}


