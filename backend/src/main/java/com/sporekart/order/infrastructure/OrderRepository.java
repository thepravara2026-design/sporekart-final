package com.sporekart.order.infrastructure;

import com.sporekart.order.domain.Order;
import com.sporekart.order.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Order> findByStatus(OrderStatus status);
}
