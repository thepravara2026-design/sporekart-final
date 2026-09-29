package com.sporekart.wallet.infrastructure;

import com.sporekart.wallet.domain.WalletWithdrawal;
import com.sporekart.wallet.domain.WithdrawalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletWithdrawalRepository extends JpaRepository<WalletWithdrawal, UUID> {

    Optional<WalletWithdrawal> findByWithdrawalReference(String withdrawalReference);

    List<WalletWithdrawal> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<WalletWithdrawal> findByWalletIdOrderByCreatedAtDesc(UUID walletId);

    Page<WalletWithdrawal> findByWalletIdOrderByCreatedAtDesc(UUID walletId, Pageable pageable);

    Page<WalletWithdrawal> findByStatusOrderByCreatedAtDesc(WithdrawalStatus status, Pageable pageable);

    Page<WalletWithdrawal> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
