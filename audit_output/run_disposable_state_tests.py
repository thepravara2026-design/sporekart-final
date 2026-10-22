#!/usr/bin/env python3
"""
Isolated Disposable State-Changing Database Integrity Suite.
Executes state-changing assertion tests inside isolated transaction blocks
with guaranteed ROLLBACK, ensuring ZERO persistent mutations on the database.
Uses verified PostgreSQL 17.6 public schema column definitions.
"""

import sys
import ssl
import json
import uuid
import pg8000.native

DB_HOST = "aws-0-ap-northeast-1.pooler.supabase.com"
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.irwiiyowpppdynbmwwuz"
DB_PASS = "MyDbSporekart@123#"

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

def test_wallet_non_negative(con):
    test_name = "Wallet Non-Negative Check Constraint"
    print(f"Running: {test_name}...")
    con.run("BEGIN;")
    passed = False
    error_msg = ""
    try:
        dummy_uid = str(uuid.uuid4())
        dummy_wid = str(uuid.uuid4())
        # Attempt to insert negative available_balance (-50.00)
        con.run(f"""
            INSERT INTO wallets (id, user_id, user_type, available_balance, pending_balance, withdrawable_balance, currency)
            VALUES ('{dummy_wid}', '{dummy_uid}', 'CUSTOMER', -50.00, 0.00, 0.00, 'INR');
        """)
        error_msg = "Expected check constraint violation, but INSERT with negative balance succeeded!"
    except Exception as e:
        error_str = str(e).lower()
        if "check constraint" in error_str or "violates check" in error_str:
            passed = True
            error_msg = str(e)
        else:
            error_msg = f"Unexpected error: {e}"
    finally:
        con.run("ROLLBACK;")
    return {"test": test_name, "passed": passed, "detail": error_msg}

def test_user_email_unique(con):
    test_name = "User Email Unique Constraint"
    print(f"Running: {test_name}...")
    con.run("BEGIN;")
    passed = False
    error_msg = ""
    try:
        # Get an existing user email
        existing_email = con.run("SELECT email FROM users LIMIT 1;")[0][0]
        dummy_uid = str(uuid.uuid4())
        con.run(f"""
            INSERT INTO users (id, email, password_hash, role, full_name, first_name, last_name, is_verified)
            VALUES ('{dummy_uid}', '{existing_email}', 'dummy_hash', 'ROLE_CUSTOMER', 'Test Dup', 'Test', 'Dup', true);
        """)
        error_msg = "Expected unique constraint violation, but duplicate email INSERT succeeded!"
    except Exception as e:
        error_str = str(e).lower()
        if "unique constraint" in error_str or "duplicate key" in error_str:
            passed = True
            error_msg = str(e)
        else:
            error_msg = f"Unexpected error: {e}"
    finally:
        con.run("ROLLBACK;")
    return {"test": test_name, "passed": passed, "detail": error_msg}

def test_cart_active_unique(con):
    test_name = "Cart Active User Partial Unique Constraint (V37)"
    print(f"Running: {test_name}...")
    con.run("BEGIN;")
    passed = False
    error_msg = ""
    try:
        # Find user with active cart
        row = con.run("SELECT user_id FROM carts WHERE status = 'ACTIVE' LIMIT 1;")
        if not row:
            dummy_uid = str(uuid.uuid4())
            con.run(f"INSERT INTO users (id, email, password_hash, role) VALUES ('{dummy_uid}', 'cart_test_{dummy_uid[:8]}@example.com', 'h', 'ROLE_CUSTOMER');")
            con.run(f"INSERT INTO carts (id, user_id, status) VALUES ('{uuid.uuid4()}', '{dummy_uid}', 'ACTIVE');")
            uid = dummy_uid
        else:
            uid = row[0][0]

        # Attempt to insert second ACTIVE cart for same user
        con.run(f"INSERT INTO carts (id, user_id, status) VALUES ('{uuid.uuid4()}', '{uid}', 'ACTIVE');")
        error_msg = "Expected unique constraint on active cart, but second active cart INSERT succeeded!"
    except Exception as e:
        error_str = str(e).lower()
        if "unique constraint" in error_str or "duplicate key" in error_str:
            passed = True
            error_msg = str(e)
        else:
            error_msg = f"Unexpected error: {e}"
    finally:
        con.run("ROLLBACK;")
    return {"test": test_name, "passed": passed, "detail": error_msg}

def test_foreign_key_order_items(con):
    test_name = "Foreign Key Constraint: order_items -> orders"
    print(f"Running: {test_name}...")
    con.run("BEGIN;")
    passed = False
    error_msg = ""
    try:
        dummy_oid = str(uuid.uuid4())
        variant_id = con.run("SELECT id FROM product_variants LIMIT 1;")[0][0]
        con.run(f"""
            INSERT INTO order_items (id, order_id, variant_id, product_title, variant_name, price_inr, quantity, line_total_inr)
            VALUES ('{uuid.uuid4()}', '{dummy_oid}', '{variant_id}', 'Test Product', 'Default', 100.00, 1, 100.00);
        """)
        error_msg = "Expected foreign key constraint violation, but orphan order_item INSERT succeeded!"
    except Exception as e:
        error_str = str(e).lower()
        if "foreign key constraint" in error_str or "violates foreign key" in error_str:
            passed = True
            error_msg = str(e)
        else:
            error_msg = f"Unexpected error: {e}"
    finally:
        con.run("ROLLBACK;")
    return {"test": test_name, "passed": passed, "detail": error_msg}

def test_foreign_key_enrollments(con):
    test_name = "Foreign Key Constraint: enrollments -> batches"
    print(f"Running: {test_name}...")
    con.run("BEGIN;")
    passed = False
    error_msg = ""
    try:
        dummy_bid = str(uuid.uuid4())
        user_id = con.run("SELECT id FROM users LIMIT 1;")[0][0]
        course_id = con.run("SELECT id FROM courses LIMIT 1;")[0][0]
        con.run(f"""
            INSERT INTO enrollments (id, user_id, course_id, batch_id, status, fee_paid_inr)
            VALUES ('{uuid.uuid4()}', '{user_id}', '{course_id}', '{dummy_bid}', 'CONFIRMED', 1500.00);
        """)
        error_msg = "Expected foreign key constraint violation, but orphan enrollment INSERT succeeded!"
    except Exception as e:
        error_str = str(e).lower()
        if "foreign key constraint" in error_str or "violates foreign key" in error_str:
            passed = True
            error_msg = str(e)
        else:
            error_msg = f"Unexpected error: {e}"
    finally:
        con.run("ROLLBACK;")
    return {"test": test_name, "passed": passed, "detail": error_msg}

def test_not_null_constraints(con):
    test_name = "NOT NULL Constraint on Critical Financial Fields (orders.total_amount_inr)"
    print(f"Running: {test_name}...")
    con.run("BEGIN;")
    passed = False
    error_msg = ""
    try:
        user_id = con.run("SELECT id FROM users LIMIT 1;")[0][0]
        # Attempt to insert order with NULL total_amount_inr
        con.run(f"""
            INSERT INTO orders (id, user_id, order_number, status, subtotal_amount_inr, total_amount_inr)
            VALUES ('{uuid.uuid4()}', '{user_id}', 'ORD-NULL-TEST', 'PENDING', 100.00, NULL);
        """)
        error_msg = "Expected NOT NULL violation, but INSERT with NULL total_amount_inr succeeded!"
    except Exception as e:
        error_str = str(e).lower()
        if "null value in column" in error_str or "violates not-null" in error_str:
            passed = True
            error_msg = str(e)
        else:
            error_msg = f"Unexpected error: {e}"
    finally:
        con.run("ROLLBACK;")
    return {"test": test_name, "passed": passed, "detail": error_msg}

def test_variant_sku_unique(con):
    test_name = "Product Variant SKU Unique Constraint"
    print(f"Running: {test_name}...")
    con.run("BEGIN;")
    passed = False
    error_msg = ""
    try:
        existing_sku = con.run("SELECT sku FROM product_variants LIMIT 1;")[0][0]
        prod_id = con.run("SELECT id FROM products LIMIT 1;")[0][0]
        con.run(f"""
            INSERT INTO product_variants (id, product_id, variant_name, sku, price_inr, stock_quantity, is_active)
            VALUES ('{uuid.uuid4()}', '{prod_id}', 'Duplicate SKU Variant', '{existing_sku}', 100.00, 10, true);
        """)
        error_msg = "Expected unique constraint violation on SKU, but duplicate SKU INSERT succeeded!"
    except Exception as e:
        error_str = str(e).lower()
        if "unique constraint" in error_str or "duplicate key" in error_str:
            passed = True
            error_msg = str(e)
        else:
            error_msg = f"Unexpected error: {e}"
    finally:
        con.run("ROLLBACK;")
    return {"test": test_name, "passed": passed, "detail": error_msg}

def test_transaction_atomicity(con):
    test_name = "Transaction Atomicity & Rollback Guarantee"
    print(f"Running: {test_name}...")
    dummy_code = f"PROMO-TEST-{uuid.uuid4().hex[:6].upper()}"
    
    con.run("BEGIN;")
    try:
        con.run(f"""
            INSERT INTO promotions (id, name, code, description, type, discount_value, status)
            VALUES ('{uuid.uuid4()}', 'Atomic Promo Test', '{dummy_code}', 'Test Atomic Promo', 'PERCENTAGE', 10.00, 'ACTIVE');
        """)
    finally:
        con.run("ROLLBACK;")

    # Verify that the row does NOT exist
    rows = con.run(f"SELECT id FROM promotions WHERE code = '{dummy_code}';")
    passed = len(rows) == 0
    detail = "Row cleanly rolled back with zero footprint" if passed else "Row leaked into database after ROLLBACK!"
    return {"test": test_name, "passed": passed, "detail": detail}

def run_all_disposable_tests():
    con = get_connection()
    results = []
    try:
        results.append(test_wallet_non_negative(con))
        results.append(test_user_email_unique(con))
        results.append(test_cart_active_unique(con))
        results.append(test_foreign_key_order_items(con))
        results.append(test_foreign_key_enrollments(con))
        results.append(test_not_null_constraints(con))
        results.append(test_variant_sku_unique(con))
        results.append(test_transaction_atomicity(con))
    finally:
        con.close()

    print("\n=== DISPOSABLE STATE-CHANGING TEST RESULTS ===")
    all_passed = True
    for r in results:
        status_str = "PASSED" if r["passed"] else "FAILED"
        if not r["passed"]:
            all_passed = False
        print(f"[{status_str}] {r['test']}")
        print(f"         Detail: {r['detail'][:100]}...")

    with open("audit_output/disposable_state_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return all_passed

if __name__ == '__main__':
    run_all_disposable_tests()
