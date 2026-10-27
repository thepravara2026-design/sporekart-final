package com.sporekart.shipping.infrastructure;

import com.sporekart.shipping.application.ShippingService;
import com.sporekart.shipping.domain.Shipment;
import com.sporekart.shipping.domain.ShipmentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ShipmentTrackingSyncTaskTest {

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private ShippingService shippingService;

    @InjectMocks
    private ShipmentTrackingSyncTask syncTask;

    @Test
    @DisplayName("SYNC-01: Background task syncs active shipments successfully")
    void testSyncActiveShipmentTracking_success() {
        UUID s1Id = UUID.randomUUID();
        UUID s2Id = UUID.randomUUID();

        Shipment s1 = Shipment.builder().id(s1Id).status(ShipmentStatus.IN_TRANSIT).build();
        Shipment s2 = Shipment.builder().id(s2Id).status(ShipmentStatus.OUT_FOR_DELIVERY).build();

        when(shipmentRepository.findByStatusIn(any())).thenReturn(List.of(s1, s2));

        syncTask.syncActiveShipmentTracking();

        verify(shippingService, times(1)).updateTrackingStatus(s1Id);
        verify(shippingService, times(1)).updateTrackingStatus(s2Id);
    }

    @Test
    @DisplayName("SYNC-02: Background task handles empty list gracefully")
    void testSyncActiveShipmentTracking_empty() {
        when(shipmentRepository.findByStatusIn(any())).thenReturn(Collections.emptyList());

        syncTask.syncActiveShipmentTracking();

        verify(shippingService, never()).updateTrackingStatus(any());
    }

    @Test
    @DisplayName("SYNC-03: Individual shipment failure does not halt overall sync loop")
    void testSyncActiveShipmentTracking_individualFailure_continues() {
        UUID s1Id = UUID.randomUUID();
        UUID s2Id = UUID.randomUUID();

        Shipment s1 = Shipment.builder().id(s1Id).status(ShipmentStatus.IN_TRANSIT).build();
        Shipment s2 = Shipment.builder().id(s2Id).status(ShipmentStatus.IN_TRANSIT).build();

        when(shipmentRepository.findByStatusIn(any())).thenReturn(List.of(s1, s2));
        doThrow(new RuntimeException("Simulated tracking failure")).when(shippingService).updateTrackingStatus(s1Id);

        syncTask.syncActiveShipmentTracking();

        verify(shippingService, times(1)).updateTrackingStatus(s1Id);
        verify(shippingService, times(1)).updateTrackingStatus(s2Id);
    }
}
