package com.sporekart.shipping.infrastructure;

import com.sporekart.shipping.domain.ShipmentTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShipmentTrackingRepository extends JpaRepository<ShipmentTracking, UUID> {
    List<ShipmentTracking> findByShipmentIdOrderByTimestampDesc(UUID shipmentId);
}
