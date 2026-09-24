package com.sporekart.admin.application;

import com.sporekart.admin.domain.AdminAuditLog;
import com.sporekart.admin.infrastructure.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminApplicationService {

    private final AdminAuditLogRepository auditLogRepository;

    public void logAction(UUID adminUserId, String action, String details) {
        logAction(adminUserId, action, null, null, null, null, details, null);
    }

    public void logAction(UUID adminUserId, String action, String resourceType, String resourceId, String oldValue, String newValue, String details, String ipAddress) {
        AdminAuditLog log = AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .oldValue(oldValue)
                .newValue(newValue)
                .details(details)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    public List<AdminAuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }

    public Page<AdminAuditLog> getAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
}
