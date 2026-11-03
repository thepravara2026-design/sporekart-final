-- ====================================================================
-- Sporekart Database Least-Privilege Role Setup
-- ====================================================================
-- This script configures a dedicated, non-superuser application role 'sporekart_app'
-- with minimal necessary privileges (DML on public schema and Flyway migration execution),
-- avoiding the use of the superuser ('postgres') in production.
-- ====================================================================

-- 1. Create the application user with a secure password placeholder
-- NOTE: In production, generate a cryptographically strong 32+ character random secret.
CREATE ROLE sporekart_app WITH LOGIN PASSWORD '${SPOREKART_APP_DB_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

-- 2. Grant schema usage and creation (needed for Flyway migrations)
GRANT USAGE, CREATE ON SCHEMA public TO sporekart_app;

-- 3. Grant standard DML permissions on existing tables and sequences
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sporekart_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO sporekart_app;

-- 4. Ensure future tables and sequences created by Flyway migrations also grant privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sporekart_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO sporekart_app;

-- 5. Verification query to confirm sporekart_app is NOT a superuser
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
WHERE rolname = 'sporekart_app';

