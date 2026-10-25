package com.sporekart.wallet.api;

import com.sporekart.payment.application.PaymentGateway;
import com.sporekart.shared.api.ApiResponse;
import com.sporekart.shared.application.ForbiddenOperationException;
import com.sporekart.wallet.application.WalletService;
import com.sporekart.wallet.domain.*;
import jakarta.validation.Valid;
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
            @Valid @RequestBody WalletDtos.WithdrawRequest request
    ) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.GONE)
                .body(ApiResponse.error("WALLET_RETIRED", "Wallet withdrawals have been permanently retired. All merchant and customer funds settle directly via official banking channels."));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<List<WalletDtos.WithdrawalResponse>>> getWithdrawals(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenOperationException("Authentication required to view historical withdrawals");
        }
        List<WalletDtos.WithdrawalResponse> withdrawals = walletService.getUserWithdrawals(userId);
        return ResponseEntity.ok(ApiResponse.success(withdrawals));
    }

    @PostMapping("/add-money")
    public ResponseEntity<ApiResponse<WalletDtos.AddMoneyResponse>> addMoney(
            Authentication authentication,
            @Valid @RequestBody WalletDtos.AddMoneyRequest request
    ) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.GONE)
                .body(ApiResponse.error("WALLET_RETIRED", "Wallet top-ups have been permanently retired. All payments are processed directly via Razorpay."));
    }

    @PostMapping("/verify-add-money")
    public ResponseEntity<ApiResponse<WalletDtos.WalletTransactionResponse>> verifyAddMoney(
            Authentication authentication,
            @Valid @RequestBody WalletDtos.VerifyAddMoneyRequest request,
            @RequestParam(required = false) BigDecimal amount
    ) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.GONE)
                .body(ApiResponse.error("WALLET_RETIRED", "Wallet top-ups have been permanently retired."));
    }

    @PostMapping("/checkout-pay")
    public ResponseEntity<ApiResponse<WalletDtos.WalletCheckoutPayResponse>> processCheckoutWalletPay(
            Authentication authentication,
            @Valid @RequestBody WalletDtos.WalletCheckoutPayRequest request
    ) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.GONE)
                .body(ApiResponse.error("WALLET_RETIRED", "Wallet payments at checkout have been permanently retired. Please pay via Razorpay (UPI, Cards, NetBanking, QR)."));
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
