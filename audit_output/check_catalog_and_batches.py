import pg8000.native, ssl

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

print('=== PRODUCTS BREAKDOWN ===')
print('Total products:', con.run('SELECT COUNT(*) FROM products;')[0][0])
print('Active products (is_active = true):', con.run('SELECT COUNT(*) FROM products WHERE is_active = true;')[0][0])
print("Active products (is_active = true AND status = 'ACTIVE'):", con.run("SELECT COUNT(*) FROM products WHERE is_active = true AND status = 'ACTIVE';")[0][0])
print('Status & is_active distribution:')
for row in con.run("SELECT status, is_active, COUNT(*) FROM products GROUP BY status, is_active;"):
    print(f"  status: {row[0]}, is_active: {row[1]} -> count: {row[2]}")

print('\n=== BATCHES BREAKDOWN ===')
print('Total batches in DB:', con.run('SELECT COUNT(*) FROM batches;')[0][0])
courses = con.run('SELECT id, slug, title FROM courses;')
for cid, slug, title in courses:
    cnt = con.run(f"SELECT COUNT(*) FROM batches WHERE course_id = '{cid}';")[0][0]
    print(f"  Course '{slug}' ({title}): {cnt} batches")

con.close()
