package com.sporekart.shared;

import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DatabaseSecurityConfigTest {

    @Test
    void testFlywayRlsMigrationExistsAndEnforcesSecurity() throws Exception {
        File migration = new File("src/main/resources/db/migration/V47__enable_rls_and_restrict_anon.sql");
        if (!migration.exists()) {
            migration = new File("backend/src/main/resources/db/migration/V47__enable_rls_and_restrict_anon.sql");
        }
        assertTrue(migration.exists(), "V47 RLS migration must exist");

        String sql = Files.readString(migration.toPath());
        assertTrue(sql.contains("ENABLE ROW LEVEL SECURITY"), "Migration must enable row level security");
        assertTrue(sql.contains("REVOKE ALL ON TABLE"), "Migration must revoke table privileges from unauthenticated roles");
        assertTrue(sql.contains("anon"), "Migration must restrict the anon role");
    }

    @Test
    void testLeastPrivilegeSqlDocumentationExists() throws Exception {
        File doc = new File("../docs/db-least-privilege-setup.sql");
        if (!doc.exists()) {
            doc = new File("docs/db-least-privilege-setup.sql");
        }
        assertTrue(doc.exists(), "db-least-privilege-setup.sql must exist");

        String sql = Files.readString(doc.toPath());
        assertTrue(sql.contains("NOSUPERUSER"), "Least-privilege role must be non-superuser");
        assertTrue(sql.contains("GRANT SELECT, INSERT, UPDATE, DELETE"), "Least-privilege role must grant standard DML");
        assertTrue(sql.contains("sporekart_app"), "Role name should be sporekart_app");
    }

    @Test
    void testDockerComposeBindsToLocalhostAndEnforcesPassword() throws Exception {
        File compose = new File("../docker-compose.yml");
        if (!compose.exists()) {
            compose = new File("docker-compose.yml");
        }
        assertTrue(compose.exists(), "docker-compose.yml must exist");

        String yaml = Files.readString(compose.toPath());
        assertTrue(yaml.contains("127.0.0.1:5432:5432"), "Postgres port must be bound strictly to 127.0.0.1");
        assertFalse(yaml.contains("\"5432:5432\""), "Postgres port must not be exposed to 0.0.0.0");
        assertTrue(yaml.contains("SUPABASE_DB_PASSWORD:?"), "Password must be required and fail if empty");
    }
}
