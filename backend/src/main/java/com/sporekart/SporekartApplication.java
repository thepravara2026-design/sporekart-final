package com.sporekart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class SporekartApplication {

    public static void main(String[] args) {
        loadDotEnvIfPresent();
        SpringApplication.run(SporekartApplication.class, args);
    }

    private static void loadDotEnvIfPresent() {
        File envFile = new File(".env");
        if (!envFile.exists()) {
            envFile = new File("../.env");
        }
        if (!envFile.exists()) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(envFile.toPath());
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                int eqIndex = trimmed.indexOf('=');
                if (eqIndex > 0) {
                    String key = trimmed.substring(0, eqIndex).trim();
                    String value = trimmed.substring(eqIndex + 1).trim();

                    // Remove quotes if present
                    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length() - 1);
                    }

                    // Only set system property if environment variable is not already defined
                    if (System.getenv(key) == null && System.getProperty(key) == null) {
                        System.setProperty(key, value);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Warning: Could not read .env file: " + e.getMessage());
        }
    }
}
