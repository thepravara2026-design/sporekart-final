package com.sporekart.order.infrastructure;

import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Order> findBySessionIdAndUserIdIsNull(String sessionId);

    List<Order> findBySessionIdAndUserIdIsNullOrderByCreatedAtDesc(String sessionId);

    @Query("SELECT o FROM Order o WHERE (:userId IS NOT NULL AND o.userId = :userId) OR (:sessionId IS NOT NULL AND o.sessionId = :sessionId) ORDER BY o.createdAt DESC")
    List<Order> findByUserIdOrSessionIdOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("sessionId") String sessionId);

    List<Order> findByStatus(OrderStatus status);

    @Query("""
        SELECT pv.product.id, SUM(oi.quantity) as totalSales
        FROM OrderItem oi
        JOIN oi.order o
        JOIN ProductVariant pv ON oi.variantId = pv.id
        WHERE o.status IN (com.sporekart.order.domain.OrderStatus.PAID, com.sporekart.order.domain.OrderStatus.CONFIRMED, com.sporekart.order.domain.OrderStatus.PROCESSING, com.sporekart.order.domain.OrderStatus.SHIPPED, com.sporekart.order.domain.OrderStatus.DELIVERED)
          AND pv.product.status = com.sporekart.catalog.domain.ProductStatus.ACTIVE
        GROUP BY pv.product.id
        ORDER BY totalSales DESC
    """)
    List<Object[]> findTopSellingProductIds();
}
