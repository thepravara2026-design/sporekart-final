package com.sporekart.wallet.infrastructure;

import com.sporekart.wallet.domain.WalletTransaction;
import com.sporekart.wallet.domain.WalletTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {

    Optional<WalletTransaction> findByTransactionReference(String transactionReference);

    Optional<WalletTransaction> findByIdempotencyKey(String idempotencyKey);

    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(UUID walletId);

    Page<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(UUID walletId, Pageable pageable);

    @Query("SELECT wt FROM WalletTransaction wt WHERE wt.walletId = :walletId " +
           "AND (:type IS NULL OR wt.transactionType = :type) " +
           "AND (:search IS NULL OR :search = '' OR wt.transactionReference LIKE %:search% OR wt.description LIKE %:search% OR CAST(wt.orderId AS string) LIKE %:search%) " +
           "ORDER BY wt.createdAt DESC")
    Page<WalletTransaction> filterTransactions(
            @Param("walletId") UUID walletId,
            @Param("type") WalletTransactionType type,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT wt FROM WalletTransaction wt WHERE " +
           "(:search IS NULL OR :search = '' OR wt.transactionReference LIKE %:search% OR wt.description LIKE %:search% OR wt.createdBy LIKE %:search%) " +
           "ORDER BY wt.createdAt DESC")
    Page<WalletTransaction> findAllFiltered(@Param("search") String search, Pageable pageable);

    List<WalletTransaction> findByOrderId(UUID orderId);

    List<WalletTransaction> findByEnrollmentId(UUID enrollmentId);
}
