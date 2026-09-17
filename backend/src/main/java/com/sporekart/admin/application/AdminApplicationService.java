package com.sporekart.admin.application;

import com.sporekart.admin.domain.AdminAuditLog;
import com.sporekart.admin.infrastructure.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminApplicationService {

    private final AdminAuditLogRepository auditLogRepository;

    public void logAction(UUID adminUserId, String action, String details) {
        AdminAuditLog log = AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .action(action)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }

    public List<AdminAuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }
}
