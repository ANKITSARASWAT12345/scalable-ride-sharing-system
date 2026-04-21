package com.rideapp.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentOrderResponse {
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private String keyId;      // Angular needs this to open Razorpay
    private String userName;
    private String userEmail;
    private String userPhone;
}