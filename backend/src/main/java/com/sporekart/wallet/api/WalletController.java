package com.sporekart.wallet.api;

import com.sporekart.payment.application.PaymentGateway;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shared.application.ForbiddenOperationException;
import com.sporekart.wallet.application.WalletService;
import com.sporekart.wallet.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final PaymentGateway paymentGateway;

    @GetMapping
    public ResponseEntity<ApiResponse<WalletDtos.WalletResponse>> getWallet(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required to access wallet");
        }
        WalletDtos.WalletResponse wallet = walletService.getWalletResponse(userId);
        return ResponseEntity.ok(ApiResponse.success(wallet));
    }

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getWalletBalance(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            return ResponseEntity.ok(ApiResponse.success(BigDecimal.ZERO));
        }
        WalletDtos.WalletResponse wallet = walletService.getWalletResponse(userId);
        return ResponseEntity.ok(ApiResponse.success(wallet.getAvailableBalance()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<WalletDtos.WalletTransactionResponse>>> getTransactions(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required to view wallet transaction ledger");
        }
        Page<WalletDtos.WalletTransactionResponse> txns = walletService.getUserTransactions(userId, type, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(txns));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<WalletDtos.WithdrawalResponse>> requestWithdrawal(
            Authentication authentication,
            @RequestBody WalletDtos.WithdrawRequest request
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required to request withdrawal");
        }
        WalletDtos.WithdrawalResponse response = walletService.requestWithdrawal(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<List<WalletDtos.WithdrawalResponse>>> getWithdrawals(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required to view withdrawals");
        }
        List<WalletDtos.WithdrawalResponse> withdrawals = walletService.getUserWithdrawals(userId);
        return ResponseEntity.ok(ApiResponse.success(withdrawals));
    }

    @PostMapping("/add-money")
    public ResponseEntity<ApiResponse<WalletDtos.AddMoneyResponse>> addMoney(
            Authentication authentication,
            @RequestBody WalletDtos.AddMoneyRequest request
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required to add money to wallet");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Topup amount must be greater than zero");
        }

        String topupRef = "TOPUP-" + System.currentTimeMillis();
        PaymentGateway.InitiatePaymentResult result = paymentGateway.createPaymentOrder(
                null, topupRef, request.getAmount()
        );

        WalletDtos.AddMoneyResponse response = WalletDtos.AddMoneyResponse.builder()
                .razorpayOrderId(result.getRazorpayOrderId())
                .amountInr(request.getAmount())
                .currency(result.getCurrency())
                .razorpayKeyId(result.getRazorpayKeyId())
                .transactionReference(topupRef)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify-add-money")
    public ResponseEntity<ApiResponse<WalletDtos.WalletTransactionResponse>> verifyAddMoney(
            Authentication authentication,
            @RequestBody WalletDtos.VerifyAddMoneyRequest request,
            @RequestParam BigDecimal amount
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required");
        }

        boolean validSig = paymentGateway.verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!validSig) {
            throw new IllegalArgumentException("Invalid Razorpay payment signature for wallet topup");
        }

        WalletTransaction txn = walletService.creditWallet(
                userId,
                amount,
                WalletTransactionType.TOPUP,
                WalletSourceType.TOPUP,
                request.getRazorpayPaymentId(),
                null,
                null,
                request.getRazorpayPaymentId(),
                "Wallet Topup via Razorpay (" + request.getRazorpayPaymentId() + ")",
                "topup_" + request.getRazorpayPaymentId(),
                "CUSTOMER_TOPUP"
        );

        WalletDtos.WalletTransactionResponse res = WalletDtos.WalletTransactionResponse.builder()
                .id(txn.getId())
                .transactionReference(txn.getTransactionReference())
                .amount(txn.getAmount())
                .balanceAfter(txn.getBalanceAfter())
                .status(txn.getStatus())
                .description(txn.getDescription())
                .createdAt(txn.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping("/checkout-pay")
    public ResponseEntity<ApiResponse<WalletDtos.WalletCheckoutPayResponse>> processCheckoutWalletPay(
            Authentication authentication,
            @RequestBody WalletDtos.WalletCheckoutPayRequest request
    ) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required to use wallet for checkout");
        }

        BigDecimal walletAmount = request.getAmountFromWallet() != null ? request.getAmountFromWallet() : BigDecimal.ZERO;
        BigDecimal gatewayAmount = request.getAmountFromGateway() != null ? request.getAmountFromGateway() : BigDecimal.ZERO;

        if (walletAmount.compareTo(BigDecimal.ZERO) > 0) {
            walletService.debitWallet(
                    userId,
                    walletAmount,
                    gatewayAmount.compareTo(BigDecimal.ZERO) == 0 ? WalletTransactionType.WALLET_PAYMENT : WalletTransactionType.PARTIAL_PAYMENT,
                    "ENROLLMENT".equalsIgnoreCase(request.getType()) ? WalletSourceType.TRAINING_ENROLLMENT : WalletSourceType.ORDER,
                    request.getOrderId() != null ? request.getOrderId().toString() : (request.getEnrollmentId() != null ? request.getEnrollmentId().toString() : "CHECKOUT"),
                    request.getOrderId(),
                    request.getEnrollmentId(),
                    "Wallet payment for " + (request.getOrderId() != null ? "Order #" + request.getOrderId() : "Enrollment #" + request.getEnrollmentId()),
                    "chk_pay_" + (request.getOrderId() != null ? request.getOrderId() : request.getEnrollmentId()),
                    "CUSTOMER_CHECKOUT"
            );
        }

        boolean isFullyPaid = gatewayAmount.compareTo(BigDecimal.ZERO) <= 0;
        String razorpayOrderId = null;

        if (!isFullyPaid) {
            PaymentGateway.InitiatePaymentResult result = paymentGateway.createPaymentOrder(
                    request.getOrderId(),
                    request.getOrderId() != null ? request.getOrderId().toString() : request.getEnrollmentId().toString(),
                    gatewayAmount
            );
            razorpayOrderId = result.getRazorpayOrderId();
        }

        WalletDtos.WalletCheckoutPayResponse response = WalletDtos.WalletCheckoutPayResponse.builder()
                .isSuccess(true)
                .message(isFullyPaid ? "Order fully paid using Sporekart Wallet" : "Partial wallet payment applied. Remaining amount via Gateway.")
                .orderId(request.getOrderId())
                .enrollmentId(request.getEnrollmentId())
                .walletAmountDeducted(walletAmount)
                .remainingAmountPayable(gatewayAmount)
                .isFullyPaid(isFullyPaid)
                .razorpayOrderId(razorpayOrderId)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private UUID extractUserId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                return UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }
}
