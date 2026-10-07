package com.sporekart.wallet.api;

import com.sporekart.shared.api.ApiResponse;
import com.sporekart.wallet.application.WalletService;
import com.sporekart.wallet.domain.WalletTransaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/admin/finance")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final WalletService walletService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<WalletDtos.AdminFinanceSummaryResponse>> getFinanceOverview() {
        WalletDtos.AdminFinanceSummaryResponse summary = walletService.getAdminFinanceSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<WalletDtos.WalletTransactionResponse>>> getAllTransactions(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Page<WalletDtos.WalletTransactionResponse> txns = walletService.getAllPlatformTransactions(search, page, size);
        return ResponseEntity.ok(ApiResponse.success(txns));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<Page<WalletDtos.WithdrawalResponse>>> getAllWithdrawals(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Page<WalletDtos.WithdrawalResponse> withdrawals = walletService.getAllWithdrawals(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(withdrawals));
    }

    @PostMapping("/withdrawals/{id}/approve")
    public ResponseEntity<ApiResponse<WalletDtos.WithdrawalResponse>> approveWithdrawal(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody(required = false) WalletDtos.AdminWithdrawalActionRequest request
    ) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        String notes = request != null ? request.getNotes() : "Approved by Admin";
        WalletDtos.WithdrawalResponse response = walletService.approveWithdrawal(id, adminUser, notes);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/withdrawals/{id}/reject")
    public ResponseEntity<ApiResponse<WalletDtos.WithdrawalResponse>> rejectWithdrawal(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody WalletDtos.AdminWithdrawalActionRequest request
    ) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        String reason = request != null ? request.getRejectionReason() : "Rejected by Admin";
        WalletDtos.WithdrawalResponse response = walletService.rejectWithdrawal(id, adminUser, reason);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/manual-adjustment")
    public ResponseEntity<ApiResponse<WalletDtos.WalletTransactionResponse>> performManualAdjustment(
            Authentication authentication,
            @RequestBody WalletDtos.AdminManualAdjustmentRequest request
    ) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        WalletTransaction txn = walletService.performAdminAdjustment(
                request.getUserId(),
                request.getAmount(),
                request.getDirection(),
                request.getReason(),
                adminUser
        );

        WalletDtos.WalletTransactionResponse res = WalletDtos.WalletTransactionResponse.builder()
                .id(txn.getId())
                .transactionReference(txn.getTransactionReference())
                .amount(txn.getAmount())
                .balanceBefore(txn.getBalanceBefore())
                .balanceAfter(txn.getBalanceAfter())
                .status(txn.getStatus())
                .description(txn.getDescription())
                .createdAt(txn.getCreatedAt())
                .createdBy(txn.getCreatedBy())
                .build();

        return ResponseEntity.ok(ApiResponse.success(res));
    }
}
