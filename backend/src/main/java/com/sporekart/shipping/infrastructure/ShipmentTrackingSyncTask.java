package com.sporekart.shipping.infrastructure;

import com.sporekart.shipping.application.ShippingService;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sporekart.shipping.tracking-sync.enabled", havingValue = "true", matchIfMissing = true)
public class ShipmentTrackingSyncTask {

    private final ShipmentRepository shipmentRepository;
    private final ShippingService shippingService;

    /**
     * Periodic background reconciliation for active, non-terminal shipments.
     * Defaults to every 4 hours, configurable via sporekart.shipping.tracking-sync.cron.
     */
    @Scheduled(cron = "${sporekart.shipping.tracking-sync.cron:0 0 */4 * * *}")
    @SchedulerLock(name = "ShipmentTrackingSyncTask_sync", lockAtMostFor = "3h", lockAtLeastFor = "10m")
    public void syncActiveShipmentTracking() {
        log.info("Starting scheduled background tracking synchronization for active shipments...");
        try {
            List<ShipmentStatus> activeStatuses = List.of(
                    ShipmentStatus.PICKUP_SCHEDULED,
                    ShipmentStatus.IN_TRANSIT,
                    ShipmentStatus.OUT_FOR_DELIVERY
            );
            List<Shipment> activeShipments = shipmentRepository.findByStatusIn(activeStatuses);
            log.info("Found {} active shipments pending tracking sync", activeShipments.size());

            int syncedCount = 0;
            for (Shipment shipment : activeShipments) {
                try {
                    shippingService.updateTrackingStatus(shipment.getId());
                    syncedCount++;
                } catch (Exception e) {
                    log.warn("Failed tracking sync for shipment {}: {}", shipment.getId(), e.getMessage());
                }
            }
            log.info("Completed background tracking sync. Successfully processed: {}/{}", syncedCount, activeShipments.size());
        } catch (Exception e) {
            log.error("Error occurred during scheduled tracking sync: {}", e.getMessage(), e);
        }
    }
}
