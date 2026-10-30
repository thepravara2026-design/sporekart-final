package com.sporekart.shared.infrastructure;

import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class SchedulerLockConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        // Defensive initialization: ensure shedlock table exists for test profiles where Flyway is disabled
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS shedlock (
                    name VARCHAR(64) NOT NULL PRIMARY KEY,
                    lock_until TIMESTAMP WITH TIME ZONE NOT NULL,
                    locked_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    locked_by VARCHAR(255) NOT NULL
                )
            """);
        } catch (Exception ignored) {
            // Already created or managed by Flyway V46 in production
        }

        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(jdbcTemplate)
                        .usingDbTime()
                        .build()
        );
    }
}
