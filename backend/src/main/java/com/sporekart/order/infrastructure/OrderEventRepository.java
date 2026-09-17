package com.sporekart.order.infrastructure;

import com.sporekart.order.domain.OrderEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderEventRepository extends JpaRepository<OrderEvent, UUID> {

    List<OrderEvent> findByOrderIdOrderByCreatedAtDesc(UUID orderId);
}
