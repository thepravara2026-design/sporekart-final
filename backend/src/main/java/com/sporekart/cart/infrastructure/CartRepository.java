package com.sporekart.cart.infrastructure;

import com.sporekart.cart.domain.Cart;
import com.sporekart.cart.domain.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {

    Optional<Cart> findByUserIdAndStatus(UUID userId, CartStatus status);

    java.util.List<Cart> findAllByUserIdAndStatusOrderByUpdatedAtDesc(UUID userId, CartStatus status);

    Optional<Cart> findBySessionIdAndStatus(String sessionId, CartStatus status);

    java.util.List<Cart> findAllBySessionIdAndStatusOrderByUpdatedAtDesc(String sessionId, CartStatus status);

    @Query("SELECT c FROM Cart c WHERE (c.userId = :userId OR c.sessionId = :sessionId) AND c.status = :status")
    Optional<Cart> findActiveCart(@org.springframework.data.repository.query.Param("userId") UUID userId, @org.springframework.data.repository.query.Param("sessionId") String sessionId, @org.springframework.data.repository.query.Param("status") CartStatus status);

    java.util.List<Cart> findByStatusAndUpdatedAtBefore(CartStatus status, java.time.OffsetDateTime cutoff);

    @Query(value = "SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtext(:lockKey))) as lock_subquery", nativeQuery = true)
    Integer acquireAdvisoryLock(@org.springframework.data.repository.query.Param("lockKey") String lockKey);
}
