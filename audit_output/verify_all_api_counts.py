#!/usr/bin/env python3
"""
Verify UI/API vs Database Record Counts across all key domain models.
"""

import json
import urllib.request
import ssl
import pg8000.native

DB_HOST = "aws-0-ap-northeast-1.pooler.supabase.com"
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.irwiiyowpppdynbmwwuz"
DB_PASS = "MyDbSporekart@123#"
API_BASE = "http://localhost:8080/api/v1"

def run_counts_audit():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    con = pg8000.native.Connection(
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        ssl_context=ctx
    )

    results = []

    # 1. Categories
    db_cat_cnt = con.run("SELECT COUNT(*) FROM categories;")[0][0]
    api_cat_cnt = None
    try:
        req = urllib.request.Request(f"{API_BASE}/catalog/categories")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            api_cat_cnt = len(data.get('data', []))
    except Exception as e:
        print("Cat error:", e)
    results.append({
        "entity": "Categories",
        "api_endpoint": "GET /catalog/categories",
        "db_count": db_cat_cnt,
        "api_count": api_cat_cnt,
        "match": (db_cat_cnt == api_cat_cnt)
    })

    # 2. Products (Active / Catalog)
    db_prod_cnt = con.run("SELECT COUNT(*) FROM products;")[0][0]
    api_prod_cnt = None
    try:
        req = urllib.request.Request(f"{API_BASE}/catalog/products?page=0&size=100")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            api_prod_cnt = len(data.get('data', []))
    except Exception as e:
        print("Prod error:", e)
    results.append({
        "entity": "Products",
        "api_endpoint": "GET /catalog/products?size=100",
        "db_count": db_prod_cnt,
        "api_count": api_prod_cnt,
        "match": (db_prod_cnt == api_prod_cnt)
    })

    # 3. Courses
    db_course_cnt = con.run("SELECT COUNT(*) FROM courses;")[0][0]
    api_course_cnt = None
    course_ids = []
    try:
        req = urllib.request.Request(f"{API_BASE}/training/courses")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            c_list = data.get('data', [])
            api_course_cnt = len(c_list)
            course_ids = [c['id'] for c in c_list]
    except Exception as e:
        print("Course error:", e)
    results.append({
        "entity": "Courses",
        "api_endpoint": "GET /training/courses",
        "db_count": db_course_cnt,
        "api_count": api_course_cnt,
        "match": (db_course_cnt == api_course_cnt)
    })

    # 4. Batches (sum across courses)
    db_batch_cnt = con.run("SELECT COUNT(*) FROM batches;")[0][0]
    api_batch_cnt = 0
    try:
        for cid in course_ids:
            req = urllib.request.Request(f"{API_BASE}/training/courses/{cid}/batches")
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                api_batch_cnt += len(data.get('data', []))
    except Exception as e:
        print("Batch error:", e)
    results.append({
        "entity": "Batches",
        "api_endpoint": "GET /training/courses/{id}/batches (aggregate)",
        "db_count": db_batch_cnt,
        "api_count": api_batch_cnt,
        "match": (db_batch_cnt == api_batch_cnt)
    })

    # 5. Blog Posts
    db_blog_cnt = con.run("SELECT COUNT(*) FROM blog_posts WHERE status = 'PUBLISHED';")[0][0]
    db_blog_total = con.run("SELECT COUNT(*) FROM blog_posts;")[0][0]
    api_blog_cnt = None
    try:
        req = urllib.request.Request(f"{API_BASE}/content/posts")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            api_blog_cnt = data.get('data', {}).get('totalElements', len(data.get('data', {}).get('content', [])))
    except Exception as e:
        print("Blog error:", e)
    results.append({
        "entity": "Blog Posts (Published)",
        "api_endpoint": "GET /content/posts",
        "db_count": db_blog_cnt,
        "api_count": api_blog_cnt,
        "match": (db_blog_cnt == api_blog_cnt),
        "notes": f"Total in DB including drafts: {db_blog_total}"
    })

    con.close()

    print("\n=== API vs DB COUNT ALIGNMENT ===")
    for r in results:
        status_str = "MATCH" if r['match'] else "MISMATCH"
        print(f"[{status_str}] {r['entity']:25} | DB: {r['db_count']:4} | API: {r['api_count']:4} | {r['api_endpoint']}")

    with open("audit_output/api_vs_db_counts.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

if __name__ == '__main__':
    run_counts_audit()
