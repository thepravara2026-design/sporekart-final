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

public class InvoicePdfGenerator {

    public static byte[] generateInvoicePdf(Order order) {
        OrderAddressSnapshot addr = OrderAddressSnapshot.fromJson(order.getShippingAddressJson());
        String invoiceDate = order.getCreatedAt() != null 
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy"))
                : "N/A";

        StringBuilder content = new StringBuilder();

        // Header Section
        content.append("BT /F1 18 Tf 50 750 Td (SPOREKART INDIA - TAX INVOICE) Tj ET\n");
        content.append("BT /F1 10 Tf 50 735 Td (GSTIN: 27AABCU9639R1ZM | Agronomist Mushroom E-Commerce) Tj ET\n");
        content.append("BT /F1 10 Tf 50 722 Td (Website: https://sporekart.in | Support: care@sporekart.in) Tj ET\n");
        
        content.append("50 710 m 545 710 l S\n");

        // Order & Customer Details
        content.append("BT /F1 11 Tf 50 690 Td (Invoice Details) Tj ET\n");
        content.append("BT /F1 10 Tf 50 675 Td (Order Number: ").append(sanitize(order.getOrderNumber())).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 50 662 Td (Date: ").append(sanitize(invoiceDate)).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 50 649 Td (Status: ").append(sanitize(order.getStatus().name())).append(") Tj ET\n");

        content.append("BT /F1 11 Tf 320 690 Td (Billed / Shipped To) Tj ET\n");
        content.append("BT /F1 10 Tf 320 675 Td (Recipient: ").append(sanitize(addr.getRecipientName())).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 320 662 Td (Phone: ").append(sanitize(addr.getPhone())).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 320 649 Td (Address: ").append(sanitize(addr.getLine1())).append(") Tj ET\n");
        content.append("BT /F1 10 Tf 320 636 Td (").append(sanitize(addr.getCity())).append(", ").append(sanitize(addr.getState())).append(" - ").append(sanitize(addr.getPincode())).append(") Tj ET\n");

        content.append("50 620 m 545 620 l S\n");

        // Items Table Header
        content.append("BT /F1 10 Tf 50 600 Td (Item Description) Tj ET\n");
        content.append("BT /F1 10 Tf 280 600 Td (SKU) Tj ET\n");
        content.append("BT /F1 10 Tf 380 600 Td (Qty) Tj ET\n");
        content.append("BT /F1 10 Tf 430 600 Td (Unit Price) Tj ET\n");
        content.append("BT /F1 10 Tf 490 600 Td (Total INR) Tj ET\n");

        content.append("50 592 m 545 592 l S\n");

        // Line Items
        int y = 575;
        for (OrderItem item : order.getItems()) {
            if (y < 150) break; // page limit check
            String title = item.getProductTitle() + " (" + item.getVariantName() + ")";
            if (title.length() > 35) title = title.substring(0, 32) + "...";

            content.append("BT /F1 9 Tf 50 ").append(y).append(" Td (").append(sanitize(title)).append(") Tj ET\n");
            content.append("BT /F1 9 Tf 280 ").append(y).append(" Td (").append(sanitize(item.getSku())).append(") Tj ET\n");
            content.append("BT /F1 9 Tf 385 ").append(y).append(" Td (").append(item.getQuantity()).append(") Tj ET\n");
            content.append("BT /F1 9 Tf 430 ").append(y).append(" Td (Rs. ").append(item.getPriceInr()).append(") Tj ET\n");
            content.append("BT /F1 9 Tf 490 ").append(y).append(" Td (Rs. ").append(item.getLineTotalInr()).append(") Tj ET\n");
            y -= 20;
        }

        content.append("50 ").append(y + 5).append(" m 545 ").append(y + 5).append(" l S\n");

        // Payment Summary
        int sumY = y - 15;
        content.append("BT /F1 10 Tf 350 ").append(sumY).append(" Td (Subtotal: Rs. ").append(order.getSubtotalAmountInr()).append(") Tj ET\n");
        sumY -= 15;
        content.append("BT /F1 10 Tf 350 ").append(sumY).append(" Td (GST (5%): Rs. ").append(order.getGstTotalAmountInr()).append(") Tj ET\n");
        sumY -= 15;
        content.append("BT /F1 10 Tf 350 ").append(sumY).append(" Td (Shipping: FREE) Tj ET\n");
        sumY -= 18;
        content.append("50 ").append(sumY + 12).append(" m 545 ").append(sumY + 12).append(" l S\n");
        content.append("BT /F1 12 Tf 350 ").append(sumY).append(" Td (Grand Total: Rs. ").append(order.getTotalAmountInr()).append(") Tj ET\n");

        // Footer Signatory
        content.append("50 80 m 545 80 l S\n");
        content.append("BT /F1 8 Tf 50 65 Td (This is a computer-generated tax invoice issued by Sporekart India. No physical signature required.) Tj ET\n");

        return assemblePdfDocument(content.toString());
    }

    private static String sanitize(String str) {
        if (str == null) return "";
        return str.replace("(", "\\(").replace(")", "\\)").replace("\\", "\\\\");
    }

    private static byte[] assemblePdfDocument(String streamContent) {
        byte[] contentBytes = streamContent.getBytes(StandardCharsets.ISO_8859_1);
        
        List<String> objects = new ArrayList<>();
        objects.add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        objects.add("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        objects.add("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
        objects.add("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
        objects.add("5 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n" + streamContent + "\nendstream\nendobj\n");

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            baos.write("%PDF-1.4\n".getBytes(StandardCharsets.ISO_8859_1));
            List<Long> offsets = new ArrayList<>();
            long offset = "%PDF-1.4\n".getBytes(StandardCharsets.ISO_8859_1).length;

            for (String obj : objects) {
                offsets.add(offset);
                byte[] b = obj.getBytes(StandardCharsets.ISO_8859_1);
                baos.write(b);
                offset += b.length;
            }

            long xrefOffset = offset;
            StringBuilder xref = new StringBuilder();
            xref.append("xref\n0 ").append(objects.size() + 1).append("\n");
            xref.append("0000000000 65535 f \n");
            for (Long off : offsets) {
                xref.append(String.format("%010d 00000 n \n", off));
            }
            xref.append("trailer\n<< /Size ").append(objects.size() + 1).append(" /Root 1 0 R >>\n");
            xref.append("startxref\n").append(xrefOffset).append("\n%%EOF\n");

            baos.write(xref.toString().getBytes(StandardCharsets.ISO_8859_1));
        } catch (IOException e) {
            throw new RuntimeException("Error assembling PDF", e);
        }

        return baos.toByteArray();
    }
}
