package com.sporekart.wallet.application;

import com.sporekart.wallet.api.WalletDtos;
import com.sporekart.wallet.domain.*;
import com.sporekart.wallet.infrastructure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private WalletTransactionRepository transactionRepository;

    @Mock
    private WalletWithdrawalRepository withdrawalRepository;

    @Mock
    private com.sporekart.notification.application.NotificationEventService notificationEventService;

    @Mock
    private WalletTopupIntentRepository topupIntentRepository;

    @Mock
    private com.sporekart.payment.application.PaymentGateway paymentGateway;

    @InjectMocks
    private WalletService walletService;

    private UUID userId;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .userType("CUSTOMER")
                .availableBalance(new BigDecimal("1000.00"))
                .pendingBalance(BigDecimal.ZERO)
                .withdrawableBalance(new BigDecimal("1000.00"))
                .currency("INR")
                .build();
    }

    @Test
    @DisplayName("Should successfully credit money to wallet")
    void testCreditWallet() {
        when(walletRepository.findByUserIdWithLock(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletTransaction txn = walletService.creditWallet(
                userId,
                new BigDecimal("500.00"),
                WalletTransactionType.TOPUP,
                WalletSourceType.TOPUP,
                "PAY-123",
                null,
                null,
                null,
                "Topup ₹500",
                "topup_123",
                "CUSTOMER"
        );

        assertNotNull(txn);
        assertEquals(new BigDecimal("1500.00"), wallet.getAvailableBalance());
        assertEquals(WalletTransactionDirection.CREDIT, txn.getTransactionDirection());
        verify(walletRepository).save(wallet);
        verify(transactionRepository).save(any(WalletTransaction.class));
    }

    @Test
    @DisplayName("Should successfully debit money from wallet during checkout")
    void testDebitWalletSuccess() {
        when(walletRepository.findByUserIdWithLock(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletTransaction txn = walletService.debitWallet(
                userId,
                new BigDecimal("400.00"),
                WalletTransactionType.WALLET_PAYMENT,
                WalletSourceType.ORDER,
                "ORD-999",
                UUID.randomUUID(),
                null,
                "Order checkout payment",
                "chk_999",
                "CUSTOMER"
        );

        assertNotNull(txn);
        assertEquals(new BigDecimal("600.00"), wallet.getAvailableBalance());
        assertEquals(WalletTransactionDirection.DEBIT, txn.getTransactionDirection());
        verify(walletRepository).save(wallet);
    }

    @Test
    @DisplayName("Should throw exception when debit amount exceeds available balance")
    void testDebitWalletInsufficientBalance() {
        when(walletRepository.findByUserIdWithLock(userId)).thenReturn(Optional.of(wallet));

        assertThrows(IllegalStateException.class, () -> 
            walletService.debitWallet(
                    userId,
                    new BigDecimal("2000.00"),
                    WalletTransactionType.WALLET_PAYMENT,
                    WalletSourceType.ORDER,
                    "ORD-999",
                    null,
                    null,
                    "Overdraw attempt",
                    "chk_overdraw",
                    "CUSTOMER"
            )
        );
    }

    @Test
    @DisplayName("Should process bank withdrawal request atomically")
    void testRequestWithdrawal() {
        when(walletRepository.findByUserIdWithLock(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(withdrawalRepository.save(any(WalletWithdrawal.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletDtos.WithdrawRequest req = WalletDtos.WithdrawRequest.builder()
                .amount(new BigDecimal("300.00"))
                .bankName("HDFC Bank")
                .accountNumber("5010099887766")
                .ifscCode("HDFC0001234")
                .accountHolderName("Test Customer")
                .build();

        WalletDtos.WithdrawalResponse res = walletService.requestWithdrawal(userId, req);

        assertNotNull(res);
        assertEquals(new BigDecimal("700.00"), wallet.getAvailableBalance());
        assertEquals(WithdrawalStatus.REQUESTED, res.getStatus());
        assertEquals("••••7766", res.getAccountNumberMasked());
    }

    @Test
    @DisplayName("Should process refund directly into user wallet")
    void testProcessRefundToWallet() {
        when(walletRepository.findByUserIdWithLock(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletTransaction refundTxn = walletService.processRefundToWallet(
                userId,
                new BigDecimal("250.00"),
                UUID.randomUUID(),
                null,
                "REF-555",
                "Order cancellation",
                "SYSTEM"
        );

        assertNotNull(refundTxn);
        assertEquals(new BigDecimal("1250.00"), wallet.getAvailableBalance());
        assertEquals(WalletTransactionType.REFUND, refundTxn.getTransactionType());
    }

    @Test
    @DisplayName("Should create topup intent with persisted record and gateway order")
    void testCreateTopupIntent() {
        com.sporekart.payment.application.PaymentGateway.InitiatePaymentResult initResult =
                com.sporekart.payment.application.PaymentGateway.InitiatePaymentResult.builder()
                        .razorpayOrderId("order_topup_123")
                        .amountInr(new BigDecimal("500.00"))
                        .currency("INR")
                        .razorpayKeyId("rzp_test_key")
                        .build();

        when(paymentGateway.createPaymentOrder(isNull(), anyString(), eq(new BigDecimal("500.00"))))
                .thenReturn(initResult);
        when(topupIntentRepository.save(any(WalletTopupIntent.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletDtos.AddMoneyResponse res = walletService.createTopupIntent(userId, new BigDecimal("500.00"));

        assertNotNull(res);
        assertEquals("order_topup_123", res.getRazorpayOrderId());
        assertEquals(new BigDecimal("500.00"), res.getAmountInr());
        verify(topupIntentRepository, times(1)).save(any(WalletTopupIntent.class));
    }

    @Test
    @DisplayName("Should verify topup using authoritative intent amount, ignoring client manipulation")
    void testVerifyTopupAuthoritativeAmount() {
        WalletTopupIntent intent = WalletTopupIntent.builder()
                .userId(userId)
                .amount(new BigDecimal("500.00")) // Authoritative amount
                .razorpayOrderId("order_topup_123")
                .transactionReference("TOPUP-123")
                .status("PENDING")
                .build();

        when(topupIntentRepository.findByRazorpayOrderId("order_topup_123")).thenReturn(Optional.of(intent));
        when(paymentGateway.verifySignature("order_topup_123", "pay_123", "valid_sig")).thenReturn(true);
        when(walletRepository.findByUserIdWithLock(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        WalletTransaction txn = walletService.verifyTopup(userId, "order_topup_123", "pay_123", "valid_sig");

        assertNotNull(txn);
        // Balance increases by exactly 500 (authoritative), not any client value
        assertEquals(new BigDecimal("1500.00"), wallet.getAvailableBalance());
        assertEquals("COMPLETED", intent.getStatus());
        assertEquals("pay_123", intent.getRazorpayPaymentId());
        verify(topupIntentRepository, times(1)).save(intent);
    }

    @Test
    @DisplayName("Should reject topup verification when signature is invalid")
    void testVerifyTopupInvalidSignature() {
        WalletTopupIntent intent = WalletTopupIntent.builder()
                .userId(userId)
                .amount(new BigDecimal("500.00"))
                .razorpayOrderId("order_topup_123")
                .status("PENDING")
                .build();

        when(topupIntentRepository.findByRazorpayOrderId("order_topup_123")).thenReturn(Optional.of(intent));
        when(paymentGateway.verifySignature("order_topup_123", "pay_123", "bad_sig")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () ->
                walletService.verifyTopup(userId, "order_topup_123", "pay_123", "bad_sig")
        );
    }
}
