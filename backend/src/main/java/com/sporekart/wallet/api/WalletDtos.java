package com.sporekart.wallet.api;

import com.sporekart.wallet.domain.*;
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
        private BigDecimal amount;
        private String bankName;
        private String accountNumber;
        private String ifscCode;
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
        private String razorpayOrderId;
        private String razorpayPaymentId;
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
        private String type; // "ORDER" or "ENROLLMENT"
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
        private UUID userId;
        private BigDecimal amount;
        private String direction; // "CREDIT" or "DEBIT"
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
