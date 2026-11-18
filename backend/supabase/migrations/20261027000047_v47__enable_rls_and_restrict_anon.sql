-- V47: Enable Row Level Security (RLS) and Restrict Anon/Authenticated Access on All Tables
--
-- Security Goal:
-- 1. Enforce Row Level Security (RLS) on every table in the public schema.
-- 2. Revoke direct access from Supabase PostgREST roles ('anon', 'authenticated').
-- 3. With RLS enabled and no policies granting permissions to 'anon', any anonymous or
--    unauthorized direct API calls via Supabase's HTTP PostgREST gateway fail-closed.
-- 4. The Sporekart backend connects via direct Postgres JDBC connection or service_role,
--    which bypasses RLS and maintains full administrative and business logic capabilities.

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT LIKE 'flyway_%'
    LOOP
        -- Enable Row Level Security
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);

        -- Revoke all permissions from anon and authenticated PostgREST roles if they exist
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', tbl.tablename);
        END IF;

        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated;', tbl.tablename);
        END IF;
    END LOOP;
END $$;

