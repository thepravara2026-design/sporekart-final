package com.sporekart.notification.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sporekart.notification.domain.NotificationEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationTemplateService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public String buildHtmlEmail(NotificationEventType eventType, String payloadJson) {
        try {
            JsonNode data = objectMapper.readTree(payloadJson);
            String contentHtml = switch (eventType) {
                case ORDER_CONFIRMED, ORDER_PACKED -> buildOrderConfirmedBody(data);
                case ORDER_CANCELLED -> buildOrderCancelledBody(data);
                case SHIPMENT_HANDOVER, SHIPMENT_SHIPPED, SHIPMENT_IN_TRANSIT, SHIPMENT_OUT_FOR_DELIVERY -> buildShipmentBody(eventType, data);
                case ORDER_DELIVERED -> buildOrderDeliveredBody(data);
                case REFUND_INITIATED, REFUND_PROCESSING, REFUND_COMPLETED, REFUND_FAILED -> buildRefundBody(eventType, data);
                case ENROLLMENT_CONFIRMED -> buildEnrollmentConfirmedBody(data);
                case ENROLLMENT_CANCELLED -> buildEnrollmentCancelledBody(data);
                case WALLET_TOPUP_SUCCESS -> buildWalletTopupBody(data);
                case WALLET_REFUND_CREDIT -> buildWalletRefundCreditBody(data);
                case WALLET_PAYMENT_SUCCESS -> buildWalletPaymentBody(data);
                case WALLET_WITHDRAWAL_REQUESTED, WALLET_WITHDRAWAL_PROCESSING, WALLET_WITHDRAWAL_COMPLETED, WALLET_WITHDRAWAL_FAILED, WALLET_WITHDRAWAL_REVERSED -> buildWalletWithdrawalBody(eventType, data);
                case CART_ABANDONED -> buildAbandonedCartBody(data);
                case ENROLLMENT_CHECKOUT_ABANDONED -> buildAbandonedEnrollmentBody(data);
                case SUPPORT_TICKET_CLOSED -> buildSupportTicketClosedBody(data);
                default -> buildOrderConfirmedBody(data);
            };

            return wrapInBaseTemplate(contentHtml);
        } catch (Exception e) {
            log.error("Failed to render email template for event {}: {}", eventType, e.getMessage(), e);
            return wrapInBaseTemplate("<div style='padding:20px;'><h2 style='color:#0f3d2e;'>Notification Update</h2><p>Please check your Sporekart dashboard for details.</p></div>");
        }
    }

    private String wrapInBaseTemplate(String bodyHtml) {
        String baseTemplate = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sporekart Notification</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f4; margin: 0; padding: 0; color: #1e293b; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #052e16 0%, #0f3d2e 100%); padding: 24px 32px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 800; text-transform: uppercase; color: #facc15; }
            .header p { margin: 4px 0 0 0; font-size: 12px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 1.5px; }
            .content { padding: 32px; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .btn { display: inline-block; background-color: #15803d; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; margin-top: 16px; box-shadow: 0 2px 6px rgba(21,128,61,0.3); }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            .badge-emerald { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
            .badge-amber { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
            .badge-blue { background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
            .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
            td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍄 SPOREKART</h1>
              <p>Agritech & Cultivation Platform</p>
            </div>
            <div class="content">
              {{BODY_CONTENT}}
            </div>
            <div class="footer">
              <p>Need help? Contact support at <a href="mailto:support@sporekart.in" style="color:#15803d;">support@sporekart.in</a></p>
              <p>&copy; {{CURRENT_YEAR}} Sporekart Agritech Ltd. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        """;

        return baseTemplate.replace("{{BODY_CONTENT}}", bodyHtml != null ? bodyHtml : "")
                           .replace("{{CURRENT_YEAR}}", String.valueOf(java.time.Year.now().getValue()));
    }

    private String buildOrderConfirmedBody(JsonNode data) {
        String orderNumber = data.path("orderNumber").asText();
        String customerName = data.path("customerName").asText("Valued Grower");
        String totalAmount = data.path("totalAmount").asText("0.00");
        String paymentMethod = data.path("paymentMethod").asText("Razorpay Online");
        String ctaUrl = frontendUrl + "/dashboard?tab=activeTrack&orderId=" + data.path("orderId").asText();

        StringBuilder itemsHtml = new StringBuilder();
        JsonNode items = data.path("items");
        if (items.isArray()) {
            for (JsonNode item : items) {
                itemsHtml.append("<tr>")
                        .append("<td><strong>").append(item.path("title").asText()).append("</strong><br><span style='font-size:11px;color:#64748b;'>").append(item.path("variant").asText("")).append("</span></td>")
                        .append("<td style='text-align:center;'>").append(item.path("quantity").asInt(1)).append("</td>")
                        .append("<td style='text-align:right;'>₹").append(item.path("price").asText("0.00")).append("</td>")
                        .append("</tr>");
            }
        }

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-emerald">✓ Order Confirmed</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Thank You For Your Order!</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Hi %s, your order #%s has been successfully placed.</p>
        </div>

        <div class="card">
          <div style="font-size:12px; color:#64748b; margin-bottom:6px;">ORDER DETAILS</div>
          <div style="font-size:14px; font-weight:bold; color:#0f3d2e;">Order #: %s</div>
          <div style="font-size:13px; color:#475569;">Payment Status: <strong style="color:#166534;">PAID (₹%s)</strong> via %s</div>
        </div>

        <h3>Ordered Items</h3>
        <table>
          <thead>
            <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr>
          </thead>
          <tbody>
            %s
          </tbody>
        </table>

        <div style="text-align:right; margin-top:16px; font-size:16px; font-weight:bold; color:#0f3d2e;">
          Total Amount: ₹%s
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">View Order Details</a>
        </div>
        """.formatted(customerName, orderNumber, orderNumber, totalAmount, paymentMethod, itemsHtml.toString(), totalAmount, ctaUrl);
    }

    private String buildOrderCancelledBody(JsonNode data) {
        String orderNumber = data.path("orderNumber").asText();
        String customerName = data.path("customerName").asText("Grower");
        String reason = data.path("reason").asText("Cancelled by request");
        String refundAmount = data.path("refundAmount").asText("0.00");
        String ctaUrl = frontendUrl + "/dashboard?tab=history&orderId=" + data.path("orderId").asText();

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-amber">Order Cancelled</span>
          <h2 style="color:#991b1b; margin: 10px 0 4px 0;">Order #%s Cancelled</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Hi %s, your order has been cancelled.</p>
        </div>

        <div class="card">
          <div style="font-size:12px; color:#64748b; margin-bottom:6px;">CANCELLATION SUMMARY</div>
          <div style="font-size:13px; color:#1e293b; margin-bottom:4px;"><strong>Reason:</strong> %s</div>
          <div style="font-size:13px; color:#166534;"><strong>Refund Status:</strong> ₹%s credited to Sporekart Wallet</div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn" style="background-color:#475569;">View Order Status</a>
        </div>
        """.formatted(orderNumber, customerName, reason, refundAmount, ctaUrl);
    }

    private String buildShipmentBody(NotificationEventType type, JsonNode data) {
        String orderNumber = data.path("orderNumber").asText();
        String customerName = data.path("customerName").asText("Grower");
        String courierName = data.path("courierName").asText("Delhivery / Shiprocket");
        String awbCode = data.path("awbCode").asText("AWB-PENDING");
        String orderId = data.path("orderId").asText();
        String fallbackUrl = frontendUrl + "/dashboard?tab=activeTrack" + (orderId.isBlank() ? "" : "&orderId=" + orderId);
        String trackingUrl = data.path("trackingUrl").asText(fallbackUrl);
        if (trackingUrl == null || trackingUrl.isBlank() || trackingUrl.contains("AWB-PENDING")) {
            trackingUrl = fallbackUrl;
        }
        String currentStatus = data.path("status").asText(type.name());

        String headerTitle = switch (type) {
          case SHIPMENT_HANDOVER -> "🚚 Handed Over to Delivery Partner";
          case SHIPMENT_SHIPPED -> "🚚 Your Order Has Been Shipped!";
          case SHIPMENT_IN_TRANSIT -> "📍 Order In Transit";
          case SHIPMENT_OUT_FOR_DELIVERY -> "📦 Out For Delivery Today!";
          default -> "Shipment Update";
        };

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-emerald">%s</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">%s</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Hi %s, order #%s status is now <strong>%s</strong>.</p>
        </div>

        <div class="card" style="border-left: 4px solid #15803d;">
          <div style="font-size:12px; color:#64748b; margin-bottom:6px;">SHIPMENT TRACKING DETAILS</div>
          <div style="font-size:14px; font-weight:bold; color:#0f3d2e; margin-bottom:4px;">Courier Partner: %s</div>
          <div style="font-size:13px; font-family:monospace; color:#1e293b; margin-bottom:4px;">AWB / Tracking ID: <strong>%s</strong></div>
          <div style="font-size:13px; color:#475569;">Status: %s</div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn" style="background-color:#0f3d2e;">Track Your Shipment</a>
        </div>
        """.formatted(headerTitle, headerTitle, customerName, orderNumber, currentStatus, courierName, awbCode, currentStatus, trackingUrl);
    }

    private String buildOrderDeliveredBody(JsonNode data) {
        String orderNumber = data.path("orderNumber").asText();
        String customerName = data.path("customerName").asText("Grower");
        String ctaUrl = frontendUrl + "/dashboard?tab=history&orderId=" + data.path("orderId").asText();

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-emerald">🎉 Order Delivered</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Your Package Has Arrived!</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Hi %s, your order #%s has been successfully delivered.</p>
        </div>

        <div class="card">
          <p style="font-size:13px; color:#334155; margin:0;">We hope you enjoy your mushroom cultivation products! You can download your official GST invoice and share your review on Sporekart.</p>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">Download Tax Invoice & Review</a>
        </div>
        """.formatted(customerName, orderNumber, ctaUrl);
    }

    private String buildRefundBody(NotificationEventType type, JsonNode data) {
        String refundId = data.path("refundId").asText();
        String amount = data.path("amount").asText("0.00");
        String reason = data.path("reason").asText("Refund processed");
        String ctaUrl = frontendUrl + "/dashboard?tab=wallet";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-emerald">💳 Refund Notification</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Refund Status Update</h2>
        </div>

        <div class="card">
          <div style="font-size:13px; margin-bottom:6px;"><strong>Refund ID:</strong> %s</div>
          <div style="font-size:15px; font-weight:bold; color:#166534; margin-bottom:6px;">Refund Amount: ₹%s</div>
          <div style="font-size:13px; color:#475569;"><strong>Details:</strong> %s</div>
          <div style="font-size:12px; color:#64748b; margin-top:6px;">Amount credited directly to your Sporekart Wallet.</div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">View Wallet Balance</a>
        </div>
        """.formatted(refundId, amount, reason, ctaUrl);
    }

    private String buildEnrollmentConfirmedBody(JsonNode data) {
        String courseTitle = data.path("courseTitle").asText("Masterclass Training");
        String batchCode = data.path("batchCode").asText("UPCOMING");
        String studentName = data.path("studentName").asText("Trainee");
        String fee = data.path("fee").asText("0.00");
        String ctaUrl = frontendUrl + "/dashboard?tab=trainings";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-emerald">🎓 Enrollment Confirmed</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Welcome to Masterclass Training!</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Hi %s, your seat in %s is confirmed.</p>
        </div>

        <div class="card">
          <div style="font-size:14px; font-weight:bold; color:#0f3d2e;">Course: %s</div>
          <div style="font-size:13px; color:#475569; margin-top:4px;">Batch Code: <strong>%s</strong></div>
          <div style="font-size:13px; color:#166534; margin-top:4px;">Fee Paid: ₹%s</div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">View Training Dashboard</a>
        </div>
        """.formatted(studentName, courseTitle, courseTitle, batchCode, fee, ctaUrl);
    }

    private String buildEnrollmentCancelledBody(JsonNode data) {
        String courseTitle = data.path("courseTitle").asText("Masterclass Training");
        String studentName = data.path("studentName").asText("Trainee");
        String refundAmount = data.path("refundAmount").asText("0.00");
        String ctaUrl = frontendUrl + "/dashboard?tab=wallet";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-amber">Enrollment Cancelled</span>
          <h2 style="color:#991b1b; margin: 10px 0 4px 0;">Training Cancellation</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Hi %s, your enrollment in %s has been cancelled.</p>
        </div>

        <div class="card">
          <div style="font-size:13px; color:#166534;">Refund of <strong>₹%s</strong> has been credited to your Sporekart Wallet.</div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">View Wallet Balance</a>
        </div>
        """.formatted(studentName, courseTitle, refundAmount, ctaUrl);
    }

    private String buildWalletTopupBody(JsonNode data) {
        String txnRef = data.path("transactionRef").asText();
        String amount = data.path("amount").asText("0.00");
        String newBalance = data.path("newBalance").asText("0.00");
        String ctaUrl = frontendUrl + "/dashboard?tab=wallet";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-emerald">💰 Wallet Top-Up Successful</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Money Added To Wallet</h2>
        </div>

        <div class="card">
          <div style="font-size:13px; margin-bottom:4px;">Transaction ID: <strong>%s</strong></div>
          <div style="font-size:16px; font-weight:bold; color:#166534; margin-bottom:4px;">Amount Added: +₹%s</div>
          <div style="font-size:13px; color:#475569;">Updated Wallet Balance: <strong>₹%s</strong></div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">View Wallet</a>
        </div>
        """.formatted(txnRef, amount, newBalance, ctaUrl);
    }

    private String buildWalletRefundCreditBody(JsonNode data) {
        String txnRef = data.path("transactionRef").asText();
        String amount = data.path("amount").asText("0.00");
        String newBalance = data.path("newBalance").asText("0.00");
        String desc = data.path("description").asText("Refund credit");
        String ctaUrl = frontendUrl + "/dashboard?tab=wallet";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-emerald">💰 Refund Credited To Wallet</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Wallet Balance Updated</h2>
        </div>

        <div class="card">
          <div style="font-size:13px; margin-bottom:4px;">Transaction ID: <strong>%s</strong></div>
          <div style="font-size:16px; font-weight:bold; color:#166534; margin-bottom:4px;">Credit Amount: +₹%s</div>
          <div style="font-size:13px; color:#475569; margin-bottom:4px;">Details: %s</div>
          <div style="font-size:13px; color:#1e293b;">New Balance: <strong>₹%s</strong></div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">View Wallet</a>
        </div>
        """.formatted(txnRef, amount, desc, newBalance, ctaUrl);
    }

    private String buildWalletPaymentBody(JsonNode data) {
        String txnRef = data.path("transactionRef").asText();
        String amount = data.path("amount").asText("0.00");
        String newBalance = data.path("newBalance").asText("0.00");
        String ctaUrl = frontendUrl + "/dashboard?tab=wallet";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-blue">💸 Wallet Payment Deducted</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Payment Via Sporekart Wallet</h2>
        </div>

        <div class="card">
          <div style="font-size:13px; margin-bottom:4px;">Transaction ID: <strong>%s</strong></div>
          <div style="font-size:16px; font-weight:bold; color:#991b1b; margin-bottom:4px;">Amount Paid: -₹%s</div>
          <div style="font-size:13px; color:#475569;">Remaining Balance: <strong>₹%s</strong></div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">View Wallet Ledger</a>
        </div>
        """.formatted(txnRef, amount, newBalance, ctaUrl);
    }

    private String buildWalletWithdrawalBody(NotificationEventType type, JsonNode data) {
        String wdRef = data.path("withdrawalRef").asText();
        String amount = data.path("amount").asText("0.00");
        String maskedAcc = data.path("maskedAccount").asText("••••");
        String bankName = data.path("bankName").asText("Bank");
        String status = data.path("status").asText(type.name());
        String ctaUrl = frontendUrl + "/dashboard?tab=wallet";

        String statusBadge = switch (type) {
            case WALLET_WITHDRAWAL_COMPLETED -> "<span class='badge badge-emerald'>✓ Withdrawal Completed</span>";
            case WALLET_WITHDRAWAL_REVERSED, WALLET_WITHDRAWAL_FAILED -> "<span class='badge badge-amber'>⚠️ Withdrawal Reversed</span>";
            default -> "<span class='badge badge-blue'>⏳ Withdrawal Requested</span>";
        };

        return """
        <div style="text-align:center; margin-bottom:20px;">
          %s
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Bank Withdrawal Status: %s</h2>
        </div>

        <div class="card">
          <div style="font-size:13px; margin-bottom:4px;">Withdrawal Ref: <strong>%s</strong></div>
          <div style="font-size:15px; font-weight:bold; color:#0f3d2e; margin-bottom:4px;">Amount: ₹%s</div>
          <div style="font-size:13px; color:#475569;">Destination: %s (%s)</div>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn">View Wallet & Withdrawals</a>
        </div>
        """.formatted(statusBadge, status, wdRef, amount, bankName, maskedAcc, ctaUrl);
    }

    private String buildAbandonedCartBody(JsonNode data) {
        String customerName = data.path("customerName").asText("Grower");
        String itemCount = data.path("itemCount").asText("1");
        String cartTotal = data.path("cartTotal").asText("0.00");
        String ctaUrl = frontendUrl + "/cart";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-amber">🛒 Forgotten Cart</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Your Mushroom Cultivation Cart Is Waiting!</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Hi %s, you left %s item(s) (Total: ₹%s) in your Sporekart cart.</p>
        </div>

        <div class="card" style="text-align:center;">
          <p style="font-size:13px; color:#334155; margin:0;">Stock and batch availability for your selected cultivation supplies are limited. Complete your order now before items sell out.</p>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn" style="background-color:#d97706;">Complete Your Order Now</a>
        </div>
        """.formatted(customerName, itemCount, cartTotal, ctaUrl);
    }

    private String buildAbandonedEnrollmentBody(JsonNode data) {
        String studentName = data.path("studentName").asText("Trainee");
        String courseTitle = data.path("courseTitle").asText("Masterclass Training");
        String ctaUrl = frontendUrl + "/training";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-amber">🎓 Reserved Seat Pending</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Complete Your Masterclass Registration!</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Hi %s, your seat in %s is waiting for payment completion.</p>
        </div>

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn" style="background-color:#15803d;">Reserve Your Seat Now</a>
        </div>
        """.formatted(studentName, courseTitle, ctaUrl);
    }

    private String buildSupportTicketClosedBody(JsonNode data) {
        String ticketNumber = data.path("ticketNumber").asText();
        String subject = data.path("subject").asText("Support Ticket Inquiry");
        String category = data.path("category").asText("GENERAL_SUPPORT");
        String priority = data.path("priority").asText("MEDIUM");
        String closedBy = data.path("closedBy").asText("Support Team");
        int rating = data.path("satisfactionRating").asInt(0);
        String feedback = data.path("satisfactionFeedback").asText("");
        String lastMessage = data.path("lastMessage").asText("");

        String ctaUrl = frontendUrl + "/dashboard?tab=support";

        String ratingDisplay = rating > 0 ? "⭐".repeat(rating) + " (" + rating + "/5 Stars)" : "Not Rated";
        String closedByDisplay = "CUSTOMER".equalsIgnoreCase(closedBy) ? "Closed by Customer" : "Resolved & Closed by Support Agent";

        String ratingHtml = rating > 0
                ? "<div style='font-size:13px; color:#b45309; margin-top:4px;'><strong>Satisfaction Rating:</strong> " + ratingDisplay + (feedback.isBlank() ? "" : " — <em>\"" + feedback + "\"</em>") + "</div>"
                : "";

        String msgHtml = !lastMessage.isBlank()
                ? "<div class='card' style='border-left: 4px solid #15803d;'><div style='font-size:12px; color:#64748b; margin-bottom:4px;'>FINAL HELPDESK SUMMARY</div><div style='font-size:13px; color:#334155;'>" + lastMessage + "</div></div>"
                : "";

        return """
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-emerald">✓ Ticket Closed</span>
          <h2 style="color:#0f3d2e; margin: 10px 0 4px 0;">Support Ticket Resolved</h2>
          <p style="color:#64748b; font-size:14px; margin:0;">Ticket #%s status updated to <strong>CLOSED</strong>.</p>
        </div>

        <div class="card">
          <div style="font-size:12px; color:#64748b; margin-bottom:6px;">TICKET DETAILS</div>
          <div style="font-size:14px; font-weight:bold; color:#0f3d2e; margin-bottom:4px;">Ticket Reference: %s</div>
          <div style="font-size:13px; color:#1e293b; margin-bottom:4px;"><strong>Subject:</strong> %s</div>
          <div style="font-size:13px; color:#475569; margin-bottom:4px;"><strong>Category:</strong> %s | <strong>Priority:</strong> %s</div>
          <div style="font-size:13px; color:#166534; margin-bottom:4px;"><strong>Resolution:</strong> %s</div>
          %s
        </div>

        %s

        <div style="text-align:center; margin-top:24px;">
          <a href="%s" class="btn" style="background-color:#0f3d2e;">View Support Helpdesk</a>
        </div>
        """.formatted(ticketNumber, ticketNumber, subject, category, priority, closedByDisplay, ratingHtml, msgHtml, ctaUrl);
    }

    public String buildSmsText(NotificationEventType eventType, String payloadJson) {
        try {
            JsonNode data = objectMapper.readTree(payloadJson);
            return switch (eventType) {
                case ORDER_CONFIRMED, ORDER_PACKED -> 
                    "Sporekart: Order #" + data.path("orderNumber").asText("N/A") + " confirmed! Total Amount: INR " + data.path("totalAmount").asText("0.00") + ". Thank you for your purchase!";
                case ORDER_CANCELLED -> 
                    "Sporekart: Order #" + data.path("orderNumber").asText("N/A") + " has been cancelled. Refund details have been sent to your registered email.";
                case SHIPMENT_HANDOVER, SHIPMENT_SHIPPED, SHIPMENT_IN_TRANSIT -> 
                    "Sporekart: Your order #" + data.path("orderNumber").asText("N/A") + " is shipped via " + data.path("courierName").asText("Courier") + ". AWB: " + data.path("awbCode").asText("N/A") + ". Track here: " + data.path("trackingUrl").asText("N/A");
                case SHIPMENT_OUT_FOR_DELIVERY -> 
                    "Sporekart: Your order #" + data.path("orderNumber").asText("N/A") + " is OUT FOR DELIVERY today! Please be available to collect.";
                case ORDER_DELIVERED -> 
                    "Sporekart: Order #" + data.path("orderNumber").asText("N/A") + " has been delivered successfully! Thank you for choosing Sporekart.";
                case REFUND_INITIATED, REFUND_PROCESSING, REFUND_COMPLETED -> 
                    "Sporekart: Refund of INR " + data.path("refundAmount").asText("0.00") + " for order #" + data.path("orderNumber").asText("N/A") + " status: " + eventType.name() + ".";
                case ENROLLMENT_CONFIRMED -> 
                    "Sporekart Training: Masterclass enrollment for '" + data.path("courseTitle").asText("Course") + "' confirmed! Batch: " + data.path("batchCode").asText("UPCOMING") + ".";
                case ENROLLMENT_CANCELLED -> 
                    "Sporekart Training: Enrollment for '" + data.path("courseTitle").asText("Course") + "' has been cancelled.";
                case WALLET_TOPUP_SUCCESS -> 
                    "Sporekart Wallet: Top-up of INR " + data.path("amount").asText("0.00") + " successful! Transaction Ref: " + data.path("transactionRef").asText("N/A") + ".";
                case WALLET_REFUND_CREDIT -> 
                    "Sporekart Wallet: INR " + data.path("amount").asText("0.00") + " credited as refund to your Sporekart wallet.";
                case WALLET_PAYMENT_SUCCESS -> 
                    "Sporekart Wallet: Payment of INR " + data.path("amount").asText("0.00") + " processed successfully from your wallet.";
                case WALLET_WITHDRAWAL_REQUESTED, WALLET_WITHDRAWAL_COMPLETED -> 
                    "Sporekart Wallet: Withdrawal of INR " + data.path("amount").asText("0.00") + " status: " + eventType.name() + ".";
                case CART_ABANDONED, ENROLLMENT_CHECKOUT_ABANDONED -> 
                    "Sporekart: You left items in your cart! Complete your checkout now at " + frontendUrl + "/cart";
                case SUPPORT_TICKET_CLOSED -> 
                    "Sporekart Support: Ticket #" + data.path("ticketNumber").asText("N/A") + " ('" + data.path("subject").asText("") + "') has been resolved and closed.";
                default -> 
                    "Sporekart Alert: An update has been posted to your account. Log in to view details: " + frontendUrl;
            };
        } catch (Exception e) {
            log.error("Failed to build SMS text for event {}: {}", eventType, e.getMessage());
            return "Sporekart Alert: You have a new notification on Sporekart. Please check your account dashboard.";
        }
    }
}

