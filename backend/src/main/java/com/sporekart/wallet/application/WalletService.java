package com.sporekart.wallet.application;

import com.sporekart.shared.application.ResourceNotFoundException;
import com.sporekart.wallet.api.WalletDtos;
import com.sporekart.wallet.domain.*;
import com.sporekart.wallet.infrastructure.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final WalletWithdrawalRepository withdrawalRepository;
    private final com.sporekart.notification.application.NotificationEventService notificationEventService;

    @Transactional
    public Wallet getOrCreateWallet(UUID userId, String userType) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required to get or create wallet");
        }
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .userId(userId)
                            .userType(userType != null ? userType : "CUSTOMER")
                            .availableBalance(BigDecimal.ZERO)
                            .pendingBalance(BigDecimal.ZERO)
                            .withdrawableBalance(BigDecimal.ZERO)
                            .currency("INR")
                            .build();
                    return walletRepository.save(w);
                });
    }

    @Transactional(readOnly = true)
    public WalletDtos.WalletResponse getWalletResponse(UUID userId) {
        Wallet wallet = getOrCreateWallet(userId, "CUSTOMER");
        return mapToWalletResponse(wallet);
    }

    @Transactional
    public WalletTransaction creditWallet(
            UUID userId,
            BigDecimal amount,
            WalletTransactionType type,
            WalletSourceType sourceType,
            String sourceId,
            UUID orderId,
            UUID enrollmentId,
            String refundId,
            String description,
            String idempotencyKey,
            String createdBy
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Credit amount must be greater than zero");
        }

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<WalletTransaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Idempotent credit request ignored for key: {}", idempotencyKey);
                return existing.get();
            }
        }

        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseGet(() -> getOrCreateWallet(userId, "CUSTOMER"));

        BigDecimal balanceBefore = wallet.getAvailableBalance();
        BigDecimal balanceAfter = balanceBefore.add(amount);

        wallet.setAvailableBalance(balanceAfter);
        wallet.setWithdrawableBalance(wallet.getWithdrawableBalance().add(amount));
        walletRepository.save(wallet);

        String txnRef = "TXN-CR-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        WalletTransaction txn = WalletTransaction.builder()
                .transactionReference(txnRef)
                .walletId(wallet.getId())
                .userId(userId)
                .userType(wallet.getUserType())
                .transactionType(type != null ? type : WalletTransactionType.CREDIT)
                .transactionDirection(WalletTransactionDirection.CREDIT)
                .amount(amount)
                .currency(wallet.getCurrency())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .status(WalletTransactionStatus.SUCCESS)
                .sourceType(sourceType != null ? sourceType : WalletSourceType.TOPUP)
                .sourceId(sourceId)
                .orderId(orderId)
                .enrollmentId(enrollmentId)
                .refundId(refundId)
                .description(description)
                .idempotencyKey(idempotencyKey)
                .createdBy(createdBy != null ? createdBy : "SYSTEM")
                .build();

        WalletTransaction savedTxn = transactionRepository.save(txn);

        try {
            com.sporekart.notification.domain.NotificationEventType eventType =
                    (sourceType == WalletSourceType.REFUND) ? com.sporekart.notification.domain.NotificationEventType.WALLET_REFUND_CREDIT : com.sporekart.notification.domain.NotificationEventType.WALLET_TOPUP_SUCCESS;

            String subject = (eventType == com.sporekart.notification.domain.NotificationEventType.WALLET_REFUND_CREDIT)
                    ? "Sporekart Wallet - Refund Credited ₹" + amount
                    : "Sporekart Wallet - Top-Up Successful ₹" + amount;

            notificationEventService.recordEvent(
                    eventType,
                    "WALLET_TRANSACTION",
                    savedTxn.getId(),
                    userId,
                    null,
                    null,
                    subject,
                    java.util.Map.of(
                            "transactionRef", savedTxn.getTransactionReference(),
                            "amount", amount.toString(),
                            "newBalance", balanceAfter.toString(),
                            "description", description != null ? description : "Wallet Credit"
                    ),
                    "WALLET_CREDIT:" + savedTxn.getId()
            );
        } catch (Exception e) {
            log.error("Error recording wallet credit notification: {}", e.getMessage());
        }

        return savedTxn;
    }

    @Transactional
    public WalletTransaction debitWallet(
            UUID userId,
            BigDecimal amount,
            WalletTransactionType type,
            WalletSourceType sourceType,
            String sourceId,
            UUID orderId,
            UUID enrollmentId,
            String description,
            String idempotencyKey,
            String createdBy
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Debit amount must be greater than zero");
        }

        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<WalletTransaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Idempotent debit request ignored for key: {}", idempotencyKey);
                return existing.get();
            }
        }

        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));

        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient wallet balance. Available: ₹" + wallet.getAvailableBalance() + ", Requested: ₹" + amount);
        }

        BigDecimal balanceBefore = wallet.getAvailableBalance();
        BigDecimal balanceAfter = balanceBefore.subtract(amount);

        wallet.setAvailableBalance(balanceAfter);
        BigDecimal newWithdrawable = wallet.getWithdrawableBalance().subtract(amount);
        wallet.setWithdrawableBalance(newWithdrawable.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newWithdrawable);
        walletRepository.save(wallet);

        String txnRef = "TXN-DR-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        WalletTransaction txn = WalletTransaction.builder()
                .transactionReference(txnRef)
                .walletId(wallet.getId())
                .userId(userId)
                .userType(wallet.getUserType())
                .transactionType(type != null ? type : WalletTransactionType.DEBIT)
                .transactionDirection(WalletTransactionDirection.DEBIT)
                .amount(amount)
                .currency(wallet.getCurrency())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .status(WalletTransactionStatus.SUCCESS)
                .sourceType(sourceType != null ? sourceType : WalletSourceType.ORDER)
                .sourceId(sourceId)
                .orderId(orderId)
                .enrollmentId(enrollmentId)
                .description(description)
                .idempotencyKey(idempotencyKey)
                .createdBy(createdBy != null ? createdBy : "SYSTEM")
                .build();

        WalletTransaction savedTxn = transactionRepository.save(txn);

        try {
            notificationEventService.recordEvent(
                    com.sporekart.notification.domain.NotificationEventType.WALLET_PAYMENT_SUCCESS,
                    "WALLET_TRANSACTION",
                    savedTxn.getId(),
                    userId,
                    null,
                    null,
                    "Sporekart Wallet - Payment Deducted ₹" + amount,
                    java.util.Map.of(
                            "transactionRef", savedTxn.getTransactionReference(),
                            "amount", amount.toString(),
                            "newBalance", balanceAfter.toString()
                    ),
                    "WALLET_DEBIT:" + savedTxn.getId()
            );
        } catch (Exception e) {
            log.error("Error recording wallet debit notification: {}", e.getMessage());
        }

        return savedTxn;
    }

    @Transactional
    public WalletTransaction processRefundToWallet(
            UUID userId,
            BigDecimal amount,
            UUID orderId,
            UUID enrollmentId,
            String refundId,
            String reason,
            String createdBy
    ) {
        String desc = "Refund credited to wallet: " + (reason != null ? reason : "Order/Enrollment cancellation");
        String idempotency = "ref_" + (orderId != null ? orderId : enrollmentId) + "_" + (refundId != null ? refundId : "system");
        
        return creditWallet(
                userId,
                amount,
                WalletTransactionType.REFUND,
                WalletSourceType.REFUND,
                refundId,
                orderId,
                enrollmentId,
                refundId,
                desc,
                idempotency,
                createdBy != null ? createdBy : "REFUND_SERVICE"
        );
    }

    @Transactional
    public WalletDtos.WithdrawalResponse requestWithdrawal(UUID userId, WalletDtos.WithdrawRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than zero");
        }
        if (request.getBankName() == null || request.getBankName().trim().isEmpty() ||
            request.getAccountNumber() == null || request.getAccountNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Bank name and account number are required for withdrawal");
        }

        Wallet wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));

        if (wallet.getWithdrawableBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalStateException("Requested withdrawal amount (₹" + request.getAmount() + ") exceeds withdrawable balance (₹" + wallet.getWithdrawableBalance() + ")");
        }

        // Mask Account Number
        String rawAcc = request.getAccountNumber().trim();
        String maskedAcc = rawAcc.length() > 4 ? "••••" + rawAcc.substring(rawAcc.length() - 4) : rawAcc;
        String wdRef = "WD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();

        // Atomically debit wallet balance for withdrawal request
        debitWallet(
                userId,
                request.getAmount(),
                WalletTransactionType.WITHDRAWAL,
                WalletSourceType.WITHDRAWAL,
                wdRef,
                null,
                null,
                "Bank Withdrawal Requested: " + request.getBankName() + " (" + maskedAcc + ")",
                "wd_req_" + wdRef,
                "CUSTOMER_WITHDRAWAL"
        );

        WalletWithdrawal withdrawal = WalletWithdrawal.builder()
                .withdrawalReference(wdRef)
                .walletId(wallet.getId())
                .userId(userId)
                .amount(request.getAmount())
                .status(WithdrawalStatus.REQUESTED)
                .bankName(request.getBankName().trim())
                .accountNumberMasked(maskedAcc)
                .ifscCode(request.getIfscCode() != null ? request.getIfscCode().trim().toUpperCase() : "")
                .accountHolderName(request.getAccountHolderName() != null ? request.getAccountHolderName().trim() : "")
                .build();

        WalletWithdrawal saved = withdrawalRepository.save(withdrawal);

        try {
            notificationEventService.recordEvent(
                    com.sporekart.notification.domain.NotificationEventType.WALLET_WITHDRAWAL_REQUESTED,
                    "WALLET_WITHDRAWAL",
                    saved.getId(),
                    userId,
                    null,
                    null,
                    "Sporekart Wallet - Withdrawal Requested ₹" + request.getAmount(),
                    java.util.Map.of(
                            "withdrawalRef", saved.getWithdrawalReference(),
                            "amount", request.getAmount().toString(),
                            "bankName", saved.getBankName(),
                            "accountMasked", saved.getAccountNumberMasked()
                    ),
                    "WALLET_WD_REQ:" + saved.getId()
            );
        } catch (Exception e) {
            log.error("Error recording wallet withdrawal requested notification: {}", e.getMessage());
        }

        return mapToWithdrawalResponse(saved);
    }

    @Transactional
    public WalletDtos.WithdrawalResponse approveWithdrawal(UUID withdrawalId, String adminUser, String notes) {
        WalletWithdrawal withdrawal = withdrawalRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("Withdrawal request not found: " + withdrawalId));

        if (withdrawal.getStatus() != WithdrawalStatus.REQUESTED && withdrawal.getStatus() != WithdrawalStatus.PROCESSING) {
            throw new IllegalStateException("Withdrawal is already in state: " + withdrawal.getStatus());
        }

        withdrawal.setStatus(WithdrawalStatus.SUCCESS);
        withdrawal.setProcessedBy(adminUser != null ? adminUser : "ADMIN");
        withdrawal.setAdminNotes(notes != null ? notes : "Bank transfer completed successfully");
        withdrawal.setProcessedAt(OffsetDateTime.now());

        WalletWithdrawal saved = withdrawalRepository.save(withdrawal);

        try {
            notificationEventService.recordEvent(
                    com.sporekart.notification.domain.NotificationEventType.WALLET_WITHDRAWAL_COMPLETED,
                    "WALLET_WITHDRAWAL",
                    saved.getId(),
                    saved.getUserId(),
                    null,
                    null,
                    "Sporekart Wallet - Withdrawal Successful ₹" + saved.getAmount(),
                    java.util.Map.of(
                            "withdrawalRef", saved.getWithdrawalReference(),
                            "amount", saved.getAmount().toString(),
                            "bankName", saved.getBankName(),
                            "accountMasked", saved.getAccountNumberMasked()
                    ),
                    "WALLET_WD_COMPLETED:" + saved.getId()
            );
        } catch (Exception e) {
            log.error("Error recording wallet withdrawal completed notification: {}", e.getMessage());
        }

        return mapToWithdrawalResponse(saved);
    }

    @Transactional
    public WalletDtos.WithdrawalResponse rejectWithdrawal(UUID withdrawalId, String adminUser, String reason) {
        WalletWithdrawal withdrawal = withdrawalRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("Withdrawal request not found: " + withdrawalId));

        if (withdrawal.getStatus() != WithdrawalStatus.REQUESTED && withdrawal.getStatus() != WithdrawalStatus.PROCESSING) {
            throw new IllegalStateException("Withdrawal is already in state: " + withdrawal.getStatus());
        }

        withdrawal.setStatus(WithdrawalStatus.REVERSED);
        withdrawal.setProcessedBy(adminUser != null ? adminUser : "ADMIN");
        withdrawal.setRejectionReason(reason != null ? reason : "Withdrawal request rejected by administrator");
        withdrawal.setProcessedAt(OffsetDateTime.now());

        WalletWithdrawal saved = withdrawalRepository.save(withdrawal);

        // COMPENSATING LEDGER TRANSACTION: Credit wallet back
        creditWallet(
                withdrawal.getUserId(),
                withdrawal.getAmount(),
                WalletTransactionType.REVERSAL,
                WalletSourceType.WITHDRAWAL,
                withdrawal.getWithdrawalReference(),
                null,
                null,
                null,
                "Withdrawal Reversal Credit: " + (reason != null ? reason : "Rejected by Admin"),
                "wd_rev_" + withdrawal.getId(),
                "ADMIN_REVERSAL"
        );

        try {
            notificationEventService.recordEvent(
                    com.sporekart.notification.domain.NotificationEventType.WALLET_WITHDRAWAL_REVERSED,
                    "WALLET_WITHDRAWAL",
                    saved.getId(),
                    saved.getUserId(),
                    null,
                    null,
                    "Sporekart Wallet - Withdrawal Request Rejected & Refunded ₹" + saved.getAmount(),
                    java.util.Map.of(
                            "withdrawalRef", saved.getWithdrawalReference(),
                            "amount", saved.getAmount().toString(),
                            "reason", saved.getRejectionReason() != null ? saved.getRejectionReason() : "Rejected by Admin"
                    ),
                    "WALLET_WD_REV:" + saved.getId()
            );
        } catch (Exception e) {
            log.error("Error recording wallet withdrawal reversed notification: {}", e.getMessage());
        }

        return mapToWithdrawalResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<WalletDtos.WalletTransactionResponse> getUserTransactions(UUID userId, String typeStr, String search, int page, int size) {
        Wallet wallet = getOrCreateWallet(userId, "CUSTOMER");
        Pageable pageable = PageRequest.of(page, size);

        WalletTransactionType typeEnum = null;
        if (typeStr != null && !typeStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(typeStr)) {
            try {
                typeEnum = WalletTransactionType.valueOf(typeStr.trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        Page<WalletTransaction> pageResult = transactionRepository.filterTransactions(wallet.getId(), typeEnum, search, pageable);
        return pageResult.map(this::mapToTransactionResponse);
    }

    @Transactional(readOnly = true)
    public List<WalletDtos.WithdrawalResponse> getUserWithdrawals(UUID userId) {
        return withdrawalRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToWithdrawalResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<WalletDtos.WalletTransactionResponse> getAllPlatformTransactions(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findAllFiltered(search, pageable).map(this::mapToTransactionResponse);
    }

    @Transactional(readOnly = true)
    public Page<WalletDtos.WithdrawalResponse> getAllWithdrawals(String statusStr, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (statusStr != null && !statusStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                WithdrawalStatus status = WithdrawalStatus.valueOf(statusStr.trim().toUpperCase());
                return withdrawalRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::mapToWithdrawalResponse);
            } catch (Exception ignored) {}
        }
        return withdrawalRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToWithdrawalResponse);
    }

    @Transactional(readOnly = true)
    public WalletDtos.AdminFinanceSummaryResponse getAdminFinanceSummary() {
        List<Wallet> allWallets = walletRepository.findAll();
        BigDecimal walletLiability = allWallets.stream()
                .map(Wallet::getAvailableBalance)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<WalletWithdrawal> withdrawals = withdrawalRepository.findAll();
        BigDecimal pendingWd = withdrawals.stream()
                .filter(w -> w.getStatus() == WithdrawalStatus.REQUESTED || w.getStatus() == WithdrawalStatus.PROCESSING)
                .map(WalletWithdrawal::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal completedWd = withdrawals.stream()
                .filter(w -> w.getStatus() == WithdrawalStatus.SUCCESS)
                .map(WalletWithdrawal::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingWdCount = withdrawals.stream()
                .filter(w -> w.getStatus() == WithdrawalStatus.REQUESTED || w.getStatus() == WithdrawalStatus.PROCESSING)
                .count();

        long txnCount = transactionRepository.count();

        return WalletDtos.AdminFinanceSummaryResponse.builder()
                .walletLiabilityBalance(walletLiability)
                .totalPendingWithdrawals(pendingWd)
                .totalCompletedWithdrawals(completedWd)
                .pendingWithdrawalsCount(pendingWdCount)
                .totalWalletTransactionsCount(txnCount)
                .build();
    }

    @Transactional
    public WalletTransaction performAdminAdjustment(UUID targetUserId, BigDecimal amount, String direction, String reason, String adminUser) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Adjustment amount must be greater than zero");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Mandatory admin audit reason required for manual wallet adjustment");
        }

        boolean isCredit = "CREDIT".equalsIgnoreCase(direction);
        if (isCredit) {
            return creditWallet(
                    targetUserId,
                    amount,
                    WalletTransactionType.ADJUSTMENT,
                    WalletSourceType.ADMIN_ADJUSTMENT,
                    "ADMIN_MANUAL",
                    null,
                    null,
                    null,
                    "Admin Manual Credit: " + reason,
                    "adj_cr_" + System.currentTimeMillis(),
                    adminUser != null ? adminUser : "ADMIN"
            );
        } else {
            return debitWallet(
                    targetUserId,
                    amount,
                    WalletTransactionType.ADJUSTMENT,
                    WalletSourceType.ADMIN_ADJUSTMENT,
                    "ADMIN_MANUAL",
                    null,
                    null,
                    "Admin Manual Debit: " + reason,
                    "adj_dr_" + System.currentTimeMillis(),
                    adminUser != null ? adminUser : "ADMIN"
            );
        }
    }

    private WalletDtos.WalletResponse mapToWalletResponse(Wallet w) {
        return WalletDtos.WalletResponse.builder()
                .walletId(w.getId())
                .userId(w.getUserId())
                .userType(w.getUserType())
                .availableBalance(w.getAvailableBalance())
                .pendingBalance(w.getPendingBalance())
                .withdrawableBalance(w.getWithdrawableBalance())
                .currency(w.getCurrency())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }

    private WalletDtos.WalletTransactionResponse mapToTransactionResponse(WalletTransaction wt) {
        return WalletDtos.WalletTransactionResponse.builder()
                .id(wt.getId())
                .transactionReference(wt.getTransactionReference())
                .walletId(wt.getWalletId())
                .userId(wt.getUserId())
                .transactionType(wt.getTransactionType())
                .transactionDirection(wt.getTransactionDirection())
                .amount(wt.getAmount())
                .currency(wt.getCurrency())
                .balanceBefore(wt.getBalanceBefore())
                .balanceAfter(wt.getBalanceAfter())
                .status(wt.getStatus())
                .sourceType(wt.getSourceType())
                .sourceId(wt.getSourceId())
                .orderId(wt.getOrderId())
                .paymentId(wt.getPaymentId())
                .refundId(wt.getRefundId())
                .enrollmentId(wt.getEnrollmentId())
                .withdrawalId(wt.getWithdrawalId())
                .description(wt.getDescription())
                .createdAt(wt.getCreatedAt())
                .createdBy(wt.getCreatedBy())
                .build();
    }

    private WalletDtos.WithdrawalResponse mapToWithdrawalResponse(WalletWithdrawal w) {
        return WalletDtos.WithdrawalResponse.builder()
                .id(w.getId())
                .withdrawalReference(w.getWithdrawalReference())
                .walletId(w.getWalletId())
                .userId(w.getUserId())
                .amount(w.getAmount())
                .status(w.getStatus())
                .bankName(w.getBankName())
                .accountNumberMasked(w.getAccountNumberMasked())
                .ifscCode(w.getIfscCode())
                .accountHolderName(w.getAccountHolderName())
                .adminNotes(w.getAdminNotes())
                .rejectionReason(w.getRejectionReason())
                .createdAt(w.getCreatedAt())
                .processedAt(w.getProcessedAt())
                .build();
    }
}
