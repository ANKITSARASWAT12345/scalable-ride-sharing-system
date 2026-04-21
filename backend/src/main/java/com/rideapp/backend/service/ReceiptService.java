package com.rideapp.backend.service;


import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.rideapp.backend.model.Payment;
import com.rideapp.backend.model.Ride;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.util.http.fileupload.ByteArrayOutputStream;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReceiptService {


    private final NotificationService notificationService;

    public void generateAndSendReceipt(Ride ride, Payment payment) {
        try {
            byte[] pdfBytes = generatePdf(ride, payment);
            notificationService.sendRideReceiptEmail(
                    ride.getRider(), ride, payment, pdfBytes
            );
        } catch (Exception e) {
            // Don't fail the whole ride completion if receipt fails
            log.error("Failed to generate receipt for ride {}: {}", ride.getId(), e.getMessage());
        }
    }

    private byte[] generatePdf(Ride ride, Payment payment) throws Exception {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        document.open();

        // Title
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD,
                new BaseColor(108, 99, 255));
        Paragraph title = new Paragraph("⚡ RideApp Receipt", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(Chunk.NEWLINE);


        // Ride details table
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);

        addTableRow(table, "Ride ID",         ride.getId().toString().substring(0, 8).toUpperCase());
        addTableRow(table, "Date",            ride.getRequestedAt().format(
                DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")));
        addTableRow(table, "From",            ride.getPickupAddress());
        addTableRow(table, "To",              ride.getDropAddress());
        addTableRow(table, "Distance",        ride.getDistanceKm() + " km");
        addTableRow(table, "Vehicle",         ride.getVehicleType().name());
        addTableRow(table, "Driver",          ride.getDriver().getName());
        addTableRow(table, "Base fare",
                "₹" + payment.getAmount().subtract(payment.getAmount()
                        .multiply(ride.getSurgeMultiplier().subtract(java.math.BigDecimal.ONE))));

        if (ride.getSurgeMultiplier().compareTo(java.math.BigDecimal.ONE) > 0) {
            addTableRow(table, "Surge multiplier", ride.getSurgeMultiplier() + "×");
        }
        addTableRow(table, "Total paid",      "₹" + payment.getAmount());
        addTableRow(table, "Payment method",  payment.getMethod().name());
        addTableRow(table, "Status",          "PAID ✓");

        document.add(table);
        document.add(Chunk.NEWLINE);

        // Footer
        Font footerFont = new Font(Font.FontFamily.HELVETICA, 9, Font.ITALIC,
                BaseColor.GRAY);
        document.add(new Paragraph("Thank you for riding with RideApp!", footerFont));

        document.close();
        return baos.toByteArray();
    }


    private void addTableRow(PdfPTable table, String label, String value) {
        Font labelFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        Font valueFont = new Font(Font.FontFamily.HELVETICA, 10);

        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        labelCell.setBorder(Rectangle.BOTTOM);
        valueCell.setBorder(Rectangle.BOTTOM);
        labelCell.setPadding(8);
        valueCell.setPadding(8);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }


}
