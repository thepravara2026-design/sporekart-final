package com.sporekart.order.application;

import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderAddressSnapshot;
import com.sporekart.order.domain.OrderItem;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class PackingSlipPdfGenerator {

    public static byte[] generatePackingSlipPdf(Order order) {
        OrderAddressSnapshot addr = OrderAddressSnapshot.fromJson(order.getShippingAddressJson());
        String orderDate = order.getCreatedAt() != null 
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm"))
                : "N/A";

        String courier = order.getCourierPartner() != null ? order.getCourierPartner() : "BlueDart Express";
        String awb = order.getTrackingNumber() != null ? order.getTrackingNumber() : ("AWB-897" + order.getId().toString().substring(0, 6).toUpperCase());

        StringBuilder content = new StringBuilder();

        // Header Section
        content.append("BT /F1 18 Tf 50 750 Td (SPOREKART AGRITECH - WAREHOUSE PACKING SLIP) Tj ET\n");
        content.append("BT /F1 10 Tf 50 735 Td (Order Manifest & Dispatch Inspection Checklist) Tj ET\n");
        content.append("BT /F1 10 Tf 50 722 Td (Fulfillment Hub: Solan, HP | Support: care@sporekart.in) Tj ET\n");
        
        content.append("50 710 m 545 710 l S\n");

        // Order & Courier Details
        content.append("BT /F1 11 Tf 50 690 Td (Order Details) Tj ET\n");
        content.append("BT /F1 10 Tf 50 675 Td (Order Number: ").append(sanitize(order.getOrderNumber())).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 50 662 Td (Date: ").append(sanitize(orderDate)).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 50 649 Td (Payment Status: ").append(sanitize(order.getStatus().name())).append(") Tj ET\n");

        content.append("BT /F1 11 Tf 320 690 Td (Shipment & Logistics) Tj ET\n");
        content.append("BT /F1 10 Tf 320 675 Td (Courier: ").append(sanitize(courier)).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 320 662 Td (AWB Code: ").append(sanitize(awb)).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 320 649 Td (Recipient: ").append(sanitize(addr.getRecipientName())).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 320 636 Td (Phone: ").append(sanitize(addr.getPhone())).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 320 623 Td (Address: ").append(sanitize(addr.getLine1())).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 320 610 Td (").append(sanitize(addr.getCity())).append(", ").append(sanitize(addr.getState())).append(" - ").append(sanitize(addr.getPincode())).append(") Tj ET\n");

        content.append("50 595 m 545 595 l S\n");

        // Items Table Header
        content.append("BT /F1 10 Tf 50 580 Td (Item Description) Tj ET\n");
        content.append("BT /F1 10 Tf 280 580 Td (SKU) Tj ET\n");
        content.append("BT /F1 10 Tf 380 580 Td (Quantity) Tj ET\n");
        content.append("BT /F1 10 Tf 460 580 Td (Pack Checked) Tj ET\n");

        content.append("50 572 m 545 572 l S\n");

        // Line Items
        int y = 555;
        for (OrderItem item : order.getItems()) {
            if (y < 150) break;
            String title = item.getProductTitle() + " (" + item.getVariantName() + ")";
            if (title.length() > 38) title = title.substring(0, 35) + "...";

            content.append("BT /F1 9 Tf 50 ").append(y).append(" Td (").append(sanitize(title)).append(") Tj ET\n");
            content.append("BT /F1 9 Tf 280 ").append(y).append(" Td (").append(sanitize(item.getSku())).append(") Tj ET\n");
            content.append("BT /F1 9 Tf 390 ").append(y).append(" Td (").append(item.getQuantity()).append(" Units) Tj ET\n");
            content.append("BT /F1 9 Tf 475 ").append(y).append(" Td ([  ] PASS) Tj ET\n");
            y -= 22;
        }

        content.append("50 ").append(y + 5).append(" m 545 ").append(y + 5).append(" l S\n");

        // Quality Inspection Checklist
        int checkY = y - 20;
        content.append("BT /F1 10 Tf 50 ").append(checkY).append(" Td (Quality Inspection & Verification:) Tj ET\n");
        checkY -= 15;
        content.append("BT /F1 9 Tf 50 ").append(checkY).append(" Td ([  ] Sealed Freshness Packaging Inspected  [  ] Cold Chain Insulation Verified) Tj ET\n");
        checkY -= 15;
        content.append("BT /F1 9 Tf 50 ").append(checkY).append(" Td ([  ] Agronomist Spawn Batch Certificate Attached) Tj ET\n");
        checkY -= 25;
        content.append("BT /F1 10 Tf 50 ").append(checkY).append(" Td (Packed By (Signature): ______________________   Date: _______________) Tj ET\n");

        return buildPdfBytes(content.toString());
    }

    private static String sanitize(String input) {
        if (input == null) return "";
        return input.replace("(", "\\(").replace(")", "\\)").replace("\\", "\\\\");
    }

    private static byte[] buildPdfBytes(String pdfContent) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            List<Long> xrefOffsets = new ArrayList<>();

            out.write("%PDF-1.4\n".getBytes(StandardCharsets.US_ASCII));

            // Catalog object 1
            xrefOffsets.add((long) out.size());
            out.write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Pages object 2
            xrefOffsets.add((long) out.size());
            out.write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Page object 3
            xrefOffsets.add((long) out.size());
            out.write("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Contents object 4
            byte[] contentBytes = pdfContent.getBytes(StandardCharsets.US_ASCII);
            xrefOffsets.add((long) out.size());
            out.write(("4 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n").getBytes(StandardCharsets.US_ASCII));
            out.write(contentBytes);
            out.write("\nendstream\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Font object 5
            xrefOffsets.add((long) out.size());
            out.write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // Cross-reference table
            long startxref = out.size();
            out.write("xref\n0 6\n0000000000 65535 f \n".getBytes(StandardCharsets.US_ASCII));
            for (Long offset : xrefOffsets) {
                out.write(String.format("%010d 00000 n \n", offset).getBytes(StandardCharsets.US_ASCII));
            }

            // Trailer
            out.write(("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + startxref + "\n%%EOF\n").getBytes(StandardCharsets.US_ASCII));

            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating packing slip PDF", e);
        }
    }
}
