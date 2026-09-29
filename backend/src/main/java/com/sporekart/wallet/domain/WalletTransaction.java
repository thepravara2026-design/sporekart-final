package com.sporekart.wallet.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "wallet_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "transaction_reference", nullable = false, unique = true)
    private String transactionReference;

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_type", nullable = false)
    @Builder.Default
    private String userType = "CUSTOMER";

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private WalletTransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_direction", nullable = false)
    private WalletTransactionDirection transactionDirection;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "balance_before", nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private WalletTransactionStatus status = WalletTransactionStatus.SUCCESS;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private WalletSourceType sourceType;

    @Column(name = "source_id")
    private String sourceId;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "refund_id")
    private String refundId;

    @Column(name = "enrollment_id")
    private UUID enrollmentId;

    @Column(name = "training_batch_id")
    private UUID trainingBatchId;

    @Column(name = "withdrawal_id")
    private UUID withdrawalId;

    @Column(name = "parent_transaction_id")
    private UUID parentTransactionId;

    @Column(name = "related_transaction_id")
    private UUID relatedTransactionId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "processed_at", nullable = false)
    private OffsetDateTime processedAt;

    @Column(name = "created_by", nullable = false)
    @Builder.Default
    private String createdBy = "SYSTEM";

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (processedAt == null) processedAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
