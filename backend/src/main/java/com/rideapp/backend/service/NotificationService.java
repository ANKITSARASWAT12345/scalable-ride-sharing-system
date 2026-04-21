package com.rideapp.backend.service;


import com.rideapp.backend.model.Payment;
import com.rideapp.backend.model.Ride;
import com.rideapp.backend.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {


    private final JavaMailSender mailSender;

    // @Async = sends email in background thread so ride completion isn't delayed
    @Async
    public void sendRideReceiptEmail(User rider, Ride ride, Payment payment, byte[] pdfBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(rider.getEmail());
            helper.setSubject("Your RideApp receipt — ₹" + payment.getAmount());
            helper.setText(buildReceiptEmailHtml(rider, ride, payment), true);


            // Attach PDF receipt
            helper.addAttachment("RideApp_Receipt.pdf",
                    new org.springframework.core.io.ByteArrayResource(pdfBytes));

            mailSender.send(message);
            log.info("Receipt email sent to {}", rider.getEmail());

        } catch (MessagingException e) {
            log.error("Failed to send receipt email to {}: {}", rider.getEmail(), e.getMessage());
        }
    }


    @Async
    public void sendWalletTopUpEmail(User user, BigDecimal amount) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject("Wallet topped up — ₹" + amount + " added");
            helper.setText(
                    "<h2>Hi " + user.getName() + ",</h2>" +
                            "<p>₹<strong>" + amount + "</strong> has been added to your RideApp wallet.</p>" +
                            "<p>Happy riding! ⚡</p>",
                    true
            );
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send top-up email: {}", e.getMessage());
        }
    }

    private String buildReceiptEmailHtml(User rider, Ride ride, Payment payment) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
                  <div style="background:#6c63ff;color:white;padding:24px;border-radius:12px 12px 0 0">
                    <h1 style="margin:0">⚡ RideApp</h1>
                    <p style="margin:8px 0 0;opacity:0.85">Your ride receipt</p>
                  </div>
                  <div style="background:#fff;border:1px solid #eee;padding:24px;border-radius:0 0 12px 12px">
                    <p>Hi <strong>%s</strong>,</p>
                    <p>Thanks for your ride! Here's your summary:</p>
                    <table style="width:100%%;border-collapse:collapse">
                      <tr><td style="padding:8px 0;color:#666">From</td><td><strong>%s</strong></td></tr>
                      <tr><td style="padding:8px 0;color:#666">To</td><td><strong>%s</strong></td></tr>
                      <tr><td style="padding:8px 0;color:#666">Distance</td><td>%s km</td></tr>
                      <tr><td style="padding:8px 0;color:#666">Driver</td><td>%s</td></tr>
                      <tr style="border-top:2px solid #6c63ff">
                        <td style="padding:12px 0;font-weight:bold;font-size:18px">Total</td>
                        <td style="font-weight:bold;font-size:18px;color:#6c63ff">₹%s</td>
                      </tr>
                    </table>
                    <p style="color:#999;font-size:12px;margin-top:24px">Receipt PDF attached.</p>
                  </div>
                </div>
                """.formatted(
                rider.getName(),
                ride.getPickupAddress(),
                ride.getDropAddress(),
                ride.getDistanceKm(),
                ride.getDriver().getName(),
                payment.getAmount()
        );
    }
}