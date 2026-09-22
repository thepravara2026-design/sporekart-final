package com.sporekart.catalog;

import com.sporekart.catalog.domain.StockAvailability;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class StockAvailabilityTest {

    @Test
    void testStockAvailabilityMappingBoundaries() {
        // > 20 -> AVAILABLE ("Available")
        assertEquals(StockAvailability.AVAILABLE, StockAvailability.fromQuantity(25));
        assertEquals("Available", StockAvailability.AVAILABLE.getLabel());

        assertEquals(StockAvailability.AVAILABLE, StockAvailability.fromQuantity(21));

        // 11..20 -> LIMITED_STOCK ("Limited stock")
        assertEquals(StockAvailability.LIMITED_STOCK, StockAvailability.fromQuantity(20));
        assertEquals("Limited stock", StockAvailability.LIMITED_STOCK.getLabel());

        assertEquals(StockAvailability.LIMITED_STOCK, StockAvailability.fromQuantity(15));
        assertEquals(StockAvailability.LIMITED_STOCK, StockAvailability.fromQuantity(11));

        // 1..10 -> LOW_STOCK ("Only a few left. Hurry!")
        assertEquals(StockAvailability.LOW_STOCK, StockAvailability.fromQuantity(10));
        assertEquals("Only a few left. Hurry!", StockAvailability.LOW_STOCK.getLabel());

        assertEquals(StockAvailability.LOW_STOCK, StockAvailability.fromQuantity(9));
        assertEquals(StockAvailability.LOW_STOCK, StockAvailability.fromQuantity(6));
        assertEquals(StockAvailability.LOW_STOCK, StockAvailability.fromQuantity(5));
        assertEquals(StockAvailability.LOW_STOCK, StockAvailability.fromQuantity(1));

        // <= 0 -> OUT_OF_STOCK ("Out of stock")
        assertEquals(StockAvailability.OUT_OF_STOCK, StockAvailability.fromQuantity(0));
        assertEquals("Out of stock", StockAvailability.OUT_OF_STOCK.getLabel());

        assertEquals(StockAvailability.OUT_OF_STOCK, StockAvailability.fromQuantity(-5));
    }
}
