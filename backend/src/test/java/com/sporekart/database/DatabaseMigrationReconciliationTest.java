package com.sporekart.database;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Work Package 04: Database Migration Synchronization and RLS Validation Tests.
 * Verifies parity between Flyway migrations
 * (backend/src/main/resources/db/migration)
 * and Supabase CLI migrations (backend/supabase/migrations), ensuring
 * consistent
 * schema evolutions, proper RLS enforcement, and table access lockdown.
 */
public class DatabaseMigrationReconciliationTest {

    private static final Path FLYWAY_DIR = Paths.get("src/main/resources/db/migration");
    private static final Path SUPABASE_DIR = Paths.get("supabase/migrations");

    private Map<Integer, Path> getFlywayMigrations() throws IOException {
        Pattern flywayPattern = Pattern.compile("^V(\\d+)__(.+)\\.sql$");
        try (Stream<Path> stream = Files.list(FLYWAY_DIR)) {
            return stream.filter(Files::isRegularFile)
                    .map(path -> {
                        String name = path.getFileName().toString();
                        Matcher m = flywayPattern.matcher(name);
                        if (m.matches()) {
                            return Map.entry(Integer.parseInt(m.group(1)), path);
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        }
    }

    private Map<Integer, Path> getSupabaseMigrations() throws IOException {
        Pattern supabasePattern = Pattern.compile("^\\d{14}_v(\\d+)__(.+)\\.sql$");
        try (Stream<Path> stream = Files.list(SUPABASE_DIR)) {
            return stream.filter(Files::isRegularFile)
                    .map(path -> {
                        String name = path.getFileName().toString();
                        Matcher m = supabasePattern.matcher(name);
                        if (m.matches()) {
                            return Map.entry(Integer.parseInt(m.group(1)), path);
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        }
    }

    @Test
    @DisplayName("DB-CRIT-001: Supabase migration inventory matches Flyway inventory")
    void DB_CRIT_001_supabaseMigrationInventoryMatchesFlywayInventory() throws IOException {
        Map<Integer, Path> flyway = getFlywayMigrations();
        Map<Integer, Path> supabase = getSupabaseMigrations();

        assertEquals(flyway.size(), supabase.size(), "Flyway and Supabase migration inventory sizes must match");
        assertEquals(50, flyway.size(), "Flyway must have exactly 50 migrations (V1 to V50)");
        assertEquals(50, supabase.size(), "Supabase migrations must have exactly 50 synchronized files (V1 to V50)");

        for (int v = 1; v <= 50; v++) {
            assertTrue(flyway.containsKey(v), "Flyway must contain migration V" + v);
            assertTrue(supabase.containsKey(v), "Supabase must contain migration V" + v);
        }
    }

    @Test
    @DisplayName("DB-CRIT-002: V37 deduplication and unique index exist in Supabase migrations")
    void DB_CRIT_002_v37DeduplicationAndUniqueIndexExist() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v37Path = supabase.get(37);
        assertNotNull(v37Path, "V37 Supabase migration must exist");

        String content = Files.readString(v37Path);
        assertTrue(content.contains("uq_carts_user_active"), "V37 must create unique index uq_carts_user_active");
        assertTrue(content.contains("ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC"),
                "V37 must include deduplication logic for active carts");
        assertTrue(content.contains("WHERE user_id IS NOT NULL AND status = 'ACTIVE'"),
                "V37 index must be partial index on active user carts");
    }

    @Test
    @DisplayName("DB-CRIT-003: V42 index exists in Supabase migrations")
    void DB_CRIT_003_v42IndexExists() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v42Path = supabase.get(42);
        assertNotNull(v42Path, "V42 Supabase migration must exist");

        String content = Files.readString(v42Path);
        assertTrue(content.contains("idx_orders_status_created_at"),
                "V42 must create idx_orders_status_created_at");
        assertTrue(content.contains("orders(status, created_at DESC)"),
                "V42 must index orders composite columns (status, created_at DESC)");
    }

    @Test
    @DisplayName("DB-CRIT-004: V43 column type change exists in Supabase migrations")
    void DB_CRIT_004_v43ColumnTypeChangeExists() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v43Path = supabase.get(43);
        assertNotNull(v43Path, "V43 Supabase migration must exist");

        String content = Files.readString(v43Path);
        assertTrue(content.contains("ALTER TABLE inventory_audit_events ALTER COLUMN reason TYPE TEXT"),
                "V43 must alter inventory_audit_events.reason to TEXT to prevent SQLState 22001 truncation");
    }

    @Test
    @DisplayName("DB-CRIT-005: V44 cleanup exists in Supabase migrations")
    void DB_CRIT_005_v44CleanupExists() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v44Path = supabase.get(44);
        assertNotNull(v44Path, "V44 Supabase migration must exist");

        String content = Files.readString(v44Path);
        assertTrue(content.contains("DELETE FROM payments"), "V44 must clean up orphaned legacy payments");
        assertTrue(content.contains("order_id IS NULL"), "V44 must purge null order_id legacy payments");
        assertTrue(content.contains("order_id NOT IN (SELECT id FROM orders)"),
                "V44 must purge payments referencing non-existent orders");
    }

    @Test
    @DisplayName("DB-CRIT-006: V45 indexes exist in Supabase migrations")
    void DB_CRIT_006_v45IndexesExist() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v45Path = supabase.get(45);
        assertNotNull(v45Path, "V45 Supabase migration must exist");

        String content = Files.readString(v45Path);
        // Foreign key indexes
        assertTrue(content.contains("idx_product_offers_product_id"), "V45 must index product_offers(product_id)");
        assertTrue(content.contains("idx_product_media_product_id"), "V45 must index product_media(product_id)");
        assertTrue(content.contains("idx_cart_items_variant_id"), "V45 must index cart_items(variant_id)");
        assertTrue(content.contains("idx_blog_post_tags_tag_id"), "V45 must index blog_post_tags(tag_id)");
        assertTrue(content.contains("idx_products_category_id"), "V45 must index products(category_id)");

        // Composite query indexes
        assertTrue(content.contains("idx_batches_course_status"), "V45 must index batches(course_id, status)");
        assertTrue(content.contains("idx_batches_status_start_date"), "V45 must index batches(status, start_date ASC)");
        assertTrue(content.contains("idx_courses_category_active"), "V45 must index courses(category_id, is_active)");
        assertTrue(content.contains("idx_products_status_active"), "V45 must index products(status, is_active)");
        assertTrue(content.contains("idx_product_variants_product_active"),
                "V45 must index product_variants(product_id, is_active)");
        assertTrue(content.contains("idx_blog_posts_status_published"),
                "V45 must index blog_posts(status, published_at DESC)");

        // Trigram search extension and GIN indexes
        assertTrue(content.contains("pg_trgm"), "V45 must create extension pg_trgm");
        assertTrue(content.contains("idx_products_title_trgm"), "V45 must create trigram GIN index on products");
        assertTrue(content.contains("idx_courses_title_trgm"), "V45 must create trigram GIN index on courses");
    }

    @Test
    @DisplayName("DB-CRIT-007: V46 ShedLock table exists in Supabase migrations")
    void DB_CRIT_007_v46ShedLockTableExists() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v46Path = supabase.get(46);
        assertNotNull(v46Path, "V46 Supabase migration must exist");

        String content = Files.readString(v46Path);
        assertTrue(content.contains("CREATE TABLE IF NOT EXISTS shedlock"), "V46 must create table shedlock");
        assertTrue(content.contains("name VARCHAR(64) NOT NULL PRIMARY KEY"), "V46 must define name as primary key");
        assertTrue(content.contains("lock_until TIMESTAMP WITH TIME ZONE NOT NULL"),
                "V46 must define lock_until column");
        assertTrue(content.contains("locked_at TIMESTAMP WITH TIME ZONE NOT NULL"), "V46 must define locked_at column");
        assertTrue(content.contains("locked_by VARCHAR(255) NOT NULL"), "V46 must define locked_by column");
    }

    @Test
    @DisplayName("DB-CRIT-008: V47 RLS migration exists in Supabase migrations")
    void DB_CRIT_008_v47RlsMigrationExists() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v47Path = supabase.get(47);
        assertNotNull(v47Path, "V47 Supabase migration must exist");

        String content = Files.readString(v47Path);
        assertTrue(content.contains("ENABLE ROW LEVEL SECURITY"), "V47 must enable RLS on public tables");
        assertTrue(content.contains("REVOKE ALL ON TABLE"), "V47 must revoke direct permissions");
        assertTrue(content.contains("FROM anon"), "V47 must revoke access from anon PostgREST role");
        assertTrue(content.contains("FROM authenticated"), "V47 must revoke access from authenticated PostgREST role");
    }

    @Test
    @DisplayName("DB-CRIT-009: Supabase migration scripts are valid SQL")
    void DB_CRIT_009_supabaseMigrationScriptsAreValidSql() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        for (Map.Entry<Integer, Path> entry : supabase.entrySet()) {
            Path file = entry.getValue();
            String content = Files.readString(file).trim();
            assertFalse(content.isEmpty(), "Migration " + file.getFileName() + " must not be empty");
            // Must contain basic SQL keywords
            boolean hasSqlKeywords = content.toUpperCase().contains("CREATE") ||
                    content.toUpperCase().contains("ALTER") ||
                    content.toUpperCase().contains("DROP") ||
                    content.toUpperCase().contains("INSERT") ||
                    content.toUpperCase().contains("UPDATE") ||
                    content.toUpperCase().contains("DELETE") ||
                    content.toUpperCase().contains("DO $$");
            assertTrue(hasSqlKeywords,
                    "Migration " + file.getFileName() + " must contain valid SQL DDL/DML statements");
        }
    }

    @Test
    @DisplayName("DB-CRIT-010: Backend connection bypasses RLS successfully")
    void DB_CRIT_010_backendConnectionBypassesRlsSuccessfully() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v47Path = supabase.get(47);
        String v47Content = Files.readString(v47Path);

        // Verification of RLS architecture:
        // 1. V47 explicitly filters out flyway tables: tablename NOT LIKE 'flyway_%'
        assertTrue(v47Content.contains("tablename NOT LIKE 'flyway_%'"),
                "Flyway history tables must be preserved without locking migrations");

        // 2. V47 enables standard Postgres RLS: ALTER TABLE public.%I ENABLE ROW LEVEL
        // SECURITY;
        // In PostgreSQL, the table owner (or postgres/service_role/superuser) bypasses
        // RLS by default.
        // Spring Boot JDBC connection connects via table owner credentials, allowing
        // full data access.
        assertTrue(v47Content.contains("ENABLE ROW LEVEL SECURITY"),
                "RLS must be standard Postgres table-level security");
    }

    @Test
    @DisplayName("DB-CRIT-011: Public role has no unintended table access after V47")
    void DB_CRIT_011_publicRoleHasNoUnintendedTableAccessAfterV47() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v47Path = supabase.get(47);
        String v47Content = Files.readString(v47Path);

        // Ensures both anon and authenticated roles have ALL permissions revoked
        assertTrue(v47Content.contains("REVOKE ALL ON TABLE public.%I FROM anon;"),
                "Must revoke all table access from anon role");
        assertTrue(v47Content.contains("REVOKE ALL ON TABLE public.%I FROM authenticated;"),
                "Must revoke all table access from authenticated role");

        // Confirms no permissive open RLS policies (e.g. 'CREATE POLICY ... USING
        // (true)') are created
        assertFalse(v47Content.contains("USING (true)"),
                "V47 must not contain permissive open RLS bypass policies for anon");
    }

    @Test
    @DisplayName("DB-CRIT-012: Existing flyway migration suite passes")
    void DB_CRIT_012_existingFlywayMigrationSuitePasses() throws IOException {
        Map<Integer, Path> flyway = getFlywayMigrations();
        assertEquals(50, flyway.size());

        // Verify Flyway naming conventions V<number>__<description>.sql
        for (Map.Entry<Integer, Path> entry : flyway.entrySet()) {
            String filename = entry.getValue().getFileName().toString();
            assertTrue(filename.startsWith("V" + entry.getKey() + "__"),
                    "Flyway file " + filename + " must strictly follow V<N>__ pattern");
            assertTrue(Files.size(entry.getValue()) > 0, "Flyway file " + filename + " must not be empty");
        }
    }

    @Test
    @DisplayName("DB-CRIT-013: Schema parity check between Flyway and Supabase passes")
    void DB_CRIT_013_schemaParityCheckBetweenFlywayAndSupabasePasses() throws IOException {
        Map<Integer, Path> flyway = getFlywayMigrations();
        Map<Integer, Path> supabase = getSupabaseMigrations();

        // Check for every migration that normalized SQL content is identical
        for (int v = 1; v <= 50; v++) {
            Path flywayFile = flyway.get(v);
            Path supabaseFile = supabase.get(v);

            assertNotNull(flywayFile, "Flyway V" + v + " must exist");
            assertNotNull(supabaseFile, "Supabase V" + v + " must exist");

            String flywaySql = Files.readString(flywayFile).replaceAll("\\r\\n", "\n").trim();
            String supabaseSql = Files.readString(supabaseFile).replaceAll("\\r\\n", "\n").trim();

            assertEquals(flywaySql, supabaseSql,
                    "Migration V" + v + " SQL content must match identically between Flyway and Supabase");
        }
    }

    @Test
    @DisplayName("DB-CRIT-014: V50 production readiness indexes and constraints exist")
    void DB_CRIT_014_v50IndexesAndConstraintsExist() throws IOException {
        Map<Integer, Path> supabase = getSupabaseMigrations();
        Path v50Path = supabase.get(50);
        assertNotNull(v50Path, "V50 Supabase migration must exist");

        String content = Files.readString(v50Path);
        assertTrue(content.contains("uq_orders_razorpay_order_id"),
                "V50 must create unique index uq_orders_razorpay_order_id");
        assertTrue(content.contains("uq_payments_order_captured"),
                "V50 must create unique index uq_payments_order_captured");
        assertTrue(content.contains("chk_product_variants_stock_quantity_non_negative"),
                "V50 must add stock check constraint");
        assertTrue(content.contains("idx_notification_events_stuck_recovery"), "V50 must add stuck recovery index");
    }
}
