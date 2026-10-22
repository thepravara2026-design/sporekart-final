#!/usr/bin/env python3
"""
Deep Financial and Business Invariant Reconciliation.
Verifies with exact PostgreSQL column names:
1. Order Items Line Total Math
2. Order Subtotal vs Sum of Line Items
3. Order Total Formula (Subtotal - Discount + GST + Shipping == Total)
4. Order vs Payment Amount Reconciliation
5. Wallet Transaction Running Balance Ledger Math
6. Wallet Current Balance vs Latest Ledger Transaction
7. Batch Enrolled Count vs Actual Enrollments Table
8. Product Variant Stock vs Inventory Records Quantity
"""

import sys
import ssl
import json
from decimal import Decimal
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

def reconcile_financials():
    con = get_connection()
    report = {}
    try:
        # 1. Order Items Line Total Math
        print("Checking Order Items Line Total Math...")
        oi_rows = con.run("""
            SELECT id, order_id, sku, quantity, price_inr, gst_rate_percent, gst_amount_inr, line_total_inr
            FROM order_items;
        """)
        oi_mismatches = []
        for r in oi_rows:
            oi_id, o_id, sku, qty, price, gst_rate, gst_amt, line_total = r
            calc_base = qty * price
            calc_with_gst = calc_base + (gst_amt or Decimal("0.00"))
            # check if line_total matches calc_base or calc_with_gst
            diff_base = abs(line_total - calc_base)
            diff_gst = abs(line_total - calc_with_gst)
            if diff_base > Decimal("0.01") and diff_gst > Decimal("0.01"):
                oi_mismatches.append({
                    "order_item_id": str(oi_id),
                    "order_id": str(o_id),
                    "sku": sku,
                    "quantity": qty,
                    "price_inr": float(price),
                    "line_total_inr": float(line_total),
                    "calc_base": float(calc_base),
                    "diff": float(diff_base)
                })
        report["order_items_math"] = {
            "total_items_checked": len(oi_rows),
            "mismatches_count": len(oi_mismatches),
            "mismatches": oi_mismatches
        }

        # 2. Order Subtotal vs Sum of Line Items
        print("Checking Order Subtotal vs Sum of Line Items...")
        subtotal_rows = con.run("""
            SELECT o.id, o.order_number, o.status, o.subtotal_amount_inr,
                   COALESCE(SUM(oi.line_total_inr), 0) as items_sum,
                   COALESCE(SUM(oi.quantity * oi.price_inr), 0) as base_items_sum
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, o.order_number, o.status, o.subtotal_amount_inr;
        """)
        subtotal_mismatches = []
        for r in subtotal_rows:
            oid, onum, st, subtotal, items_sum, base_sum = r
            subtotal = subtotal or Decimal("0.00")
            diff1 = abs(subtotal - items_sum)
            diff2 = abs(subtotal - base_sum)
            if diff1 > Decimal("0.01") and diff2 > Decimal("0.01"):
                subtotal_mismatches.append({
                    "order_id": str(oid),
                    "order_number": onum,
                    "status": st,
                    "subtotal": float(subtotal),
                    "items_sum": float(items_sum),
                    "diff": float(min(diff1, diff2))
                })
        report["order_subtotal_vs_items"] = {
            "total_orders_checked": len(subtotal_rows),
            "mismatches_count": len(subtotal_mismatches),
            "mismatches": subtotal_mismatches
        }

        # 3. Order Total Formula Math
        print("Checking Order Total Formula...")
        total_rows = con.run("""
            SELECT id, order_number, status, subtotal_amount_inr, discount_total_amount_inr,
                   gst_total_amount_inr, shipping_fee_inr, total_amount_inr
            FROM orders;
        """)
        total_mismatches = []
        for r in total_rows:
            oid, onum, st, sub, disc, gst, ship, tot = r
            sub = sub or Decimal("0.00")
            disc = disc or Decimal("0.00")
            gst = gst or Decimal("0.00")
            ship = ship or Decimal("0.00")
            tot = tot or Decimal("0.00")
            calc_total = sub - disc + gst + ship
            diff = abs(tot - calc_total)
            if diff > Decimal("0.01"):
                total_mismatches.append({
                    "order_id": str(oid),
                    "order_number": onum,
                    "status": st,
                    "subtotal": float(sub),
                    "discount": float(disc),
                    "gst": float(gst),
                    "shipping": float(ship),
                    "total_amount": float(tot),
                    "calculated_total": float(calc_total),
                    "diff": float(diff)
                })
        report["order_total_formula"] = {
            "total_orders_checked": len(total_rows),
            "mismatches_count": len(total_mismatches),
            "mismatches": total_mismatches
        }

        # 4. Order vs Payment Amount Reconciliation
        print("Checking Order vs Payment Amount Reconciliation...")
        pay_rows = con.run("""
            SELECT o.id, o.order_number, o.status, o.total_amount_inr,
                   p.id as payment_id, p.status as payment_status, p.amount_inr
            FROM orders o
            LEFT JOIN payments p ON p.order_id = o.id
            WHERE o.status IN ('PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED');
        """)
        pay_mismatches = []
        for r in pay_rows:
            oid, onum, ost, ototal, pid, pst, pamt = r
            if pid is None:
                pay_mismatches.append({
                    "order_id": str(oid),
                    "order_number": onum,
                    "order_status": ost,
                    "order_total": float(ototal or 0),
                    "issue": "Missing payment record for paid/confirmed order"
                })
            else:
                pamt = pamt or Decimal("0.00")
                ototal = ototal or Decimal("0.00")
                diff = abs(ototal - pamt)
                if diff > Decimal("0.01"):
                    pay_mismatches.append({
                        "order_id": str(oid),
                        "order_number": onum,
                        "order_status": ost,
                        "order_total": float(ototal),
                        "payment_id": str(pid),
                        "payment_status": pst,
                        "payment_amount": float(pamt),
                        "diff": float(diff),
                        "issue": "Amount discrepancy between order total and payment"
                    })
        report["order_vs_payment"] = {
            "paid_orders_checked": len(pay_rows),
            "mismatches_count": len(pay_mismatches),
            "mismatches": pay_mismatches
        }

        # 5. Wallet Running Balance Ledger Math
        print("Checking Wallet Running Balance Ledger Math...")
        tx_rows = con.run("""
            SELECT id, wallet_id, amount, transaction_type, balance_before, balance_after, created_at, description
            FROM wallet_transactions
            ORDER BY created_at ASC;
        """)
        tx_mismatches = []
        credit_types = {'CREDIT', 'TOPUP', 'REFUND', 'CASHBACK', 'RELEASE'}
        debit_types = {'DEBIT', 'WITHDRAWAL', 'HOLD', 'WALLET_PAYMENT', 'ORDER_PAYMENT', 'TRAINING_PAYMENT', 'PARTIAL_PAYMENT'}

        for r in tx_rows:
            tx_id, wid, amt, txtype, b_before, b_after, cat, desc = r
            amt = amt or Decimal("0.00")
            b_before = b_before or Decimal("0.00")
            b_after = b_after or Decimal("0.00")

            if txtype in credit_types:
                expected = b_before + amt
            elif txtype in debit_types:
                expected = b_before - amt
            else:
                expected = b_before

            diff = abs(b_after - expected)
            if diff > Decimal("0.01"):
                tx_mismatches.append({
                    "tx_id": str(tx_id),
                    "wallet_id": str(wid),
                    "type": txtype,
                    "amount": float(amt),
                    "balance_before": float(b_before),
                    "balance_after": float(b_after),
                    "expected_after": float(expected),
                    "diff": float(diff),
                    "description": desc
                })
        report["wallet_transactions_ledger"] = {
            "total_transactions_checked": len(tx_rows),
            "mismatches_count": len(tx_mismatches),
            "mismatches": tx_mismatches
        }

        # 6. Wallet Balance vs Latest Transaction
        print("Checking Wallet Balance vs Latest Transaction...")
        wallet_rows = con.run("""
            WITH latest_tx AS (
                SELECT DISTINCT ON (wallet_id) wallet_id, balance_after
                FROM wallet_transactions
                ORDER BY wallet_id, created_at DESC, id DESC
            )
            SELECT w.id, w.user_id, w.available_balance, lt.balance_after
            FROM wallets w
            JOIN latest_tx lt ON w.id = lt.wallet_id;
        """)
        wallet_mismatches = []
        for r in wallet_rows:
            wid, uid, avail, bal_after = r
            avail = avail or Decimal("0.00")
            bal_after = bal_after or Decimal("0.00")
            diff = abs(avail - bal_after)
            if diff > Decimal("0.01"):
                wallet_mismatches.append({
                    "wallet_id": str(wid),
                    "user_id": str(uid),
                    "available_balance": float(avail),
                    "latest_tx_balance": float(bal_after),
                    "diff": float(diff)
                })
        report["wallet_current_vs_ledger"] = {
            "wallets_with_tx_checked": len(wallet_rows),
            "mismatches_count": len(wallet_mismatches),
            "mismatches": wallet_mismatches
        }

        # 7. Training Seat Count Discrepancies
        print("Checking Training Seat Count Discrepancies...")
        batch_rows = con.run("""
            SELECT b.id, b.batch_code, b.capacity, b.enrolled_count,
                   COALESCE(e_cnt.actual_enrolled, 0) as actual_enrolled
            FROM batches b
            LEFT JOIN (
                SELECT batch_id, COUNT(*) as actual_enrolled
                FROM enrollments
                WHERE status NOT IN ('CANCELLED', 'REFUNDED')
                GROUP BY batch_id
            ) e_cnt ON b.id = e_cnt.batch_id;
        """)
        seat_discrepancies = []
        for r in batch_rows:
            bid, bcode, cap, encnt, actual = r
            if encnt != actual or encnt > cap:
                seat_discrepancies.append({
                    "batch_id": str(bid),
                    "batch_code": bcode,
                    "capacity": cap,
                    "batch_enrolled_count_column": encnt,
                    "actual_enrollments_in_db": actual,
                    "diff": actual - encnt,
                    "overcapacity": encnt > cap or actual > cap
                })
        report["training_seat_counts"] = {
            "total_batches_checked": len(batch_rows),
            "discrepancies_count": len(seat_discrepancies),
            "discrepancies": seat_discrepancies
        }

        # 8. Product Variant Stock vs Inventory Records Quantity
        print("Checking Product Variant Stock vs Inventory Records...")
        stock_rows = con.run("""
            SELECT pv.id, pv.sku, pv.stock_quantity, ir.available_quantity, ir.reserved_quantity, ir.sold_quantity
            FROM product_variants pv
            JOIN inventory_records ir ON ir.variant_id = pv.id;
        """)
        stock_mismatches = []
        for r in stock_rows:
            vid, sku, pv_stock, ir_avail, ir_res, ir_sold = r
            if pv_stock != ir_avail and pv_stock != (ir_avail + ir_res):
                stock_mismatches.append({
                    "variant_id": str(vid),
                    "sku": sku,
                    "variant_stock_quantity": pv_stock,
                    "inventory_available_quantity": ir_avail,
                    "inventory_reserved_quantity": ir_res,
                    "diff": pv_stock - ir_avail
                })
        report["inventory_stock_reconciliation"] = {
            "variants_with_inventory_checked": len(stock_rows),
            "mismatches_count": len(stock_mismatches),
            "mismatches": stock_mismatches
        }

        with open("audit_output/financial_reconciliation_report.json", "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        print("\n=== FINANCIAL RECONCILIATION SUMMARY ===")
        print(f"1. Order Items Math Mismatches: {report['order_items_math']['mismatches_count']}")
        print(f"2. Order Subtotal Mismatches: {report['order_subtotal_vs_items']['mismatches_count']}")
        print(f"3. Order Total Formula Mismatches: {report['order_total_formula']['mismatches_count']}")
        print(f"4. Order vs Payment Mismatches: {report['order_vs_payment']['mismatches_count']}")
        print(f"5. Wallet Transaction Ledger Math Mismatches: {report['wallet_transactions_ledger']['mismatches_count']}")
        print(f"6. Wallet Balance vs Latest Tx Mismatches: {report['wallet_current_vs_ledger']['mismatches_count']}")
        print(f"7. Training Seat Count Discrepancies: {report['training_seat_counts']['discrepancies_count']}")
        if seat_discrepancies:
            for s in seat_discrepancies:
                print(f"   -> Batch {s['batch_code']}: batches.enrolled_count = {s['batch_enrolled_count_column']}, actual enrollments = {s['actual_enrollments_in_db']} (Diff: {s['diff']})")
        print(f"8. Variant Stock vs Inventory Record Mismatches: {report['inventory_stock_reconciliation']['mismatches_count']}")

    finally:
        con.close()

if __name__ == '__main__':
    reconcile_financials()
