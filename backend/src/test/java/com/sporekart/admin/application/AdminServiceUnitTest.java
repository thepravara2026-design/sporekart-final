package com.sporekart.admin.application;

import com.sporekart.admin.domain.AdminAuditLog;
import com.sporekart.admin.infrastructure.AdminAuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceUnitTest {

    @Mock
    private AdminAuditLogRepository auditLogRepository;

    @InjectMocks
    private AdminApplicationService adminService;

    private UUID adminUserId;
    private AdminAuditLog testLog;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();

        testLog = AdminAuditLog.builder()
                .id(UUID.randomUUID())
                .adminUserId(adminUserId)
                .action("UPDATE_PRODUCT")
                .resourceType("PRODUCT")
                .resourceId("prod-123")
                .details("Price updated to 120")
                .build();
    }

    @Test
    @DisplayName("ADM-1: Log action saves audit log entry with details")
    void ADM_1_logAction() {
        adminService.logAction(adminUserId, "UPDATE_PRODUCT", "PRODUCT", "prod-123", "100", "120", "Price updated", "127.0.0.1");

        verify(auditLogRepository).save(any(AdminAuditLog.class));
    }

    @Test
    @DisplayName("ADM-2: Get all audit logs returns all saved entries")
    void ADM_2_getAllAuditLogs() {
        when(auditLogRepository.findAll()).thenReturn(List.of(testLog));

        List<AdminAuditLog> logs = adminService.getAllAuditLogs();

        assertEquals(1, logs.size());
        assertEquals("UPDATE_PRODUCT", logs.get(0).getAction());
    }

    @Test
    @DisplayName("ADM-3: Get all audit logs with pagination returns Page")
    void ADM_3_getAllAuditLogs_paginated() {
        Page<AdminAuditLog> page = new PageImpl<>(List.of(testLog));
        when(auditLogRepository.findAll(any(Pageable.class))).thenReturn(page);

        Page<AdminAuditLog> result = adminService.getAllAuditLogs(Pageable.unpaged());

        assertEquals(1, result.getTotalElements());
    }
}
