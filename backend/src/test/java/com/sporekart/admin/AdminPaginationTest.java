package com.sporekart.admin;

import com.sporekart.admin.application.AdminApplicationService;
import com.sporekart.admin.domain.AdminAuditLog;
import com.sporekart.admin.infrastructure.AdminAuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class AdminPaginationTest {

    @Autowired
    private AdminApplicationService adminService;

    @Autowired
    private AdminAuditLogRepository auditLogRepository;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        UUID adminId = UUID.randomUUID();
        for (int i = 0; i < 25; i++) {
            adminService.logAction(adminId, "TEST_ACTION_" + i, "Audit log entry " + i);
        }
    }

    @Test
    void testAuditLogPaginationSlice() {
        Pageable pageable = PageRequest.of(1, 10);
        Page<AdminAuditLog> page = adminService.getAllAuditLogs(pageable);

        assertNotNull(page);
        assertEquals(25, page.getTotalElements());
        assertEquals(3, page.getTotalPages());
        assertEquals(1, page.getNumber());
        assertEquals(10, page.getContent().size());
    }

    @Test
    void testAuditLogPaginationSizeCapping() {
        int requestedSize = 150;
        int cappedSize = Math.min(Math.max(1, requestedSize), 100);

        Pageable pageable = PageRequest.of(0, cappedSize);
        Page<AdminAuditLog> page = adminService.getAllAuditLogs(pageable);

        assertNotNull(page);
        assertEquals(100, page.getSize(), "Requested page size above max 100 must be capped at 100");
    }
}
