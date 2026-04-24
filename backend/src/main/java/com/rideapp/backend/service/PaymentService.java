package com.rideapp.backend.service;


import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.rideapp.backend.dto.request.CreatePaymentOrderRequest;
import com.rideapp.backend.dto.response.PaymentOrderResponse;
import com.rideapp.backend.model.*;
import com.rideapp.backend.repository.PaymentRepository;
import com.rideapp.backend.repository.RideRepository;
import com.rideapp.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final ReceiptService receiptService;
    private final NotificationService notificationService;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Value("${app.platform.commission-rate}")
    private double commissionRate;



    // ── Step 1: Create Razorpay order (Angular calls this first) ─────
    // Angular can't directly charge the user — it needs an order ID from our server.
    // This is for security — amount and currency must come from our backend.
    public PaymentOrderResponse createOrder(CreatePaymentOrderRequest request, String userEmail)
            throws RazorpayException {

        User user = getUserByEmail(userEmail);
        RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

        // Amount in paise (₹100 = 10000 paise) — Razorpay requires smallest unit
        int amountInPaise = request.getAmount().multiply(BigDecimal.valueOf(100)).intValue();


        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount",   amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt",  "receipt_" + System.currentTimeMillis());
        orderRequest.put("notes",    new JSONObject()
                .put("userId",  user.getId().toString())
                .put("purpose", request.getPurpose())  // "WALLET_TOPUP" or "RIDE_PAYMENT"
        );

        Order order = client.orders.create(orderRequest);

        log.info("Razorpay order created: orderId={}, amount={}", order.get("id"), amountInPaise);

        return PaymentOrderResponse.builder()
                .orderId(order.get("id"))
                .amount(request.getAmount())
                .currency("INR")
                .keyId(razorpayKeyId)   // Angular needs this to open the payment UI
                .userName(user.getName())
                .userEmail(user.getEmail())
                .userPhone(user.getPhone())
                .build();
    }



    // ── Step 2: Verify payment signature (called after user pays) ────
    // Razorpay sends 3 things: orderId, paymentId, signature
    // We must verify the signature using HMAC-SHA256 to confirm it's genuine
    // and hasn't been tampered with.
    @Transactional
    public void verifyAndCompletePayment(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature,
            String userEmail) {


        // SIGNATURE VERIFICATION — this is the security step
        // If the signature doesn't match, someone is trying to fake a payment
        if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            throw new SecurityException("Invalid payment signature — possible fraud attempt");
        }

        User user = getUserByEmail(userEmail);

        // Find what this payment was for (from the order notes we set in step 1)
        // For now, treat all verified payments as wallet top-ups
        // For ride payments, you'd lookup the order and check the purpose field

        RazorpayClient client;
        try {
            client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            com.razorpay.Payment payment = client.payments.fetch(razorpayPaymentId);
            int amountPaise = payment.get("amount");
            BigDecimal amount = BigDecimal.valueOf(amountPaise).divide(BigDecimal.valueOf(100));

            walletService.topUp(user, amount, razorpayPaymentId);
            notificationService.sendWalletTopUpEmail(user, amount);

        } catch (RazorpayException e) {
            throw new RuntimeException("Payment verification failed: " + e.getMessage());
        }
    }


    // ── Webhook: Razorpay calls this asynchronously ───────────────────
    // Even if Angular closes, Razorpay still calls this to confirm payment.
    // This is the most reliable way to handle payment confirmation.
    @Transactional
    public void handleWebhook(String payload, String razorpaySignature) {
        // Verify the webhook signature using your Razorpay webhook secret
        // (separate from API key secret — set this in Razorpay dashboard)
        log.info("Razorpay webhook received");

        JSONObject webhookBody = new JSONObject(payload);
        String event = webhookBody.getString("event");


        if ("payment.captured".equals(event)) {
            JSONObject paymentEntity = webhookBody
                    .getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String paymentId = paymentEntity.getString("id");
            String orderId   = paymentEntity.getString("order_id");
            int amountPaise  = paymentEntity.getInt("amount");
            BigDecimal amount = BigDecimal.valueOf(amountPaise).divide(BigDecimal.valueOf(100));

            log.info("Payment captured: paymentId={}, orderId={}, amount={}", paymentId, orderId, amount);
            // Additional processing based on order purpose goes here
        }
    }


    // ── Process wallet payment for completed ride ─────────────────────
    @Transactional
    public Wallet topUpWallet(User user, BigDecimal amount) {
        Wallet wallet = walletService.topUp(user, amount, "MANUAL_TOPUP_" + System.currentTimeMillis());
        notificationService.sendWalletTopUpEmail(user, amount);
        return wallet;
    }

    @Transactional
    public Payment processWalletPaymentForRide(Ride ride) {
        User rider  = ride.getRider();
        User driver = ride.getDriver();
        BigDecimal fare = ride.getFare();
        BigDecimal commission = fare.multiply(BigDecimal.valueOf(commissionRate));
        BigDecimal driverEarning = fare.subtract(commission);

        // Deduct from rider, credit to driver
        walletService.processRidePayment(ride, rider, driver);

        // Record the payment
        Payment payment = Payment.builder()
                .ride(ride)
                .rider(rider)
                .amount(fare)
                .platformCommission(commission)
                .driverEarning(driverEarning)
                .method(PaymentMethod.WALLET)
                .status(PaymentStatus.COMPLETED)
                .completedAt(LocalDateTime.now())
                .build();

        Payment saved = paymentRepository.save(payment);

        // Send receipt email and generate PDF
        receiptService.generateAndSendReceipt(ride, saved);

        return saved;
    }



    // ── HMAC-SHA256 Signature Verification ───────────────────────────
    // This is the cryptographic security of the payment system.
    // Razorpay generates: HMAC_SHA256(orderId + "|" + paymentId, keySecret)
    // We must compute the same and compare. If they match, payment is genuine.
    private boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String data = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String computedSignature = HexFormat.of().formatHex(hash);
            return computedSignature.equals(signature);
        } catch (Exception e) {
            log.error("Signature verification failed", e);
            return false;
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}

