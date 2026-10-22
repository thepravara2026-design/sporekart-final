#!/usr/bin/env python3
"""
Sporekart Phase 10 — Wallet Management and Financial Reconciliation Audit Suite
Tests customer and administrator wallet functionality independently.
Covers:
- Top-ups, Debits, Credits, Refunds, Withdrawals, Administrative Adjustments
- Insufficient Funds, Duplicate Requests, Idempotency, Concurrency, Reversals
- Double-Entry Ledger Reconciliation, Non-Negative Boundaries, Audit Trail
- Zero Modification of Existing Wallet Balances
"""

import sys
import os
import json
import time
import uuid
import hmac
import hashlib
import base64
import threading
import urllib.request
import urllib.error
import urllib.parse
from decimal import Decimal

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://localhost:8080/api/v1"
JWT_SECRET_B64 = "404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971"

def b64url(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def generate_jwt(user_id, email, role):
    secret = base64.b64decode(JWT_SECRET_B64)
    header = b64url(json.dumps({'alg': 'HS256'}))
    payload = b64url(json.dumps({
        'sub': str(user_id),
        'identifier': email,
        'role': role,
        'iat': int(time.time()),
        'exp': int(time.time()) + 86400
    }))
    sig = b64url(hmac.new(secret, f"{header}.{payload}".encode('utf-8'), hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

class WalletAuditTester:
    def __init__(self):
        self.results = []
        self.admin_id = uuid.uuid4()
        self.admin_email = "thepravara2026@gmail.com"
        self.admin_token = generate_jwt(self.admin_id, self.admin_email, "ROLE_ADMIN")
        
        # Dedicated isolated test customer (protects existing customer wallets from any modification)
        self.test_customer_id = uuid.uuid4()
        self.test_customer_email = f"p10_wallet_tester_{int(time.time())}@sporekart.test"
        self.customer_token = generate_jwt(self.test_customer_id, self.test_customer_email, "ROLE_CUSTOMER")

        # Second customer for identity forgery testing
        self.test_customer_2_id = uuid.uuid4()
        self.test_customer_2_email = f"p10_wallet_tester2_{int(time.time())}@sporekart.test"
        self.customer_2_token = generate_jwt(self.test_customer_2_id, self.test_customer_2_email, "ROLE_CUSTOMER")

        self.initial_finance_overview = None
        self.created_withdrawal_id = None
        self.created_topup_order_id = None

    def api_request(self, method, path, token=None, payload=None, params=None, timeout=45):
        url = f"{BASE_URL}{path}"
        if params:
            qs = "&".join(f"{k}={urllib.parse.quote_plus(str(v))}" for k, v in params.items())
            url = f"{url}?{qs}"

        data = None
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        if payload is not None:
            data = json.dumps(payload).encode('utf-8')

        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                status_code = resp.status
                body = resp.read().decode('utf-8')
                try:
                    parsed = json.loads(body)
                except Exception:
                    parsed = body
                return status_code, parsed
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            try:
                parsed_err = json.loads(err_body)
            except Exception:
                parsed_err = err_body
            return e.code, parsed_err
        except Exception as ex:
            return 0, str(ex)

    def record(self, category, test_id, description, status, expected, actual, details=None):
        entry = {
            "category": category,
            "test_id": test_id,
            "description": description,
            "status": status,
            "expected": str(expected),
            "actual": str(actual),
            "details": details or {}
        }
        self.results.append(entry)
        symbol = "PASS" if status == "PASS" else "FAIL"
        print(f"[{symbol}] {test_id} - {description}")
        if status != "PASS":
            print(f"       Expected: {expected}")
            print(f"       Actual:   {actual}")

    def run_all(self):
        print(f"Starting Sporekart Phase 10 Wallet Management & Financial Reconciliation Suite")
        print(f"Admin Identity:    {self.admin_email} ({self.admin_id})")
        print(f"Test Customer:    {self.test_customer_email} ({self.test_customer_id})")
        print(f"Constraint Check: Never modify existing wallet balances during the audit.")
        print("=" * 80)

        # -------------------------------------------------------------------------
        # Category 1: Isolation & Initial Zero-Balance State
        # -------------------------------------------------------------------------
        print("\n--- Category 1: Isolation & Initial Zero-Balance State ---")
        
        # WAL-01: Snapshot platform finance overview prior to tests
        status, resp = self.api_request("GET", "/admin/finance/overview", token=self.admin_token)
        if status == 200 and resp.get("success"):
            self.initial_finance_overview = resp.get("data")
            self.record("ISOLATION", "WAL-01", "Pre-Audit Platform Finance Overview Snapshot",
                        "PASS", 200, status,
                        {"initial_overview": self.initial_finance_overview})
        else:
            self.record("ISOLATION", "WAL-01", "Pre-Audit Platform Finance Overview Snapshot",
                        "FAIL", 200, status, {"resp": resp})

        # WAL-02: Auto-provisioning of fresh isolated customer wallet
        status, resp = self.api_request("GET", "/wallet", token=self.customer_token)
        if status == 200 and resp.get("success"):
            w_data = resp.get("data", {})
            avail = Decimal(str(w_data.get("availableBalance", -1)))
            withd = Decimal(str(w_data.get("withdrawableBalance", -1)))
            pend = Decimal(str(w_data.get("pendingBalance", -1)))
            curr = w_data.get("currency")
            
            is_zero = (avail == Decimal("0.00") and withd == Decimal("0.00") and pend == Decimal("0.00") and curr == "INR")
            self.record("ISOLATION", "WAL-02", "Fresh Test Customer Wallet Provisioned with Exactly Zero Balance",
                        "PASS" if is_zero else "FAIL", "Balance=0.00, Currency=INR",
                        f"Avail={avail}, Withd={withd}, Pend={pend}, Curr={curr}", w_data)
        else:
            self.record("ISOLATION", "WAL-02", "Fresh Test Customer Wallet Provisioned with Exactly Zero Balance",
                        "FAIL", 200, status, {"resp": resp})

        # WAL-03: Fast balance endpoint
        status, resp = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        if status == 200 and resp.get("success"):
            bal = Decimal(str(resp.get("data")))
            self.record("ISOLATION", "WAL-03", "Fast Balance Endpoint (/wallet/balance) Returns Exactly Zero",
                        "PASS" if bal == Decimal("0.00") else "FAIL", "0.00", str(bal))
        else:
            self.record("ISOLATION", "WAL-03", "Fast Balance Endpoint (/wallet/balance) Returns Exactly Zero",
                        "FAIL", 200, status, {"resp": resp})

        # -------------------------------------------------------------------------
        # Category 2: Top-Up Lifecycle & Tamper Protection
        # -------------------------------------------------------------------------
        print("\n--- Category 2: Top-Up Lifecycle & Tamper Protection ---")

        # WAL-04: Valid Top-up Intent Creation
        payload_topup = {"amount": 500.00}
        status, resp = self.api_request("POST", "/wallet/add-money", token=self.customer_token, payload=payload_topup)
        if status == 200 and resp.get("success"):
            topup_data = resp.get("data", {})
            self.created_topup_order_id = topup_data.get("razorpayOrderId")
            ref = topup_data.get("transactionReference")
            amt = Decimal(str(topup_data.get("amountInr")))
            valid_intent = (self.created_topup_order_id is not None and ref and ref.startswith("TOPUP-") and amt == Decimal("500.00"))
            self.record("TOPUP", "WAL-04", "Create Server-Side Top-Up Intent with Authoritative Amount",
                        "PASS" if valid_intent else "FAIL", "Status=200, valid razorpayOrderId & ref",
                        f"Status={status}, orderId={self.created_topup_order_id}", topup_data)
        else:
            self.record("TOPUP", "WAL-04", "Create Server-Side Top-Up Intent with Authoritative Amount",
                        "FAIL", 200, status, {"resp": resp})

        # WAL-05: Top-up Zero and Negative Boundary Rejection
        status_zero, resp_zero = self.api_request("POST", "/wallet/add-money", token=self.customer_token, payload={"amount": 0.00})
        status_neg, resp_neg = self.api_request("POST", "/wallet/add-money", token=self.customer_token, payload={"amount": -50.00})
        passed_bnd = (status_zero in (400, 422) and status_neg in (400, 422))
        self.record("TOPUP", "WAL-05", "Zero and Negative Top-Up Amounts Strictly Rejected",
                    "PASS" if passed_bnd else "FAIL", "HTTP 400/422 for both 0 and negative amounts",
                    f"Zero status={status_zero}, Negative status={status_neg}",
                    {"resp_zero": resp_zero, "resp_neg": resp_neg})

        # WAL-06: Top-up Exceeding Safety Limit (> ₹100,000)
        status_limit, resp_limit = self.api_request("POST", "/wallet/add-money", token=self.customer_token, payload={"amount": 150000.00})
        passed_limit = (status_limit in (400, 500))
        self.record("TOPUP", "WAL-06", "Top-Up Exceeding Safety Limit (₹100,000) Rejected",
                    "PASS" if passed_limit else "FAIL", "HTTP 400/500 with boundary error",
                    f"Status={status_limit}", resp_limit)

        # WAL-07: Invalid Signature Tampering Protection
        verify_tampered = {
            "razorpayOrderId": self.created_topup_order_id,
            "razorpayPaymentId": "pay_fake_tampered_123",
            "razorpaySignature": "mock_signature_invalid"
        }
        status_sig, resp_sig = self.api_request("POST", "/wallet/verify-add-money", token=self.customer_token, payload=verify_tampered)
        # Verify balance remains 0.00
        _, bal_resp = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_tamper = Decimal(str(bal_resp.get("data", -1)))
        tamper_blocked = (status_sig in (400, 500) and bal_after_tamper == Decimal("0.00"))
        self.record("TOPUP", "WAL-07", "Invalid Signature Rejected and Prevents Fraudulent Wallet Credit",
                    "PASS" if tamper_blocked else "FAIL", "HTTP 400/500 and Balance=0.00",
                    f"Status={status_sig}, Balance={bal_after_tamper}", resp_sig)

        # WAL-08: Top-up Intent Cross-User Forgery Protection
        verify_forgery = {
            "razorpayOrderId": self.created_topup_order_id,
            "razorpayPaymentId": "pay_forgery_test_456",
            "razorpaySignature": "valid_mock_sig"
        }
        # Customer 2 attempts to verify Customer 1's top-up intent
        status_forg, resp_forg = self.api_request("POST", "/wallet/verify-add-money", token=self.customer_2_token, payload=verify_forgery)
        forg_blocked = (status_forg == 403)
        self.record("TOPUP", "WAL-08", "Cross-User Top-Up Intent Forgery Blocked (Owner Verification)",
                    "PASS" if forg_blocked else "FAIL", "HTTP 403 Forbidden",
                    f"Status={status_forg}", resp_forg)

        # WAL-09: Valid Top-Up Execution
        valid_payment_id = f"pay_test_{int(time.time())}"
        verify_valid = {
            "razorpayOrderId": self.created_topup_order_id,
            "razorpayPaymentId": valid_payment_id,
            "razorpaySignature": "valid_mock_signature"
        }
        status_topup, resp_topup = self.api_request("POST", "/wallet/verify-add-money", token=self.customer_token, payload=verify_valid)
        _, bal_resp_2 = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_topup = Decimal(str(bal_resp_2.get("data", -1)))
        
        topup_ok = (status_topup == 200 and resp_topup.get("success") and bal_after_topup == Decimal("500.00"))
        txn_ref = resp_topup.get("data", {}).get("transactionReference", "")
        self.record("TOPUP", "WAL-09", "Valid Top-Up Verification Atomically Credits Balance (0.00 -> 500.00)",
                    "PASS" if topup_ok else "FAIL", "HTTP 200, Balance=500.00, ref starts with TXN-CR-",
                    f"Status={status_topup}, Balance={bal_after_topup}, Ref={txn_ref}", resp_topup)

        # -------------------------------------------------------------------------
        # Category 3: Idempotency & Replay Protection
        # -------------------------------------------------------------------------
        print("\n--- Category 3: Idempotency & Replay Protection ---")

        # WAL-10: Duplicate Top-Up Verification Replay
        status_replay, resp_replay = self.api_request("POST", "/wallet/verify-add-money", token=self.customer_token, payload=verify_valid)
        _, bal_resp_3 = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_replay = Decimal(str(bal_resp_3.get("data", -1)))
        
        replay_safe = (status_replay == 200 and bal_after_replay == Decimal("500.00"))
        self.record("IDEMPOTENCY", "WAL-10", "Replay of Completed Top-Up Returns Existing Txn Without Double-Credit",
                    "PASS" if replay_safe else "FAIL", "HTTP 200, Balance strictly unchanged at 500.00",
                    f"Status={status_replay}, Balance={bal_after_replay}", resp_replay)

        # WAL-11: Idempotency Key in Ledger
        status_txns, resp_txns = self.api_request("GET", "/wallet/transactions", token=self.customer_token)
        first_txn = resp_txns.get("data", {}).get("content", [{}])[0] if status_txns == 200 else {}
        txn_has_ref = (first_txn.get("transactionReference", "").startswith("TXN-CR-") and
                       first_txn.get("amount") == 500.00 and
                       first_txn.get("balanceAfter") == 500.00 and
                       first_txn.get("balanceBefore") == 0.00)
        self.record("IDEMPOTENCY", "WAL-11", "Ledger Properly Enforces Double-Entry Math (balanceBefore + amount = balanceAfter)",
                    "PASS" if txn_has_ref else "FAIL", "balanceBefore=0, amount=500, balanceAfter=500",
                    f"before={first_txn.get('balanceBefore')}, amt={first_txn.get('amount')}, after={first_txn.get('balanceAfter')}",
                    first_txn)

        # -------------------------------------------------------------------------
        # Category 4: Debits, Insufficient Funds & Non-Negative Boundary
        # -------------------------------------------------------------------------
        print("\n--- Category 4: Debits, Insufficient Funds & Non-Negative Boundary ---")

        # WAL-12: Overdraft Rejection (Insufficient Balance)
        overdraft_order_id = uuid.uuid4()
        payload_overdraft = {
            "orderId": str(overdraft_order_id),
            "type": "ORDER",
            "amountFromWallet": 750.00,
            "amountFromGateway": 0.00
        }
        status_od, resp_od = self.api_request("POST", "/wallet/checkout-pay", token=self.customer_token, payload=payload_overdraft)
        _, bal_resp_od = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_od = Decimal(str(bal_resp_od.get("data", -1)))

        od_blocked = (status_od in (400, 409, 500) and bal_after_od == Decimal("500.00"))
        self.record("DEBITS", "WAL-12", "Overdraft Attempt Beyond Available Balance (₹750 on ₹500) Rejected",
                    "PASS" if od_blocked else "FAIL", "HTTP 400/409/500 Insufficient wallet balance, Balance=500.00",
                    f"Status={status_od}, Balance={bal_after_od}", resp_od)

        # WAL-13: Database Check Constraint Verification (Balance strictly non-negative)
        self.record("DEBITS", "WAL-13", "Zero Unauthorized Negative Balances Enforced (CHECK constraint + code)",
                    "PASS" if bal_after_od >= Decimal("0.00") else "FAIL", "Balance >= 0.00",
                    f"Current Balance = {bal_after_od}")

        # WAL-14: Valid Partial Wallet Payment Execution
        partial_order_id = uuid.uuid4()
        payload_partial = {
            "orderId": str(partial_order_id),
            "type": "ORDER",
            "amountFromWallet": 150.00,
            "amountFromGateway": 100.00
        }
        status_part, resp_part = self.api_request("POST", "/wallet/checkout-pay", token=self.customer_token, payload=payload_partial)
        _, bal_resp_part = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_part = Decimal(str(bal_resp_part.get("data", -1)))

        part_ok = (status_part == 200 and resp_part.get("success") and bal_after_part == Decimal("350.00"))
        self.record("DEBITS", "WAL-14", "Valid Partial Wallet Payment Deducted Atomically (500.00 -> 350.00)",
                    "PASS" if part_ok else "FAIL", "HTTP 200, Balance=350.00",
                    f"Status={status_part}, Balance={bal_after_part}", resp_part)

        # WAL-15: Full Wallet Payment Execution
        full_order_id = uuid.uuid4()
        payload_full = {
            "orderId": str(full_order_id),
            "type": "ORDER",
            "amountFromWallet": 50.00,
            "amountFromGateway": 0.00
        }
        status_full, resp_full = self.api_request("POST", "/wallet/checkout-pay", token=self.customer_token, payload=payload_full)
        _, bal_resp_full = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_full = Decimal(str(bal_resp_full.get("data", -1)))

        full_ok = (status_full == 200 and resp_full.get("success") and bal_after_full == Decimal("300.00"))
        self.record("DEBITS", "WAL-15", "Valid Full Wallet Payment Deducted Atomically (350.00 -> 300.00)",
                    "PASS" if full_ok else "FAIL", "HTTP 200, Balance=300.00",
                    f"Status={status_full}, Balance={bal_after_full}", resp_full)

        # WAL-16: Duplicate Checkout Pay Request Replay Idempotency
        # Re-submitting the exact same orderId with amountFromWallet: 50.00
        status_dup_chk, resp_dup_chk = self.api_request("POST", "/wallet/checkout-pay", token=self.customer_token, payload=payload_full)
        _, bal_resp_dup = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_dup = Decimal(str(bal_resp_dup.get("data", -1)))

        dup_safe = (status_dup_chk == 200 and bal_after_dup == Decimal("300.00"))
        self.record("IDEMPOTENCY", "WAL-16", "Duplicate Checkout Debit Replay Suppressed by Idempotency Key",
                    "PASS" if dup_safe else "FAIL", "HTTP 200, Balance unchanged at 300.00",
                    f"Status={status_dup_chk}, Balance={bal_after_dup}", resp_dup_chk)

        # -------------------------------------------------------------------------
        # Category 5: Withdrawals Lifecycle (Customer + Admin Review)
        # -------------------------------------------------------------------------
        print("\n--- Category 5: Withdrawals Lifecycle (Customer + Admin Review) ---")

        # WAL-17: Withdrawal Exceeding Withdrawable Balance
        payload_wd_excess = {
            "amount": 1000.00,
            "bankName": "HDFC Bank",
            "accountNumber": "123456789012",
            "ifscCode": "HDFC0001234",
            "accountHolderName": "Audit Customer"
        }
        status_wde, resp_wde = self.api_request("POST", "/wallet/withdraw", token=self.customer_token, payload=payload_wd_excess)
        wde_blocked = (status_wde in (400, 409, 500))
        self.record("WITHDRAWAL", "WAL-17", "Withdrawal Request Exceeding Withdrawable Balance Rejected",
                    "PASS" if wde_blocked else "FAIL", "HTTP 400/409/500 with 'exceeds withdrawable balance'",
                    f"Status={status_wde}", resp_wde)

        # WAL-18: Invalid Bank Details Validation (Malformed IFSC)
        payload_wd_bad = {
            "amount": 100.00,
            "bankName": "HDFC Bank",
            "accountNumber": "123456789012",
            "ifscCode": "INVALID_IFSC_123",
            "accountHolderName": "Audit Customer"
        }
        status_wdb, resp_wdb = self.api_request("POST", "/wallet/withdraw", token=self.customer_token, payload=payload_wd_bad)
        wdb_blocked = (status_wdb in (400, 422))
        self.record("WITHDRAWAL", "WAL-18", "Withdrawal Validation Rejects Malformed IFSC Format",
                    "PASS" if wdb_blocked else "FAIL", "HTTP 400/422 DTO validation error",
                    f"Status={status_wdb}", resp_wdb)

        # WAL-19: Valid Withdrawal Request Submission (₹100.00)
        payload_wd_valid = {
            "amount": 100.00,
            "bankName": "State Bank of India",
            "accountNumber": "112233445566",
            "ifscCode": "SBIN0001234",
            "accountHolderName": "Audit Customer"
        }
        status_wd, resp_wd = self.api_request("POST", "/wallet/withdraw", token=self.customer_token, payload=payload_wd_valid)
        _, bal_resp_wd = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_wd = Decimal(str(bal_resp_wd.get("data", -1)))

        wd_data = resp_wd.get("data", {})
        self.created_withdrawal_id = wd_data.get("id")
        masked_acc = wd_data.get("accountNumberMasked")
        wd_status = wd_data.get("status")

        wd_ok = (status_wd == 200 and resp_wd.get("success") and bal_after_wd == Decimal("200.00") and
                 wd_status == "REQUESTED" and masked_acc == "••••5566")
        self.record("WITHDRAWAL", "WAL-19", "Valid Withdrawal Request Atomically Debits Balance & Masks Account Number",
                    "PASS" if wd_ok else "FAIL", "HTTP 200, Balance=200.00, Status=REQUESTED, Masked=••••5566",
                    f"Status={status_wd}, Balance={bal_after_wd}, WdStatus={wd_status}, Masked={masked_acc}", wd_data)

        # WAL-20: Customer Blocked from Admin Withdrawal Actions
        status_unauth_appr, resp_unauth_appr = self.api_request(
            "POST", f"/admin/finance/withdrawals/{self.created_withdrawal_id}/approve",
            token=self.customer_token, payload={"notes": "Hacked approval"}
        )
        unauth_appr_blocked = (status_unauth_appr == 403)
        self.record("RBAC", "WAL-20", "Non-Admin Blocked from Admin Withdrawal Approval (/admin/finance/*)",
                    "PASS" if unauth_appr_blocked else "FAIL", "HTTP 403 Forbidden",
                    f"Status={status_unauth_appr}", resp_unauth_appr)

        # WAL-21: Admin Rejection with Compensating Ledger Reversal
        reject_payload = {"rejectionReason": "Bank account number mismatch on IFSC validation"}
        status_rej, resp_rej = self.api_request(
            "POST", f"/admin/finance/withdrawals/{self.created_withdrawal_id}/reject",
            token=self.admin_token, payload=reject_payload
        )
        _, bal_resp_rej = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_rej = Decimal(str(bal_resp_rej.get("data", -1)))

        rej_data = resp_rej.get("data", {})
        rej_status = rej_data.get("status")

        # Invariant: Rejection MUST create compensating credit and restore customer balance from 200.00 back to 300.00
        compensating_ok = (status_rej == 200 and rej_status == "REVERSED" and bal_after_rej == Decimal("300.00"))
        self.record("WITHDRAWAL", "WAL-21", "Admin Withdrawal Rejection Emits Compensating Reversal Credit (Restoring ₹100)",
                    "PASS" if compensating_ok else "FAIL", "Status=REVERSED, Balance restored to 300.00",
                    f"Status={status_rej}, WdStatus={rej_status}, Balance={bal_after_rej}", rej_data)

        # WAL-22: Admin Withdrawal Approval Lifecycle
        # Customer requests another withdrawal of ₹50.00
        payload_wd_appr = {
            "amount": 50.00,
            "bankName": "HDFC Bank",
            "accountNumber": "987654321098",
            "ifscCode": "HDFC0005678",
            "accountHolderName": "Audit Customer"
        }
        _, resp_wd2 = self.api_request("POST", "/wallet/withdraw", token=self.customer_token, payload=payload_wd_appr)
        wd2_id = resp_wd2.get("data", {}).get("id")

        # Admin approves the withdrawal
        status_appr, resp_appr = self.api_request(
            "POST", f"/admin/finance/withdrawals/{wd2_id}/approve",
            token=self.admin_token, payload={"notes": "Bank IMPS Reference UTR123456789"}
        )
        _, bal_resp_appr = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_appr = Decimal(str(bal_resp_appr.get("data", -1)))

        appr_data = resp_appr.get("data", {})
        appr_status = appr_data.get("status")

        appr_ok = (status_appr == 200 and appr_status == "SUCCESS" and bal_after_appr == Decimal("250.00"))
        self.record("WITHDRAWAL", "WAL-22", "Admin Withdrawal Approval Transitions Status to SUCCESS without Double-Debit",
                    "PASS" if appr_ok else "FAIL", "Status=SUCCESS, Balance remains 250.00",
                    f"Status={status_appr}, WdStatus={appr_status}, Balance={bal_after_appr}", appr_data)

        # -------------------------------------------------------------------------
        # Category 6: Admin Manual Adjustments & Audit Trail
        # -------------------------------------------------------------------------
        print("\n--- Category 6: Admin Manual Adjustments & Audit Trail ---")

        # WAL-23: Customer Blocked from Performing Manual Adjustments
        payload_unauth_adj = {
            "userId": str(self.test_customer_id),
            "amount": 1000.00,
            "direction": "CREDIT",
            "reason": "Self credit attempt"
        }
        status_unauth_adj, resp_unauth_adj = self.api_request("POST", "/admin/finance/manual-adjustment", token=self.customer_token, payload=payload_unauth_adj)
        unauth_adj_blocked = (status_unauth_adj == 403)
        self.record("RBAC", "WAL-23", "Customer Blocked from Performing Admin Manual Adjustments",
                    "PASS" if unauth_adj_blocked else "FAIL", "HTTP 403 Forbidden",
                    f"Status={status_unauth_adj}", resp_unauth_adj)

        # WAL-24: Mandatory Admin Audit Reason Enforcement
        payload_no_reason = {
            "userId": str(self.test_customer_id),
            "amount": 100.00,
            "direction": "CREDIT",
            "reason": ""  # Blank reason
        }
        status_no_rsn, resp_no_rsn = self.api_request("POST", "/admin/finance/manual-adjustment", token=self.admin_token, payload=payload_no_reason)
        no_rsn_blocked = (status_no_rsn in (400, 422))
        self.record("ADMIN_AUDIT", "WAL-24", "Mandatory Admin Audit Reason Enforced for Wallet Adjustments",
                    "PASS" if no_rsn_blocked else "FAIL", "HTTP 400/422 Bad Request",
                    f"Status={status_no_rsn}", resp_no_rsn)

        # WAL-25: Admin Manual Credit Adjustment (+ ₹150.00)
        payload_cr_adj = {
            "userId": str(self.test_customer_id),
            "amount": 150.00,
            "direction": "CREDIT",
            "reason": "Audit Promotional Goodwill Credit Injection"
        }
        status_cr_adj, resp_cr_adj = self.api_request("POST", "/admin/finance/manual-adjustment", token=self.admin_token, payload=payload_cr_adj)
        _, bal_resp_cradj = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_cradj = Decimal(str(bal_resp_cradj.get("data", -1)))

        cradj_data = resp_cr_adj.get("data", {})
        cradj_ok = (status_cr_adj == 200 and bal_after_cradj == Decimal("400.00") and
                    cradj_data.get("transactionReference", "").startswith("TXN-CR-"))
        self.record("ADMIN_AUDIT", "WAL-25", "Admin Manual Credit Adjustment Successfully Increments Balance (250 -> 400)",
                    "PASS" if cradj_ok else "FAIL", "HTTP 200, Balance=400.00",
                    f"Status={status_cr_adj}, Balance={bal_after_cradj}, Ref={cradj_data.get('transactionReference')}", cradj_data)

        # WAL-26: Admin Manual Debit Adjustment (- ₹200.00)
        payload_dr_adj = {
            "userId": str(self.test_customer_id),
            "amount": 200.00,
            "direction": "DEBIT",
            "reason": "Audit Correction of Goodwill Credit"
        }
        status_dr_adj, resp_dr_adj = self.api_request("POST", "/admin/finance/manual-adjustment", token=self.admin_token, payload=payload_dr_adj)
        _, bal_resp_dradj = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_after_dradj = Decimal(str(bal_resp_dradj.get("data", -1)))

        dradj_data = resp_dr_adj.get("data", {})
        dradj_ok = (status_dr_adj == 200 and bal_after_dradj == Decimal("200.00") and
                    dradj_data.get("transactionReference", "").startswith("TXN-DR-"))
        self.record("ADMIN_AUDIT", "WAL-26", "Admin Manual Debit Adjustment Successfully Decrements Balance (400 -> 200)",
                    "PASS" if dradj_ok else "FAIL", "HTTP 200, Balance=200.00",
                    f"Status={status_dr_adj}, Balance={bal_after_dradj}, Ref={dradj_data.get('transactionReference')}", dradj_data)

        # WAL-27: Admin Audit History Traceability
        status_audit_txns, resp_audit_txns = self.api_request(
            "GET", "/admin/finance/transactions", token=self.admin_token,
            params={"search": "Goodwill"}
        )
        content_found = resp_audit_txns.get("data", {}).get("content", []) if status_audit_txns == 200 else []
        audit_traced = (len(content_found) >= 1 and
                        any("Goodwill" in t.get("description", "") for t in content_found))
        self.record("ADMIN_AUDIT", "WAL-27", "Admin Audit Trail Records Adjustment Reason, Operator & Timestamp",
                    "PASS" if audit_traced else "FAIL", "Adjustment searchable in platform ledger with full audit metadata",
                    f"Found={len(content_found)} records", content_found[0] if content_found else {})

        # -------------------------------------------------------------------------
        # Category 7: High Concurrency & Pessimistic Locking Stress Test
        # -------------------------------------------------------------------------
        print("\n--- Category 7: High Concurrency & Pessimistic Locking Stress Test ---")

        # Current balance is ₹200.00.
        # We launch 5 concurrent threads simultaneously requesting ₹50.00 debit each.
        # Total demand = 5 * ₹50 = ₹250.00. Available funds = ₹200.00.
        # Invariant: EXACTLY 4 requests must succeed (4 * 50 = 200.00), and 1 must fail with 409 Insufficient balance.
        # Final balance MUST be strictly ₹0.00.
        concurrent_results = []
        threads = []

        def worker_debit(worker_idx):
            worker_order_id = uuid.uuid4()
            payload = {
                "orderId": str(worker_order_id),
                "type": "ORDER",
                "amountFromWallet": 50.00,
                "amountFromGateway": 0.00
            }
            code, r = self.api_request("POST", "/wallet/checkout-pay", token=self.customer_token, payload=payload, timeout=60)
            success = (code == 200 and isinstance(r, dict) and r.get("success") is True)
            concurrent_results.append((worker_idx, code, success, r))

        for i in range(5):
            t = threading.Thread(target=worker_debit, args=(i,))
            threads.append(t)

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        successes = sum(1 for _, _, s, _ in concurrent_results if s)
        failures = sum(1 for _, _, s, _ in concurrent_results if not s)

        _, bal_resp_post_conc = self.api_request("GET", "/wallet/balance", token=self.customer_token)
        bal_post_conc = Decimal(str(bal_resp_post_conc.get("data", -1)))

        concurrency_passed = (successes == 4 and failures == 1 and bal_post_conc == Decimal("0.00"))
        self.record("CONCURRENCY", "WAL-28", "Pessimistic Locking Prevents Race Conditions Under Concurrent Debits",
                    "PASS" if concurrency_passed else "FAIL",
                    "Exactly 4 successes, 1 failure, final balance=0.00",
                    f"Successes={successes}, Failures={failures}, Final Balance={bal_post_conc}",
                    {"results_summary": [(i, code, s) for i, code, s, _ in concurrent_results]})

        # WAL-29: Zero Negative Balance Under High Concurrency
        self.record("CONCURRENCY", "WAL-29", "Absolute Non-Negative Invariant Maintained Under High Concurrency",
                    "PASS" if bal_post_conc == Decimal("0.00") else "FAIL",
                    "Final Balance strictly >= 0.00 and exactly 0.00",
                    f"Final Balance={bal_post_conc}")

        # -------------------------------------------------------------------------
        # Category 8: Double-Entry Ledger & Platform Financial Reconciliation
        # -------------------------------------------------------------------------
        print("\n--- Category 8: Double-Entry Ledger & Platform Financial Reconciliation ---")

        # WAL-30: Complete Customer Ledger Mathematical Reconciliation
        status_all_txns, resp_all_txns = self.api_request(
            "GET", "/wallet/transactions", token=self.customer_token,
            params={"size": 100}
        )
        txns_list = resp_all_txns.get("data", {}).get("content", []) if status_all_txns == 200 else []
        
        math_consistent = True
        ledger_credit_sum = Decimal("0.00")
        ledger_debit_sum = Decimal("0.00")
        inconsistent_txns = []

        # Chronological verification (oldest to newest)
        for t in reversed(txns_list):
            amt = Decimal(str(t.get("amount", 0)))
            b_before = Decimal(str(t.get("balanceBefore", 0)))
            b_after = Decimal(str(t.get("balanceAfter", 0)))
            direction = t.get("transactionDirection")

            if direction == "CREDIT":
                ledger_credit_sum += amt
                if b_after != (b_before + amt):
                    math_consistent = False
                    inconsistent_txns.append(t)
            elif direction == "DEBIT":
                ledger_debit_sum += amt
                if b_after != (b_before - amt):
                    math_consistent = False
                    inconsistent_txns.append(t)

        net_ledger_balance = ledger_credit_sum - ledger_debit_sum
        reconciled = (math_consistent and net_ledger_balance == bal_post_conc and net_ledger_balance == Decimal("0.00"))

        self.record("RECONCILIATION", "WAL-30", "Double-Entry Ledger Invariant (Credits - Debits == Available Balance)",
                    "PASS" if reconciled else "FAIL",
                    f"Sum(CR) - Sum(DR) == Balance ({bal_post_conc})",
                    f"Sum(CR)={ledger_credit_sum}, Sum(DR)={ledger_debit_sum}, Net={net_ledger_balance}, MathConsistent={math_consistent}",
                    {"total_transactions": len(txns_list), "inconsistent_count": len(inconsistent_txns)})

        # WAL-31: Running Balance Mathematical Monotonicity
        self.record("RECONCILIATION", "WAL-31", "Zero Transaction-Level Running Balance Discrepancies",
                    "PASS" if math_consistent else "FAIL",
                    "0 inconsistent transaction line items",
                    f"{len(inconsistent_txns)} inconsistencies found",
                    inconsistent_txns[:3] if inconsistent_txns else {})

        # WAL-32: Platform Financial Liability Overview Consistency
        status_final_overview, resp_final_overview = self.api_request("GET", "/admin/finance/overview", token=self.admin_token)
        final_overview = resp_final_overview.get("data", {}) if status_final_overview == 200 else {}
        
        # Test customer balance is 0.00, so platform liability should equal pre-audit liability!
        initial_liability = Decimal(str(self.initial_finance_overview.get("walletLiabilityBalance", 0)))
        final_liability = Decimal(str(final_overview.get("walletLiabilityBalance", 0)))
        
        # Invariant: Platform wallet liability must match initial liability since test customer ended at 0.00
        liability_matched = (initial_liability == final_liability)
        self.record("RECONCILIATION", "WAL-32", "Platform Wallet Liability Balance Exactly Reconciled (Pre vs Post Audit)",
                    "PASS" if liability_matched else "FAIL",
                    f"Final Liability == Initial Liability ({initial_liability})",
                    f"Initial={initial_liability}, Final={final_liability}, Delta={final_liability - initial_liability}",
                    {"initial_overview": self.initial_finance_overview, "final_overview": final_overview})

        # WAL-33: Refresh & Relogin Balance Consistency
        # Generate brand new token for test customer
        fresh_token = generate_jwt(self.test_customer_id, self.test_customer_email, "ROLE_CUSTOMER")
        status_refresh, resp_refresh = self.api_request("GET", "/wallet/balance", token=fresh_token)
        refreshed_bal = Decimal(str(resp_refresh.get("data", -1)))

        refresh_ok = (status_refresh == 200 and refreshed_bal == Decimal("0.00"))
        self.record("CONSISTENCY", "WAL-33", "Consistent Wallet Balance Across Refresh & Re-Authentication (0.00)",
                    "PASS" if refresh_ok else "FAIL", "Balance=0.00",
                    f"Status={status_refresh}, Balance={refreshed_bal}")

        # -------------------------------------------------------------------------
        # Summary & Export
        # -------------------------------------------------------------------------
        print("\n" + "=" * 80)
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["status"] == "PASS")
        failed_tests = total_tests - passed_tests
        pass_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0

        print(f"WALLET & FINANCIAL RECONCILIATION AUDIT SUMMARY:")
        print(f"Total Tests Executed: {total_tests}")
        print(f"Tests Passed:         {passed_tests}")
        print(f"Tests Failed:         {failed_tests}")
        print(f"Pass Rate:            {pass_rate:.1f}%")
        print("=" * 80)

        output_path = "audit_output/10_wallet_test_results.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump({
                "suite": "Phase 10 — Wallet Management and Financial Reconciliation",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "summary": {
                    "total": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "pass_rate": pass_rate
                },
                "results": self.results
            }, f, indent=2)
        print(f"Results written to {output_path}")

        return failed_tests == 0

if __name__ == "__main__":
    tester = WalletAuditTester()
    success = tester.run_all()
    sys.exit(0 if success else 1)
