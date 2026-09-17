package com.sporekart.shipping.infrastructure;

import com.sporekart.shipping.domain.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {
    Optional<Shipment> findByOrderId(UUID orderId);
    Optional<Shipment> findByProviderShipmentId(String providerShipmentId);
    Optional<Shipment> findByAwbCode(String awbCode);
}
