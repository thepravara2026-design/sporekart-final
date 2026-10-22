package com.sporekart.wallet.api;

import com.sporekart.wallet.domain.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class WalletDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WalletResponse {
        private UUID walletId;
        private UUID userId;
        private String userType;
        private BigDecimal availableBalance;
        private BigDecimal pendingBalance;
        private BigDecimal withdrawableBalance;
        private String currency;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WalletTransactionResponse {
        private UUID id;
        private String transactionReference;
        private UUID walletId;
        private UUID userId;
        private WalletTransactionType transactionType;
        private WalletTransactionDirection transactionDirection;
        private BigDecimal amount;
        private String currency;
        private BigDecimal balanceBefore;
        private BigDecimal balanceAfter;
        private WalletTransactionStatus status;
        private WalletSourceType sourceType;
        private String sourceId;
        private UUID orderId;
        private UUID paymentId;
        private String refundId;
        private UUID enrollmentId;
        private UUID withdrawalId;
        private String description;
        private OffsetDateTime createdAt;
        private String createdBy;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WithdrawRequest {
        @NotNull(message = "Withdrawal amount is required")
        @DecimalMin(value = "1.00", message = "Withdrawal amount must be at least ₹1.00")
        private BigDecimal amount;

        @NotBlank(message = "Bank name is required")
        private String bankName;

        @NotBlank(message = "Account number is required")
        private String accountNumber;

        @NotBlank(message = "IFSC code is required")
        @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format")
        private String ifscCode;

        @NotBlank(message = "Account holder name is required")
        private String accountHolderName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WithdrawalResponse {
        private UUID id;
        private String withdrawalReference;
        private UUID walletId;
        private UUID userId;
        private BigDecimal amount;
        private WithdrawalStatus status;
        private String bankName;
        private String accountNumberMasked;
        private String ifscCode;
        private String accountHolderName;
        private String adminNotes;
        private String rejectionReason;
        private OffsetDateTime createdAt;
        private OffsetDateTime processedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddMoneyRequest {
        @NotNull(message = "Top-up amount is required")
        @DecimalMin(value = "1.00", message = "Top-up amount must be at least ₹1.00")
        private BigDecimal amount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddMoneyResponse {
        private String razorpayOrderId;
        private BigDecimal amountInr;
        private String currency;
        private String razorpayKeyId;
        private String transactionReference;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyAddMoneyRequest {
        @NotBlank(message = "Razorpay order ID is required")
        private String razorpayOrderId;

        @NotBlank(message = "Razorpay payment ID is required")
        private String razorpayPaymentId;

        @NotBlank(message = "Razorpay signature is required")
        private String razorpaySignature;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WalletCheckoutPayRequest {
        private UUID orderId;
        private UUID enrollmentId;

        @NotBlank(message = "Payment target type is required (ORDER or ENROLLMENT)")
        private String type; // "ORDER" or "ENROLLMENT"

        @NotNull(message = "Wallet deduction amount is required")
        @DecimalMin(value = "0.00", message = "Wallet amount cannot be negative")
        private BigDecimal amountFromWallet;

        private BigDecimal amountFromGateway;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WalletCheckoutPayResponse {
        private boolean isSuccess;
        private String message;
        private UUID orderId;
        private UUID enrollmentId;
        private BigDecimal walletAmountDeducted;
        private BigDecimal remainingAmountPayable;
        private boolean isFullyPaid;
        private String razorpayOrderId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminFinanceSummaryResponse {
        private BigDecimal totalPaymentsReceived;
        private BigDecimal walletLiabilityBalance;
        private BigDecimal totalPendingRefunds;
        private BigDecimal totalCompletedRefunds;
        private BigDecimal totalPendingWithdrawals;
        private BigDecimal totalCompletedWithdrawals;
        private BigDecimal totalProductSales;
        private BigDecimal totalTrainingSales;
        private long totalWalletTransactionsCount;
        private long pendingWithdrawalsCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminManualAdjustmentRequest {
        @NotNull(message = "User ID is required")
        private UUID userId;

        @NotNull(message = "Adjustment amount is required")
        @DecimalMin(value = "0.01", message = "Adjustment amount must be at least ₹0.01")
        private BigDecimal amount;

        @NotBlank(message = "Direction is required (CREDIT or DEBIT)")
        @Pattern(regexp = "^(CREDIT|DEBIT)$", message = "Direction must be CREDIT or DEBIT")
        private String direction; // "CREDIT" or "DEBIT"

        @NotBlank(message = "Adjustment reason is required")
        private String reason;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminWithdrawalActionRequest {
        private String action; // "APPROVE" or "REJECT"
        private String notes;
        private String rejectionReason;
    }
}
