-- V48: Enforce default privileges for future tables, functions, and sequences in schema public
--
-- Security Goal:
-- 1. Ensure that any future tables created in schema 'public' automatically revoke ALL permissions
--    from the Supabase PostgREST roles ('anon', 'authenticated').
-- 2. Restrict future functions and sequences so anonymous callers cannot invoke or query them.
-- 3. Maintain fail-closed posture for direct PostgREST HTTP queries while allowing Spring Boot
--    JDBC direct connection (running as postgres database owner) to execute normally.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
    END IF;
END $$;

