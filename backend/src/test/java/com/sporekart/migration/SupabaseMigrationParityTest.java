package com.sporekart.migration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Finding H-05: Automated verification test preventing directory drift
 * between backend Flyway migrations and backend Supabase migrations.
 */
class SupabaseMigrationParityTest {

    private static final Pattern FLYWAY_PATTERN = Pattern.compile("^V(\\d+)__.*\\.sql$");
    private static final Pattern SUPABASE_PATTERN = Pattern.compile("^\\d+_v(\\d+)__.*\\.sql$");

    @Test
    @DisplayName("H-05: Flyway and Supabase migration directories must have 1:1 identical SQL content")
    void testFlywayAndSupabaseMigrationParity() throws IOException, NoSuchAlgorithmException {
        Path flywayDir = resolveDirectory("src/main/resources/db/migration");
        Path supabaseDir = resolveDirectory("supabase/migrations");

        assertTrue(Files.isDirectory(flywayDir), "Flyway migration directory not found: " + flywayDir);
        assertTrue(Files.isDirectory(supabaseDir), "Supabase migration directory not found: " + supabaseDir);

        Map<Integer, Path> flywayFiles = extractVersionMap(flywayDir, FLYWAY_PATTERN);
        Map<Integer, Path> supabaseFiles = extractVersionMap(supabaseDir, SUPABASE_PATTERN);

        assertFalse(flywayFiles.isEmpty(), "No Flyway migration files found in " + flywayDir);
        assertFalse(supabaseFiles.isEmpty(), "No Supabase migration files found in " + supabaseDir);

        assertEquals(flywayFiles.size(), supabaseFiles.size(),
                String.format("Migration file count mismatch! Flyway: %d, Supabase: %d",
                        flywayFiles.size(), supabaseFiles.size()));

        List<Integer> allVersions = new ArrayList<>(flywayFiles.keySet());
        Collections.sort(allVersions);

        List<String> driftErrors = new ArrayList<>();

        for (Integer version : allVersions) {
            Path flywayPath = flywayFiles.get(version);
            Path supabasePath = supabaseFiles.get(version);

            if (supabasePath == null) {
                driftErrors.add(String.format("Missing Supabase migration for Flyway V%d (%s)",
                        version, flywayPath.getFileName()));
                continue;
            }

            String flywaySql = normalizeSql(Files.readString(flywayPath, StandardCharsets.UTF_8));
            String supabaseSql = normalizeSql(Files.readString(supabasePath, StandardCharsets.UTF_8));

            String flywayHash = sha256(flywaySql);
            String supabaseHash = sha256(supabaseSql);

            if (!flywayHash.equals(supabaseHash)) {
                driftErrors.add(String.format("Content drift in V%d: %s (hash: %s) != %s (hash: %s)",
                        version, flywayPath.getFileName(), flywayHash, supabasePath.getFileName(), supabaseHash));
            }
        }

        assertTrue(driftErrors.isEmpty(),
                "Detected migration directory drift between Flyway and Supabase:\n" + String.join("\n", driftErrors));
    }

    private Path resolveDirectory(String relativePath) {
        Path direct = Paths.get(relativePath);
        if (Files.isDirectory(direct)) {
            return direct;
        }
        Path fromBackend = Paths.get("backend").resolve(relativePath);
        if (Files.isDirectory(fromBackend)) {
            return fromBackend;
        }
        Path fromParent = Paths.get("..").resolve(relativePath);
        if (Files.isDirectory(fromParent)) {
            return fromParent;
        }
        return direct;
    }

    private Map<Integer, Path> extractVersionMap(Path directory, Pattern pattern) throws IOException {
        try (Stream<Path> stream = Files.list(directory)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().endsWith(".sql"))
                    .map(p -> {
                        Matcher m = pattern.matcher(p.getFileName().toString());
                        if (m.matches()) {
                            return new AbstractMap.SimpleEntry<>(Integer.parseInt(m.group(1)), p);
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a));
        }
    }

    private String normalizeSql(String sql) {
        return sql.replace("\r\n", "\n").trim();
    }

    private String sha256(String input) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}

