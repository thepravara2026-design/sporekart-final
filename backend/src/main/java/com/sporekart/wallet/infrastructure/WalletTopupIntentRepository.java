package com.sporekart.wallet.infrastructure;

import com.sporekart.wallet.domain.WalletTopupIntent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletTopupIntentRepository extends JpaRepository<WalletTopupIntent, UUID> {

    Optional<WalletTopupIntent> findByRazorpayOrderId(String razorpayOrderId);

    Optional<WalletTopupIntent> findByTransactionReference(String transactionReference);
}
