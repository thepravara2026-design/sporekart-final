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

    Optional<Cart> findBySessionIdAndStatus(String sessionId, CartStatus status);

    @Query("SELECT c FROM Cart c WHERE (c.userId = :userId OR c.sessionId = :sessionId) AND c.status = :status")
    Optional<Cart> findActiveCart(UUID userId, String sessionId, CartStatus status);

    java.util.List<Cart> findByStatusAndUpdatedAtBefore(CartStatus status, java.time.OffsetDateTime cutoff);
}
