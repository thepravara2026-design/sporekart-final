package com.sporekart.admin.infrastructure;

import com.sporekart.admin.domain.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, UUID> {
}
