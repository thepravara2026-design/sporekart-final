#!/usr/bin/env python3
"""
Comprehensive Database Integrity and Financial Reconciliation Engine.
Executes non-destructive read-only queries against PostgreSQL on Supabase.
Verifies:
- Referential integrity & Orphaned records
- Missing foreign key indexes
- Duplicate business records
- Unexpected NULLs
- Invalid references
- Decimal precision & monetary invariants
- Status enum compliance
- Partial records / transaction artifacts
- Inventory balance reconciliation
- Order / payment reconciliation
- Wallet ledger reconciliation
- Training seat-count reconciliation
- API vs DB record count alignment
"""

import os
import sys
import ssl
import json
import urllib.request
import urllib.error
from datetime import datetime
import pg8000.native

DB_HOST = "aws-0-ap-northeast-1.pooler.supabase.com"
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.irwiiyowpppdynbmwwuz"
DB_PASS = "MyDbSporekart@123#"
API_BASE = "http://localhost:8080/api/v1"

def get_connection():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return pg8000.native.Connection(
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        ssl_context=ctx
    )

def run_query(con, name, sql):
    try:
        rows = con.run(sql)
        return {"name": name, "sql": sql, "rows": rows, "count": len(rows), "status": "SUCCESS"}
    except Exception as e:
        return {"name": name, "sql": sql, "error": str(e), "status": "ERROR"}

def check_orphaned_records(con):
    print("Checking Orphaned Records...")
    checks = [
        ("order_items_without_orders", "SELECT id, order_id FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);"),
        ("order_items_without_variants", "SELECT id, product_variant_id FROM order_items WHERE product_variant_id NOT IN (SELECT id FROM product_variants);"),
        ("orders_without_users", "SELECT id, user_id FROM orders WHERE user_id NOT IN (SELECT id FROM users);"),
        ("payments_with_invalid_order_id", "SELECT id, order_id FROM payments WHERE order_id IS NOT NULL AND order_id NOT IN (SELECT id FROM orders);"),
        ("payments_without_users", "SELECT id, user_id FROM payments WHERE user_id NOT IN (SELECT id FROM users);"),
        ("payment_transactions_without_payments", "SELECT id, payment_id FROM payment_transactions WHERE payment_id NOT IN (SELECT id FROM payments);"),
        ("cart_items_without_carts", "SELECT id, cart_id FROM cart_items WHERE cart_id NOT IN (SELECT id FROM carts);"),
        ("cart_items_without_variants", "SELECT id, product_variant_id FROM cart_items WHERE product_variant_id NOT IN (SELECT id FROM product_variants);"),
        ("cart_promotions_without_carts", "SELECT id, cart_id FROM cart_promotions WHERE cart_id NOT IN (SELECT id FROM carts);"),
        ("cart_promotions_without_promotions", "SELECT id, promotion_id FROM cart_promotions WHERE promotion_id NOT IN (SELECT id FROM promotions);"),
        ("inventory_records_without_variants", "SELECT id, product_variant_id FROM inventory_records WHERE product_variant_id NOT IN (SELECT id FROM product_variants);"),
        ("inventory_transactions_without_records", "SELECT id, inventory_record_id FROM inventory_transactions WHERE inventory_record_id IS NOT NULL AND inventory_record_id NOT IN (SELECT id FROM inventory_records);"),
        ("shipments_without_orders", "SELECT id, order_id FROM shipments WHERE order_id NOT IN (SELECT id FROM orders);"),
        ("shipping_events_without_shipments", "SELECT id, shipment_id FROM shipping_events WHERE shipment_id NOT IN (SELECT id FROM shipments);"),
        ("wallets_without_users", "SELECT id, user_id FROM wallets WHERE user_id NOT IN (SELECT id FROM users);"),
        ("wallet_transactions_without_wallets", "SELECT id, wallet_id FROM wallet_transactions WHERE wallet_id NOT IN (SELECT id FROM wallets);"),
        ("wallet_withdrawals_without_wallets", "SELECT id, wallet_id FROM wallet_withdrawals WHERE wallet_id NOT IN (SELECT id FROM wallets);"),
        ("wallet_topup_intents_without_wallets", "SELECT id, wallet_id FROM wallet_topup_intents WHERE wallet_id NOT IN (SELECT id FROM wallets);"),
        ("batches_without_courses", "SELECT id, course_id FROM batches WHERE course_id NOT IN (SELECT id FROM courses);"),
        ("batch_schedules_without_batches", "SELECT id, batch_id FROM batch_schedules WHERE batch_id NOT IN (SELECT id FROM batches);"),
        ("enrollments_without_batches", "SELECT id, batch_id FROM enrollments WHERE batch_id NOT IN (SELECT id FROM batches);"),
        ("enrollments_without_users", "SELECT id, user_id FROM enrollments WHERE user_id NOT IN (SELECT id FROM users);"),
        ("certificates_without_enrollments", "SELECT id, enrollment_id FROM certificates WHERE enrollment_id NOT IN (SELECT id FROM enrollments);"),
        ("training_glimpses_without_batches", "SELECT id, batch_id FROM training_glimpses WHERE batch_id IS NOT NULL AND batch_id NOT IN (SELECT id FROM batches);"),
        ("product_variants_without_products", "SELECT id, product_id FROM product_variants WHERE product_id NOT IN (SELECT id FROM products);"),
        ("product_media_without_products", "SELECT id, product_id FROM product_media WHERE product_id NOT IN (SELECT id FROM products);"),
        ("product_information_without_products", "SELECT id, product_id FROM product_information WHERE product_id NOT IN (SELECT id FROM products);"),
        ("product_offers_without_products", "SELECT id, product_id FROM product_offers WHERE product_id NOT IN (SELECT id FROM products);"),
        ("product_reviews_without_products", "SELECT id, product_id FROM product_reviews WHERE product_id NOT IN (SELECT id FROM products);"),
        ("product_reviews_without_users", "SELECT id, user_id FROM product_reviews WHERE user_id NOT IN (SELECT id FROM users);"),
        ("training_reviews_without_courses", "SELECT id, course_id FROM training_reviews WHERE course_id NOT IN (SELECT id FROM courses);"),
        ("training_reviews_without_users", "SELECT id, user_id FROM training_reviews WHERE user_id NOT IN (SELECT id FROM users);"),
        ("support_tickets_without_users", "SELECT id, user_id FROM support_tickets WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);"),
        ("ticket_messages_without_tickets", "SELECT id, ticket_id FROM ticket_messages WHERE ticket_id NOT IN (SELECT id FROM support_tickets);"),
        ("customer_profiles_without_users", "SELECT id, user_id FROM customer_profiles WHERE user_id NOT IN (SELECT id FROM users);"),
        ("customer_addresses_without_profiles", "SELECT id, customer_profile_id FROM customer_addresses WHERE customer_profile_id NOT IN (SELECT id FROM customer_profiles);"),
        ("customer_capabilities_without_users", "SELECT id, user_id FROM customer_capabilities WHERE user_id NOT IN (SELECT id FROM users);"),
        ("blog_posts_without_categories", "SELECT id, category_id FROM blog_posts WHERE category_id IS NOT NULL AND category_id NOT IN (SELECT id FROM blog_categories);"),
        ("blog_posts_without_authors", "SELECT id, author_id FROM blog_posts WHERE author_id IS NOT NULL AND author_id NOT IN (SELECT id FROM blog_authors);"),
        ("promotion_redemptions_without_promotions", "SELECT id, promotion_id FROM promotion_redemptions WHERE promotion_id NOT IN (SELECT id FROM promotions);")
    ]
    results = {}
    for name, sql in checks:
        results[name] = run_query(con, name, sql)
    return results

def check_duplicate_business_records(con):
    print("Checking Duplicate Business Records...")
    checks = [
        ("duplicate_user_emails", "SELECT email, COUNT(*) as cnt FROM users GROUP BY lower(email) HAVING COUNT(*) > 1;"),
        ("duplicate_user_phones", "SELECT phone, COUNT(*) as cnt FROM users WHERE phone IS NOT NULL AND phone != '' GROUP BY phone HAVING COUNT(*) > 1;"),
        ("duplicate_active_carts_per_user", "SELECT user_id, COUNT(*) as cnt FROM carts WHERE is_active = true GROUP BY user_id HAVING COUNT(*) > 1;"),
        ("duplicate_product_slugs", "SELECT slug, COUNT(*) as cnt FROM products GROUP BY lower(slug) HAVING COUNT(*) > 1;"),
        ("duplicate_category_slugs", "SELECT slug, COUNT(*) as cnt FROM categories GROUP BY lower(slug) HAVING COUNT(*) > 1;"),
        ("duplicate_course_slugs", "SELECT slug, COUNT(*) as cnt FROM courses GROUP BY lower(slug) HAVING COUNT(*) > 1;"),
        ("duplicate_variant_skus", "SELECT sku, COUNT(*) as cnt FROM product_variants GROUP BY upper(sku) HAVING COUNT(*) > 1;"),
        ("duplicate_batch_codes", "SELECT batch_code, COUNT(*) as cnt FROM batches GROUP BY upper(batch_code) HAVING COUNT(*) > 1;"),
        ("duplicate_active_enrollments", "SELECT user_id, batch_id, COUNT(*) as cnt FROM enrollments WHERE status NOT IN ('CANCELLED', 'REFUNDED') GROUP BY user_id, batch_id HAVING COUNT(*) > 1;"),
        ("duplicate_product_reviews", "SELECT user_id, product_id, COUNT(*) as cnt FROM product_reviews GROUP BY user_id, product_id HAVING COUNT(*) > 1;"),
        ("duplicate_training_reviews", "SELECT user_id, course_id, COUNT(*) as cnt FROM training_reviews GROUP BY user_id, course_id HAVING COUNT(*) > 1;"),
        ("duplicate_promotion_codes", "SELECT code, COUNT(*) as cnt FROM promotions GROUP BY upper(code) HAVING COUNT(*) > 1;"),
        ("duplicate_wallets_per_user", "SELECT user_id, COUNT(*) as cnt FROM wallets GROUP BY user_id HAVING COUNT(*) > 1;")
    ]
    results = {}
    for name, sql in checks:
        results[name] = run_query(con, name, sql)
    return results

def check_unexpected_nulls(con):
    print("Checking Unexpected Nulls...")
    checks = [
        ("orders_null_amounts", "SELECT id FROM orders WHERE subtotal IS NULL OR total_amount IS NULL OR order_status IS NULL OR user_id IS NULL;"),
        ("order_items_null_fields", "SELECT id FROM order_items WHERE order_id IS NULL OR product_variant_id IS NULL OR quantity IS NULL OR unit_price IS NULL OR total_price IS NULL;"),
        ("payments_null_fields", "SELECT id FROM payments WHERE amount IS NULL OR payment_status IS NULL OR payment_method IS NULL OR user_id IS NULL;"),
        ("wallets_null_fields", "SELECT id FROM wallets WHERE user_id IS NULL OR available_balance IS NULL OR held_balance IS NULL;"),
        ("wallet_transactions_null_fields", "SELECT id FROM wallet_transactions WHERE wallet_id IS NULL OR amount IS NULL OR transaction_type IS NULL OR balance_before IS NULL OR balance_after IS NULL;"),
        ("product_variants_null_fields", "SELECT id FROM product_variants WHERE product_id IS NULL OR sku IS NULL OR price IS NULL OR stock_quantity IS NULL;"),
        ("batches_null_fields", "SELECT id FROM batches WHERE course_id IS NULL OR batch_code IS NULL OR capacity IS NULL OR enrolled_count IS NULL OR start_date IS NULL OR status IS NULL;"),
        ("enrollments_null_fields", "SELECT id FROM enrollments WHERE user_id IS NULL OR batch_id IS NULL OR status IS NULL;")
    ]
    results = {}
    for name, sql in checks:
        results[name] = run_query(con, name, sql)
    return results

def check_decimal_precision_and_math(con):
    print("Checking Decimal Precision and Monetary Calculations...")
    checks = [
        ("negative_wallet_balances", "SELECT id, user_id, available_balance, held_balance FROM wallets WHERE available_balance < 0 OR held_balance < 0;"),
        ("negative_order_amounts", "SELECT id, subtotal, total_amount, discount_amount, tax_amount, shipping_fee FROM orders WHERE subtotal < 0 OR total_amount < 0;"),
        ("negative_order_item_prices", "SELECT id, quantity, unit_price, total_price FROM order_items WHERE quantity <= 0 OR unit_price < 0 OR total_price < 0;"),
        ("negative_product_prices", "SELECT id, sku, price, compare_at_price FROM product_variants WHERE price < 0 OR (compare_at_price IS NOT NULL AND compare_at_price < 0);"),
        ("negative_payment_amounts", "SELECT id, amount FROM payments WHERE amount < 0;"),
        ("negative_wallet_transaction_amounts", "SELECT id, amount FROM wallet_transactions WHERE amount < 0;"),
        ("order_item_line_total_mismatch", """
            SELECT id, order_id, quantity, unit_price, total_price, 
                   round((quantity * unit_price)::numeric, 2) as calculated_total,
                   abs(total_price - round((quantity * unit_price)::numeric, 2)) as diff
            FROM order_items
            WHERE abs(total_price - round((quantity * unit_price)::numeric, 2)) > 0.01;
        """),
        ("order_subtotal_vs_items_mismatch", """
            SELECT o.id, o.order_number, o.subtotal, 
                   COALESCE(SUM(oi.total_price), 0) as items_sum,
                   abs(o.subtotal - COALESCE(SUM(oi.total_price), 0)) as diff
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, o.order_number, o.subtotal
            HAVING abs(o.subtotal - COALESCE(SUM(oi.total_price), 0)) > 0.01;
        """),
        ("order_total_formula_mismatch", """
            SELECT id, order_number, subtotal, discount_amount, tax_amount, shipping_fee, total_amount,
                   round((subtotal - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0) + COALESCE(shipping_fee, 0))::numeric, 2) as calculated_total,
                   abs(total_amount - round((subtotal - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0) + COALESCE(shipping_fee, 0))::numeric, 2)) as diff
            FROM orders
            WHERE abs(total_amount - round((subtotal - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0) + COALESCE(shipping_fee, 0))::numeric, 2)) > 0.01;
        """)
    ]
    results = {}
    for name, sql in checks:
        results[name] = run_query(con, name, sql)
    return results

def check_status_values(con):
    print("Checking Enum and Status Values...")
    checks = [
        ("invalid_order_status", """
            SELECT DISTINCT order_status FROM orders 
            WHERE order_status NOT IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED');
        """),
        ("invalid_payment_status", """
            SELECT DISTINCT payment_status FROM payments 
            WHERE payment_status NOT IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
        """),
        ("invalid_wallet_tx_type", """
            SELECT DISTINCT transaction_type FROM wallet_transactions 
            WHERE transaction_type NOT IN ('CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'REFUND', 'TOPUP', 'WITHDRAWAL', 'CASHBACK');
        """),
        ("invalid_batch_status", """
            SELECT DISTINCT status FROM batches 
            WHERE status NOT IN ('UPCOMING', 'ENROLLING', 'ONGOING', 'COMPLETED', 'CANCELLED');
        """),
        ("invalid_enrollment_status", """
            SELECT DISTINCT status FROM enrollments 
            WHERE status NOT IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
        """),
        ("invalid_ticket_status", """
            SELECT DISTINCT status FROM support_tickets 
            WHERE status NOT IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ON_HOLD');
        """),
        ("invalid_ticket_priority", """
            SELECT DISTINCT priority FROM support_tickets 
            WHERE priority NOT IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
        """),
        ("invalid_user_role", """
            SELECT DISTINCT role FROM users 
            WHERE role NOT IN ('ROLE_USER', 'ROLE_ADMIN', 'ROLE_CUSTOMER', 'ROLE_VENDOR', 'ROLE_INSTRUCTOR');
        """)
    ]
    results = {}
    for name, sql in checks:
        results[name] = run_query(con, name, sql)
    return results

def check_reconciliation(con):
    print("Checking Cross-Domain Reconciliation...")
    checks = [
        ("orders_without_order_items", """
            SELECT o.id, o.order_number, o.created_at, o.order_status, o.total_amount
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE oi.id IS NULL;
        """),
        ("active_carts_without_cart_items", """
            SELECT c.id, c.user_id, c.created_at, c.updated_at
            FROM carts c
            LEFT JOIN cart_items ci ON c.id = ci.cart_id
            WHERE c.is_active = true AND ci.id IS NULL;
        """),
        ("paid_orders_without_successful_payment", """
            SELECT o.id, o.order_number, o.order_status, o.total_amount
            FROM orders o
            WHERE o.order_status IN ('PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED')
              AND NOT EXISTS (
                  SELECT 1 FROM payments p 
                  WHERE p.order_id = o.id AND p.payment_status = 'COMPLETED'
              );
        """),
        ("paid_orders_amount_mismatch", """
            SELECT o.id, o.order_number, o.order_status, o.total_amount, 
                   COALESCE(SUM(p.amount), 0) as total_paid,
                   abs(o.total_amount - COALESCE(SUM(p.amount), 0)) as diff
            FROM orders o
            JOIN payments p ON p.order_id = o.id AND p.payment_status = 'COMPLETED'
            WHERE o.order_status IN ('PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED')
            GROUP BY o.id, o.order_number, o.order_status, o.total_amount
            HAVING abs(o.total_amount - COALESCE(SUM(p.amount), 0)) > 0.01;
        """),
        ("inventory_variant_stock_vs_inventory_records", """
            SELECT pv.id as variant_id, pv.sku, pv.stock_quantity as variant_stock, 
                   ir.quantity as inventory_record_stock,
                   (pv.stock_quantity - ir.quantity) as diff
            FROM product_variants pv
            JOIN inventory_records ir ON ir.product_variant_id = pv.id
            WHERE pv.stock_quantity != ir.quantity;
        """),
        ("wallet_transaction_running_balance_mismatch", """
            SELECT id, wallet_id, amount, transaction_type, balance_before, balance_after,
                   CASE 
                     WHEN transaction_type IN ('CREDIT', 'TOPUP', 'REFUND', 'CASHBACK', 'RELEASE') 
                          THEN round((balance_before + amount)::numeric, 2)
                     WHEN transaction_type IN ('DEBIT', 'WITHDRAWAL', 'HOLD') 
                          THEN round((balance_before - amount)::numeric, 2)
                     ELSE balance_before
                   END as expected_after,
                   abs(balance_after - (
                     CASE 
                       WHEN transaction_type IN ('CREDIT', 'TOPUP', 'REFUND', 'CASHBACK', 'RELEASE') 
                            THEN round((balance_before + amount)::numeric, 2)
                       WHEN transaction_type IN ('DEBIT', 'WITHDRAWAL', 'HOLD') 
                            THEN round((balance_before - amount)::numeric, 2)
                       ELSE balance_before
                     END
                   )) as diff
            FROM wallet_transactions
            WHERE abs(balance_after - (
                     CASE 
                       WHEN transaction_type IN ('CREDIT', 'TOPUP', 'REFUND', 'CASHBACK', 'RELEASE') 
                            THEN round((balance_before + amount)::numeric, 2)
                       WHEN transaction_type IN ('DEBIT', 'WITHDRAWAL', 'HOLD') 
                            THEN round((balance_before - amount)::numeric, 2)
                       ELSE balance_before
                     END
                   )) > 0.01;
        """),
        ("wallet_balance_vs_latest_transaction", """
            WITH latest_tx AS (
                SELECT DISTINCT ON (wallet_id) wallet_id, balance_after
                FROM wallet_transactions
                ORDER BY wallet_id, created_at DESC, id DESC
            )
            SELECT w.id, w.user_id, w.available_balance, lt.balance_after,
                   abs(w.available_balance - lt.balance_after) as diff
            FROM wallets w
            JOIN latest_tx lt ON w.id = lt.wallet_id
            WHERE abs(w.available_balance - lt.balance_after) > 0.01;
        """),
        ("batch_enrolled_count_discrepancy", """
            SELECT b.id, b.batch_code, b.enrolled_count, b.capacity,
                   COALESCE(e_cnt.actual_enrolled, 0) as actual_enrolled,
                   abs(b.enrolled_count - COALESCE(e_cnt.actual_enrolled, 0)) as diff
            FROM batches b
            LEFT JOIN (
                SELECT batch_id, COUNT(*) as actual_enrolled
                FROM enrollments
                WHERE status NOT IN ('CANCELLED', 'REFUNDED')
                GROUP BY batch_id
            ) e_cnt ON b.id = e_cnt.batch_id
            WHERE abs(b.enrolled_count - COALESCE(e_cnt.actual_enrolled, 0)) != 0;
        """),
        ("batch_overcapacity", """
            SELECT id, batch_code, capacity, enrolled_count
            FROM batches
            WHERE enrolled_count > capacity;
        """)
    ]
    results = {}
    for name, sql in checks:
        results[name] = run_query(con, name, sql)
    return results

def check_missing_fk_indexes(con):
    print("Checking Missing Foreign Key Indexes...")
    # Supabase best practice: every foreign key should have a supporting index on referencing table
    sql = """
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
    return run_query(con, "unindexed_foreign_keys", sql)

def check_api_vs_db_record_counts(con):
    print("Checking API vs DB Record Counts...")
    endpoints = [
        ("Products", f"{API_BASE}/catalog/products", "SELECT COUNT(*) FROM products;"),
        ("Categories", f"{API_BASE}/catalog/categories", "SELECT COUNT(*) FROM categories;"),
        ("Courses", f"{API_BASE}/training/courses", "SELECT COUNT(*) FROM courses;"),
        ("Batches", f"{API_BASE}/training/batches", "SELECT COUNT(*) FROM batches;"),
        ("Blog Posts", f"{API_BASE}/content/posts", "SELECT COUNT(*) FROM blog_posts;")
    ]
    results = []
    for entity_name, api_url, db_sql in endpoints:
        db_count = con.run(db_sql)[0][0]
        api_count = None
        status_code = None
        notes = ""
        try:
            req = urllib.request.Request(api_url, headers={"User-Agent": "SporeKart-Auditor/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                status_code = response.getcode()
                raw_bytes = response.read()
                data = json.loads(raw_bytes.decode('utf-8'))
                if isinstance(data, list):
                    api_count = len(data)
                elif isinstance(data, dict):
                    if "content" in data and isinstance(data["content"], list):
                        api_count = data.get("totalElements", len(data["content"]))
                    elif "data" in data and isinstance(data["data"], list):
                        api_count = len(data["data"])
                    elif "totalElements" in data:
                        api_count = data["totalElements"]
                    else:
                        api_count = len(data)
        except urllib.error.HTTPError as e:
            status_code = e.code
            notes = f"HTTP {status_code}"
        except Exception as e:
            notes = f"API Error: {e}"

        results.append({
            "entity": entity_name,
            "api_url": api_url,
            "status_code": status_code,
            "api_count": api_count,
            "db_count": db_count,
            "match": (api_count == db_count) if api_count is not None else False,
            "notes": notes
        })
    return results

if __name__ == '__main__':
    con = get_connection()
    try:
        orphaned = check_orphaned_records(con)
        duplicates = check_duplicate_business_records(con)
        unexpected_nulls = check_unexpected_nulls(con)
        decimal_math = check_decimal_precision_and_math(con)
        status_vals = check_status_values(con)
        reconciliation = check_reconciliation(con)
        missing_fk_idx = check_missing_fk_indexes(con)
        api_vs_db = check_api_vs_db_record_counts(con)

        summary = {
            "timestamp": datetime.now().isoformat(),
            "orphaned_records": orphaned,
            "duplicate_records": duplicates,
            "unexpected_nulls": unexpected_nulls,
            "decimal_precision_and_math": decimal_math,
            "status_enum_values": status_vals,
            "reconciliation_checks": reconciliation,
            "missing_foreign_key_indexes": missing_fk_idx,
            "api_vs_db_counts": api_vs_db
        }

        with open("audit_output/reconciliation_audit_results.json", "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, default=str)

        print("\n=== SUMMARY OF INTEGRITY & RECONCILIATION FINDINGS ===")
        print(f"Orphaned record checks run: {len(orphaned)}")
        for k, v in orphaned.items():
            if v.get('count', 0) > 0:
                print(f"  [ORPHANED] {k}: {v['count']} records found!")
        print(f"Duplicate record checks run: {len(duplicates)}")
        for k, v in duplicates.items():
            if v.get('count', 0) > 0:
                print(f"  [DUPLICATE] {k}: {v['count']} duplicate groups found!")
        print(f"Unexpected null checks run: {len(unexpected_nulls)}")
        for k, v in unexpected_nulls.items():
            if v.get('count', 0) > 0:
                print(f"  [NULL] {k}: {v['count']} unexpected nulls found!")
        print(f"Decimal math checks run: {len(decimal_math)}")
        for k, v in decimal_math.items():
            if v.get('count', 0) > 0:
                print(f"  [DECIMAL MISMATCH] {k}: {v['count']} records with discrepancies!")
        print(f"Status enum checks run: {len(status_vals)}")
        for k, v in status_vals.items():
            if v.get('count', 0) > 0:
                print(f"  [INVALID STATUS] {k}: {v['rows']}")
        print(f"Reconciliation checks run: {len(reconciliation)}")
        for k, v in reconciliation.items():
            if v.get('count', 0) > 0:
                print(f"  [RECONCILIATION DISCREPANCY] {k}: {v['count']} records!")
        print(f"Unindexed foreign keys found: {missing_fk_idx.get('count', 0)}")
        print(f"API vs DB count comparisons: {len(api_vs_db)}")
        for r in api_vs_db:
            print(f"  {r['entity']:12} -> API: {r['api_count']}, DB: {r['db_count']}, Match: {r['match']} ({r['notes']})")

    finally:
        con.close()
