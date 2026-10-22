import pg8000.native, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
con = pg8000.native.Connection(
    user='postgres.irwiiyowpppdynbmwwuz',
    password='MyDbSporekart@123#',
    host='aws-0-ap-northeast-1.pooler.supabase.com',
    port=6543,
    database='postgres',
    ssl_context=ctx
)

print('=== 1. Checking Flyway Migration History ===')
rows = con.run('SELECT installed_rank, version, description, success, execution_time FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 3;')
for r in rows:
    print(r)

print('\n=== 2. Checking Legacy Tables Existence ===')
leg_rows = con.run("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('training_bookings', 'training_slots', 'product_images');")
print('Legacy tables found in DB:', [r[0] for r in leg_rows])

print('\n=== 3. Checking Batch Enrolled Count Reconciliation ===')
b_rows = con.run('''
    SELECT b.batch_code, b.enrolled_count, b.capacity,
           COALESCE(sub.confirmed_cnt, 0) as confirmed_enrollments
    FROM batches b
    LEFT JOIN (
        SELECT batch_id, COUNT(*) as confirmed_cnt
        FROM enrollments
        WHERE status IN ('CONFIRMED', 'COMPLETED')
        GROUP BY batch_id
    ) sub ON sub.batch_id = b.id
    ORDER BY b.batch_code;
''')
for r in b_rows:
    print(r)

print('\n=== 4. Checking Unindexed Foreign Keys Remaining ===')
sql_unindexed = """
SELECT
    c.conrelid::regclass AS table_name,
    c.conname AS foreign_key_name,
    string_agg(a.attname, ', ') AS fk_columns
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
GROUP BY c.conrelid, c.conname, c.conkey
HAVING NOT EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND c.conkey::smallint[] <@ i.indkey::smallint[]
)
ORDER BY table_name, foreign_key_name;
"""
unindexed_rows = con.run(sql_unindexed)
print(f'Total unindexed foreign keys remaining: {len(unindexed_rows)}')
for r in unindexed_rows:
    print(r)

con.close()
