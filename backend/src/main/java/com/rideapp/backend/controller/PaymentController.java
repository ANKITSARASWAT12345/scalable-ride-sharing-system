package com.rideapp.backend.controller;


import com.rideapp.backend.dto.request.CreatePaymentOrderRequest;
import com.rideapp.backend.dto.response.PaymentOrderResponse;
import com.rideapp.backend.dto.response.WalletResponse;
import com.rideapp.backend.model.User;
import com.rideapp.backend.model.Wallet;
import com.rideapp.backend.repository.UserRepository;
import com.rideapp.backend.service.PaymentService;
import com.rideapp.backend.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {


    private final PaymentService paymentService;
    private final WalletService walletService;
    private final UserRepository userRepository;

    // Step 1: Angular requests an order ID before showing payment UI
    @PostMapping("/create-order")
    public ResponseEntity<PaymentOrderResponse> createOrder(
            @Valid @RequestBody CreatePaymentOrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {
        return ResponseEntity.ok(
                paymentService.createOrder(request, userDetails.getUsername())
        );
    }

    // Step 2: Angular calls this after user successfully pays
    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        paymentService.verifyAndCompletePayment(
                body.get("razorpay_order_id"),
                body.get("razorpay_payment_id"),
                body.get("razorpay_signature"),
                userDetails.getUsername()
        );
        return ResponseEntity.ok(Map.of("message", "Payment verified successfully"));
    }



    // Razorpay calls this directly (no user auth — uses signature verification instead)
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    // Get wallet balance
    @GetMapping("/wallet")
    public ResponseEntity<WalletResponse> getWallet(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Wallet wallet = walletService.getWallet(user);
        return ResponseEntity.ok(WalletResponse.builder()
                .userId(user.getId().toString())
                .balance(wallet.getBalance())
                .totalEarned(wallet.getTotalEarned())
                .totalSpent(wallet.getTotalSpent())
                .build()
        );
    }


}
