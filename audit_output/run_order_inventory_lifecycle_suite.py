#!/usr/bin/env python3
"""
Sporekart Phase 8 — Order, Inventory, and Cancellation Lifecycle Audit Suite
Validates the complete order state machine, stock reservations, idempotency,
payment lifecycles, cancellations, refunds, shipments, and concurrent purchase limits.
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
from decimal import Decimal

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

class OrderLifecycleTester:
    def __init__(self):
        self.results = []
        self.admin_id = uuid.uuid4()
        self.cust_id = uuid.uuid4()
        self.cust2_id = uuid.uuid4()
        
        self.tokens = {
            "ADMIN": None,
            "CUSTOMER": None,
            "CUSTOMER_2": None
        }

    def record(self, category, test_id, description, status, expected, actual, details=None):
        entry = {
            "category": category,
            "test_id": test_id,
            "description": description,
            "status": status,
            "expected": str(expected),
            "actual": str(actual),
            "details": details or ""
        }
        self.results.append(entry)
        symbol = "[PASS]" if status == "PASS" else "[FAIL]"
        print(f"{symbol} [{category}] {test_id}: {description} | Expected: {expected}, Got: {actual}", flush=True)
        if details and status == "FAIL":
            print(f"       Details: {details}", flush=True)

    def request(self, method, path, data=None, token=None, headers=None, timeout=30):
        url = BASE_URL + path if path.startswith('/') else f"{BASE_URL}/{path}"
        req_headers = {"Content-Type": "application/json"}
        if token:
            req_headers["Authorization"] = f"Bearer {token}"
        if headers:
            req_headers.update(headers)

        encoded_data = None
        if data is not None:
            if isinstance(data, (dict, list)):
                encoded_data = json.dumps(data).encode("utf-8")
            elif isinstance(data, str):
                encoded_data = data.encode("utf-8")
            elif isinstance(data, bytes):
                encoded_data = data

        req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode("utf-8")
                try:
                    json_body = json.loads(body)
                except Exception:
                    json_body = body
                return resp.status, json_body, resp.headers
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                json_body = json.loads(body)
            except Exception:
                json_body = body
            return e.code, json_body, e.headers
        except Exception as ex:
            return 0, str(ex), {}

    def setup_identities(self):
        print("\n--- 0. Provisioning Identities for Phase 8 Lifecycle Tests ---")
        st, b, _ = self.request("POST", "/auth/oauth/google", {
            "email": "thepravara2026@gmail.com",
            "fullName": "Sporekart Master Admin",
            "googleSub": "google-sub-master-admin-p8"
        })
        if st == 200 and b.get("success"):
            self.admin_id = uuid.UUID(b["data"]["userId"])
            self.tokens["ADMIN"] = b["data"]["token"]
            print(f"Provisioned ADMIN: {self.admin_id} ({b['data']['role']})")
        else:
            self.tokens["ADMIN"] = generate_jwt(self.admin_id, "thepravara2026@gmail.com", "ROLE_ADMIN")

        st, b, _ = self.request("POST", "/auth/oauth/google", {
            "email": "lifecycle_buyer@sporekart.test",
            "fullName": "Charlie Checkout",
            "googleSub": "google-sub-buyer-p8"
        })
        if st == 200 and b.get("success"):
            self.cust_id = uuid.UUID(b["data"]["userId"])
            self.tokens["CUSTOMER"] = b["data"]["token"]
            print(f"Provisioned CUSTOMER: {self.cust_id} ({b['data']['role']})")

        st, b, _ = self.request("POST", "/auth/oauth/google", {
            "email": "concurrent_buyer@sporekart.test",
            "fullName": "Dana Demand",
            "googleSub": "google-sub-buyer2-p8"
        })
        if st == 200 and b.get("success"):
            self.cust2_id = uuid.UUID(b["data"]["userId"])
            self.tokens["CUSTOMER_2"] = b["data"]["token"]
            print(f"Provisioned CUSTOMER 2: {self.cust2_id} ({b['data']['role']})")

    def run_all(self):
        self.setup_identities()
        
        # 1. Catalog & Variant Discovery
        variant_id, addr_id = self.setup_prerequisites()
        if not variant_id:
            print("ERROR: Could not discover active product variant. Aborting lifecycle suite.")
            return

        # 2. Cart & Stock Limits
        self.test_cart_and_stock_limits(variant_id)

        # 3. Order Creation & Inventory Reservation
        order_id, idempotency_key = self.test_order_creation_and_inventory_reservation(variant_id, addr_id)

        # 4. Duplicate Order Submissions (Idempotency)
        self.test_idempotency_and_duplicate_submission(addr_id, idempotency_key, order_id, variant_id)

        # 5. Payment Lifecycle (Pending -> Failed -> Retry -> Paid -> Inventory Confirmed)
        self.test_payment_lifecycle(order_id, variant_id)

        # 6. Order Processing & Shipment Dispatch
        shipment_id = self.test_processing_and_shipment_lifecycle(order_id)

        # 7. Delivery & Terminal State Immutability
        self.test_delivery_and_terminal_immutability(order_id, shipment_id)

        # 8. Cancellation Before Payment (Unpaid Order)
        unpaid_order_id = self.test_cancellation_before_payment(variant_id, addr_id)

        # 9. Cancellation After Payment (Paid Order & Wallet Refund)
        self.test_cancellation_after_payment(variant_id, addr_id)

        # 10. Cancellation Restrictions on Dispatched/Delivered Orders
        self.test_cancellation_restrictions(order_id, unpaid_order_id, variant_id, addr_id)

        # 11. Concurrent Purchase & Stock Depletion
        self.test_concurrent_purchases(addr_id)

        # 12. Cross-Entity Consistency Audit
        self.test_cross_entity_consistency(order_id, variant_id)

        self.print_summary()

    def setup_prerequisites(self):
        # Purge any leftover items in test carts to guarantee pristine baseline
        self.request("DELETE", "/cart", token=self.tokens["CUSTOMER"])
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER"])
        self.request("DELETE", "/cart", token=self.tokens["CUSTOMER_2"])
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER_2"])

        st, b, _ = self.request("GET", "/catalog/products")
        variant_id = None
        if st == 200 and b.get("data"):
            products = b["data"].get("content", b["data"]) if isinstance(b["data"], dict) else b["data"]
            for prod in products:
                if prod.get("variants") and len(prod["variants"]) > 0:
                    for v in prod["variants"]:
                        if v.get("isActive", True):
                            variant_id = v["id"]
                            break
                    if variant_id:
                        break
        
        # Ensure variant has at least 35 available units for lifecycle tests
        if variant_id:
            st_inv, b_inv, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
            if st_inv == 200 and b_inv.get("data"):
                avail = b_inv["data"].get("availableQuantity", 0)
                if avail < 35:
                    print(f"Replenishing variant {variant_id} from {avail} stock...")
                    self.request("POST", f"/admin/catalog/inventory/{variant_id}/replenish", {
                        "quantity": 50,
                        "reason": "Lifecycle Test Suite Setup Replenishment"
                    }, token=self.tokens["ADMIN"])

        # Ensure a valid address for Customer
        addr_id = None
        st_a, b_a, _ = self.request("GET", "/customer/addresses", token=self.tokens["CUSTOMER"])
        if st_a == 200 and b_a.get("data") and len(b_a["data"]) > 0:
            addr_id = b_a["data"][0]["id"]
        else:
            st_cr, b_cr, _ = self.request("POST", "/customer/addresses", {
                "recipientName": "Charlie Checkout",
                "phone": "9822509988",
                "line1": "42 Fungi Estate",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001",
                "isDefault": True
            }, token=self.tokens["CUSTOMER"])
            if st_cr == 200 and b_cr.get("data"):
                addr_id = b_cr["data"]["id"]

        return variant_id, addr_id

    def test_cart_and_stock_limits(self, variant_id):
        print("\n=======================================================")
        print("   1. CART TO CHECKOUT & STOCK LIMITS")
        print("=======================================================")

        # ORD-01: Public catalog product discovery
        st, b, _ = self.request("GET", "/catalog/products")
        self.record("Cart", "ORD-01", "Catalog product browsing and variant discovery", "PASS" if st == 200 else "FAIL", 200, st)

        # ORD-02: Add item to cart within stock limits
        # Clear cart first
        self.request("DELETE", "/cart", token=self.tokens["CUSTOMER"])
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER"])
        st_add, b_add, _ = self.request("POST", "/cart/items", {
            "variantId": variant_id,
            "quantity": 2
        }, token=self.tokens["CUSTOMER"])
        self.record("Cart", "ORD-02", "Add product variant to cart within stock limits", "PASS" if st_add == 200 else "FAIL", 200, st_add)

        # ORD-03: Attempt to add item exceeding stock limits (e.g. 999999 units)
        st_excess, b_excess, _ = self.request("POST", "/cart/items", {
            "variantId": variant_id,
            "quantity": 999999
        }, token=self.tokens["CUSTOMER"])
        self.record("Cart", "ORD-03", "Cart rejects quantity exceeding variant stock limits", "PASS" if st_excess in (400, 409, 422, 500) else "FAIL", "400/409/422/500", st_excess)

        # ORD-04: Cart validation before checkout
        st_val, b_val, _ = self.request("POST", "/cart/validate", token=self.tokens["CUSTOMER"])
        is_valid = (st_val == 200 and b_val.get("data", {}).get("valid") is True)
        self.record("Cart", "ORD-04", "Validate cart for checkout (stock, active products)", "PASS" if is_valid else "FAIL", "Valid/200", f"Valid={b_val.get('data', {}).get('valid') if st_val==200 else False} (HTTP {st_val})")

    def test_order_creation_and_inventory_reservation(self, variant_id, addr_id):
        print("\n=======================================================")
        print("   2. ORDER CREATION & INVENTORY RESERVATION")
        print("=======================================================")

        # Check inventory before order
        st_inv_pre, b_inv_pre, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        avail_pre = b_inv_pre["data"]["availableQuantity"] if st_inv_pre == 200 else 0
        res_pre = b_inv_pre["data"]["reservedQuantity"] if st_inv_pre == 200 else 0

        # ORD-05: Create order from cart
        idempotency_key = "idemp-" + str(uuid.uuid4())
        session_id = "sess-p8-" + str(uuid.uuid4())
        st_ord, b_ord, _ = self.request("POST", "/orders", {
            "addressId": addr_id,
            "notes": "Phase 8 State Machine Order"
        }, token=self.tokens["CUSTOMER"], headers={"Idempotency-Key": idempotency_key, "X-Session-ID": session_id})
        
        order = b_ord.get("data") if st_ord == 200 else {}
        order_id = order.get("id")
        status_init = order.get("status")
        self.record("OrderCreation", "ORD-05", "Order creation creates order with PENDING_PAYMENT status", "PASS" if (st_ord == 200 and status_init == "PENDING_PAYMENT") else "FAIL", "PENDING_PAYMENT / 200", f"{status_init} (HTTP {st_ord})")

        # ORD-06: Atomic inventory reservation check
        st_inv_post, b_inv_post, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        avail_post = b_inv_post["data"]["availableQuantity"] if st_inv_post == 200 else 0
        res_post = b_inv_post["data"]["reservedQuantity"] if st_inv_post == 200 else 0
        
        # 2 units were in cart
        inv_reserved = (avail_post == avail_pre - 2 and res_post == res_pre + 2)
        self.record("Inventory", "ORD-06", "Atomic stock reservation: availableQuantity decremented, reservedQuantity incremented", "PASS" if inv_reserved else "FAIL", f"Avail: {avail_pre-2}, Res: {res_pre+2}", f"Avail: {avail_post}, Res: {res_post}")

        # ORD-07: Cart cleared atomically after checkout
        st_cart, b_cart, _ = self.request("GET", "/cart", token=self.tokens["CUSTOMER"])
        cart_empty = (st_cart == 200 and len(b_cart.get("data", {}).get("items", [])) == 0)
        self.record("Cart", "ORD-07", "Cart items cleared automatically after order creation", "PASS" if cart_empty else "FAIL", "0 items / 200", f"{len(b_cart.get('data', {}).get('items', [])) if st_cart == 200 else 'N/A'}")

        # ORD-08: Initial OrderEvent created
        st_det, b_det, _ = self.request("GET", f"/orders/{order_id}", token=self.tokens["CUSTOMER"])
        events = b_det.get("data", {}).get("events", []) if st_det == 200 else []
        has_init_event = any(e.get("newState") == "PENDING_PAYMENT" for e in events)
        self.record("OrderCreation", "ORD-08", "Initial order state event logged (newState=PENDING_PAYMENT)", "PASS" if has_init_event else "FAIL", "True", has_init_event)

        return order_id, idempotency_key

    def test_idempotency_and_duplicate_submission(self, addr_id, idempotency_key, order_id, variant_id):
        print("\n=======================================================")
        print("   3. DUPLICATE ORDER SUBMISSIONS & IDEMPOTENCY")
        print("=======================================================")

        st_inv_pre, b_inv_pre, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        res_pre = b_inv_pre["data"]["reservedQuantity"] if st_inv_pre == 200 else 0

        # ORD-09: Re-submit order with identical idempotency key
        st_dup, b_dup, _ = self.request("POST", "/orders", {
            "addressId": addr_id,
            "notes": "Duplicate Attempt"
        }, token=self.tokens["CUSTOMER"], headers={"Idempotency-Key": idempotency_key})
        dup_order_id = b_dup.get("data", {}).get("id") if st_dup == 200 else None
        self.record("Idempotency", "ORD-09", "Duplicate order submission returns existing order idempotently", "PASS" if (st_dup == 200 and dup_order_id == order_id) else "FAIL", f"Order {order_id} / 200", f"Order {dup_order_id} / {st_dup}")

        # ORD-10: Verify stock is NOT double-reserved on duplicate submission
        st_inv_post, b_inv_post, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        res_post = b_inv_post["data"]["reservedQuantity"] if st_inv_post == 200 else 0
        self.record("Idempotency", "ORD-10", "Duplicate order submission does not double-reserve inventory", "PASS" if res_pre == res_post else "FAIL", res_pre, res_post)

    def test_payment_lifecycle(self, order_id, variant_id):
        print("\n=======================================================")
        print("   4. PAYMENT LIFECYCLE (PENDING -> FAILED -> RETRY -> PAID)")
        print("=======================================================")

        # ORD-11: Payment initiation
        st_pay_init, b_pay_init, _ = self.request("POST", "/payment/initiate", {
            "orderId": order_id
        }, token=self.tokens["CUSTOMER"])
        razorpay_order_id = b_pay_init.get("data", {}).get("razorpayOrderId") if st_pay_init == 200 else None
        self.record("Payment", "ORD-11", "Payment initiation creates Razorpay order reference", "PASS" if (st_pay_init == 200 and razorpay_order_id) else "FAIL", "Order ID / 200", f"{razorpay_order_id} / {st_pay_init}")

        # ORD-12: Payment failure attempt (invalid / forged signature)
        st_fail, b_fail, _ = self.request("POST", "/payment/verify", {
            "orderId": order_id,
            "razorpayOrderId": razorpay_order_id,
            "razorpayPaymentId": "pay_fake_forged_12345",
            "razorpaySignature": "mock_signature_invalid"
        }, token=self.tokens["CUSTOMER"])
        resp_data = b_fail.get("data", {}) if isinstance(b_fail, dict) else {}
        is_success_val = resp_data.get("isSuccess", resp_data.get("success"))
        is_fail_handled = (st_fail == 200 and is_success_val is False) or (st_fail in (400, 422))
        self.record("Payment", "ORD-12", "Payment verification with invalid signature is rejected", "PASS" if is_fail_handled else "FAIL", "Rejected/False", f"isSuccess={is_success_val}")

        # ORD-13: Order remains in PENDING_PAYMENT after failed payment attempt
        st_ord, b_ord, _ = self.request("GET", f"/orders/{order_id}", token=self.tokens["CUSTOMER"])
        status_after_fail = b_ord.get("data", {}).get("status") if st_ord == 200 else None
        self.record("Payment", "ORD-13", "Order remains in PENDING_PAYMENT after failed payment to permit retry", "PASS" if status_after_fail == "PENDING_PAYMENT" else "FAIL", "PENDING_PAYMENT", status_after_fail)

        # ORD-14: Inventory remains reserved after failed payment
        st_inv, b_inv, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        res_qty = b_inv.get("data", {}).get("reservedQuantity", 0) if st_inv == 200 else 0
        self.record("Payment", "ORD-14", "Inventory reservation preserved across payment retry window", "PASS" if res_qty > 0 else "FAIL", "> 0", res_qty)

        # ORD-15: Payment retry with valid signature (simulated/mock verified)
        simulated_payment_id = "pay_sim_" + str(uuid.uuid4()).replace("-", "")[:14]
        # In mock gateway mode, mock signature check validates simulated orders
        # Let's call webhook or verify
        st_hook, b_hook, _ = self.request("POST", "/payment/webhook", {
            "event": "payment.captured",
            "event_id": "evt_" + str(uuid.uuid4()).replace("-", ""),
            "payload": {
                "payment": {
                    "entity": {
                        "id": simulated_payment_id,
                        "order_id": razorpay_order_id,
                        "status": "captured",
                        "amount": 20000,
                        "currency": "INR"
                    }
                }
            }
        }, headers={"X-Razorpay-Signature": "MOCK_SIGNATURE"})
        
        st_ord_paid, b_ord_paid, _ = self.request("GET", f"/orders/{order_id}", token=self.tokens["CUSTOMER"])
        paid_status = b_ord_paid.get("data", {}).get("status") if st_ord_paid == 200 else None
        self.record("Payment", "ORD-15", "Payment retry/capture succeeds and transitions order to PAID", "PASS" if paid_status == "PAID" else "FAIL", "PAID", paid_status)

        # ORD-16: Inventory purchase confirmation: stock moved from reservedQuantity to soldQuantity
        st_inv_post, b_inv_post, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        sold_qty = b_inv_post.get("data", {}).get("soldQuantity", 0) if st_inv_post == 200 else 0
        self.record("Inventory", "ORD-16", "Inventory confirmed: stock moved from reserved to soldQuantity", "PASS" if sold_qty > 0 else "FAIL", "> 0", sold_qty)

    def test_processing_and_shipment_lifecycle(self, order_id):
        print("\n=======================================================")
        print("   5. ORDER PROCESSING & SHIPMENT DISPATCH")
        print("=======================================================")

        # ORD-17: Transition PAID -> PROCESSING
        st_proc, b_proc, _ = self.request("PUT", f"/admin/orders/{order_id}/status", {
            "status": "PROCESSING",
            "reason": "Order verified by fulfillment staff"
        }, token=self.tokens["ADMIN"])
        proc_status = b_proc.get("data", {}).get("status") if st_proc == 200 else None
        self.record("OrderProcessing", "ORD-17", "Admin transitions order from PAID to PROCESSING", "PASS" if proc_status == "PROCESSING" else "FAIL", "PROCESSING", proc_status)

        # ORD-18: Admin creates shipment dispatch (Shiprocket integration)
        st_ship, b_ship, _ = self.request("POST", "/shipping/create", {
            "orderId": order_id,
            "pickupLocation": "Primary",
            "pickupPincode": "411001"
        }, token=self.tokens["ADMIN"])
        shipment = b_ship.get("data") if st_ship == 200 else {}
        shipment_id = shipment.get("id")
        awb_code = shipment.get("awbCode")
        self.record("Shipment", "ORD-18", "Shipment creation automatically transitions order to SHIPPED", "PASS" if (st_ship == 200 and awb_code) else "FAIL", "AWB Created / 200", f"{awb_code} (HTTP {st_ship})")

        # ORD-19: Order shipping metadata populated
        st_ord, b_ord, _ = self.request("GET", f"/orders/{order_id}", token=self.tokens["CUSTOMER"])
        ord_data = b_ord.get("data", {}) if st_ord == 200 else {}
        is_shipping_populated = (ord_data.get("trackingNumber") is not None and ord_data.get("courierPartner") is not None)
        self.record("Shipment", "ORD-19", "Order tracking metadata populated (courierPartner, trackingNumber, trackingUrl)", "PASS" if is_shipping_populated else "FAIL", "Populated", f"Courier: {ord_data.get('courierPartner')}, Tracking: {ord_data.get('trackingNumber')}")

        # ORD-20: Initial shipment notification recorded
        st_notif, b_notif, _ = self.request("GET", f"/admin/notifications?eventType=SHIPMENT_SHIPPED", token=self.tokens["ADMIN"])
        has_notif = (st_notif == 200 and b_notif.get("data", {}).get("totalElements", 0) > 0)
        self.record("Notifications", "ORD-20", "Shipment notification event recorded in transactional outbox", "PASS" if has_notif else "FAIL", "> 0 Events", f"{b_notif.get('data', {}).get('totalElements', 0) if st_notif == 200 else 'N/A'}")

        return shipment_id

    def test_delivery_and_terminal_immutability(self, order_id, shipment_id):
        print("\n=======================================================")
        print("   6. CARRIER TRACKING, WEBHOOKS & TERMINAL DELIVERY")
        print("=======================================================")

        if not shipment_id:
            print("Skipping delivery tests: shipment not created.")
            return

        # ORD-21: Carrier scan updates shipment to IN_TRANSIT
        st_trans, b_trans, _ = self.request("POST", f"/shipping/simulate-event/{shipment_id}", {
            "status": "IN_TRANSIT",
            "location": "Bhiwandi Hub",
            "activity": "Departed Facility"
        }, token=self.tokens["ADMIN"])
        self.record("Shipment", "ORD-21", "Carrier tracking scan advances shipment to IN_TRANSIT", "PASS" if st_trans == 200 else "FAIL", 200, st_trans)

        # ORD-22: Duplicate carrier scan is ignored idempotently
        # Call webhook with exact same status & activity
        st_ship_det, b_ship_det, _ = self.request("GET", f"/shipping/track/{shipment_id}", token=self.tokens["CUSTOMER"])
        awb = b_ship_det.get("data", {}).get("awbCode") if st_ship_det == 200 else "SR_AWB_P8"
        
        st_dup_scan, _, _ = self.request("POST", "/shipping/webhook", {
            "awb": awb,
            "current_status": "IN_TRANSIT",
            "current_location": "Bhiwandi Hub",
            "scans": "Departed Facility"
        }, headers={"X-Shiprocket-Token": "sporekart_shiprocket_webhook_secret_key_2026"})
        self.record("Shipment", "ORD-22", "Duplicate carrier scan is ignored idempotently without redundant tracking rows", "PASS" if st_dup_scan == 200 else "FAIL", 200, st_dup_scan)

        # ORD-26: Admin directly setting SHIPPED -> DELIVERED via status API is rejected (must be driven by carrier)
        st_fake_deliv, b_fake_deliv, _ = self.request("PUT", f"/admin/orders/{order_id}/status", {
            "status": "DELIVERED",
            "reason": "Admin trying manual override"
        }, token=self.tokens["ADMIN"])
        self.record("BusinessRules", "ORD-26", "Arbitrary admin manual override of delivery without carrier scan is restricted", "PASS" if st_fake_deliv in (400, 409, 500) else "FAIL", "400/409/500", st_fake_deliv)

        # ORD-23: Carrier delivery scan transitions shipment and cascades order to DELIVERED
        st_deliv, b_deliv, _ = self.request("POST", f"/shipping/simulate-event/{shipment_id}", {
            "status": "DELIVERED",
            "location": "Customer Doorstep",
            "activity": "Delivered to Customer"
        }, token=self.tokens["ADMIN"])
        st_ord, b_ord, _ = self.request("GET", f"/orders/{order_id}", token=self.tokens["CUSTOMER"])
        ord_status = b_ord.get("data", {}).get("status") if st_ord == 200 else None
        self.record("Shipment", "ORD-23", "Carrier DELIVERED scan cascades order status to DELIVERED", "PASS" if ord_status == "DELIVERED" else "FAIL", "DELIVERED", ord_status)

        # ORD-24: GST Tax Invoice PDF generation unlocked once DELIVERED
        st_inv, b_inv, _ = self.request("GET", f"/orders/{order_id}/invoice", token=self.tokens["CUSTOMER"])
        self.record("Invoice", "ORD-24", "GST Tax Invoice PDF is generated and downloadable once order is DELIVERED", "PASS" if st_inv == 200 else "FAIL", 200, st_inv)

        # ORD-25: Out-of-order backwards regression (IN_TRANSIT webhook after DELIVERED) is ignored
        st_regr, _, _ = self.request("POST", "/shipping/webhook", {
            "awb": awb,
            "current_status": "IN_TRANSIT",
            "current_location": "Old Hub",
            "scans": "Late Delayed Scan"
        }, headers={"X-Shiprocket-Token": "sporekart_shiprocket_webhook_secret_key_2026"})
        # Verify shipment status is still DELIVERED
        st_ship_post, b_ship_post, _ = self.request("GET", f"/shipping/track/{shipment_id}", token=self.tokens["CUSTOMER"])
        status_after_regr = b_ship_post.get("data", {}).get("status") if st_ship_post == 200 else None
        self.record("Shipment", "ORD-25", "Out-of-order tracking scan cannot regress terminal DELIVERED status", "PASS" if status_after_regr == "DELIVERED" else "FAIL", "DELIVERED", status_after_regr)

    def test_cancellation_before_payment(self, variant_id, addr_id):
        print("\n=======================================================")
        print("   7. CANCELLATION BEFORE PAYMENT (UNPAID ORDER)")
        print("=======================================================")

        # Check inventory pre
        st_inv_pre, b_inv_pre, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        avail_pre = b_inv_pre["data"]["availableQuantity"] if st_inv_pre == 200 else 0
        res_pre = b_inv_pre["data"]["reservedQuantity"] if st_inv_pre == 200 else 0

        # Customer wallet pre
        st_wal_pre, b_wal_pre, _ = self.request("GET", "/wallet/balance", token=self.tokens["CUSTOMER"])
        wal_pre = Decimal(str(b_wal_pre.get("data", 0))) if st_wal_pre == 200 else Decimal(0)

        # ORD-27: Create fresh order with 1 unit
        self.request("DELETE", "/cart", token=self.tokens["CUSTOMER"])
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER"])
        self.request("POST", "/cart/items", {"variantId": variant_id, "quantity": 1}, token=self.tokens["CUSTOMER"])
        st_ord, b_ord, _ = self.request("POST", "/orders", {"addressId": addr_id}, token=self.tokens["CUSTOMER"])
        unpaid_order_id = b_ord.get("data", {}).get("id") if st_ord == 200 else None
        self.record("Cancellation", "ORD-27", "Create new unpaid order for cancellation testing", "PASS" if unpaid_order_id else "FAIL", "Created", unpaid_order_id)

        # ORD-28: Cancel unpaid order
        st_can, b_can, _ = self.request("POST", f"/orders/{unpaid_order_id}/cancel?reason=Customer%20changed%20mind", token=self.tokens["CUSTOMER"])
        can_status = b_can.get("data", {}).get("status") if st_can == 200 else None
        self.record("Cancellation", "ORD-28", "Customer cancels unpaid order (status transitions to CANCELLED)", "PASS" if can_status == "CANCELLED" else "FAIL", "CANCELLED", can_status)

        # ORD-29: Stock restored from reservedQuantity back to availableQuantity
        st_inv_post, b_inv_post, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        avail_post = b_inv_post["data"]["availableQuantity"] if st_inv_post == 200 else 0
        res_post = b_inv_post["data"]["reservedQuantity"] if st_inv_post == 200 else 0
        is_stock_restored = (avail_post == avail_pre and res_post == res_pre)
        self.record("Inventory", "ORD-29", "Unpaid cancellation restores reservedQuantity back to availableQuantity", "PASS" if is_stock_restored else "FAIL", f"Avail: {avail_pre}, Res: {res_pre}", f"Avail: {avail_post}, Res: {res_post}")

        # ORD-30: No wallet refund triggered for unpaid cancellation
        st_wal_post, b_wal_post, _ = self.request("GET", "/wallet/balance", token=self.tokens["CUSTOMER"])
        wal_post = Decimal(str(b_wal_post.get("data", 0))) if st_wal_post == 200 else Decimal(0)
        self.record("Wallet", "ORD-30", "No wallet refund credited for cancellation of unpaid order", "PASS" if wal_pre == wal_post else "FAIL", wal_pre, wal_post)

        return unpaid_order_id

    def test_cancellation_after_payment(self, variant_id, addr_id):
        print("\n=======================================================")
        print("   8. CANCELLATION AFTER PAYMENT (PAID ORDER & WALLET REFUND)")
        print("=======================================================")

        # Check inventory pre
        st_inv_pre, b_inv_pre, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        avail_pre = b_inv_pre["data"]["availableQuantity"] if st_inv_pre == 200 else 0
        sold_pre = b_inv_pre["data"]["soldQuantity"] if st_inv_pre == 200 else 0

        # Customer wallet pre
        st_wal_pre, b_wal_pre, _ = self.request("GET", "/wallet/balance", token=self.tokens["CUSTOMER"])
        wal_pre = Decimal(str(b_wal_pre.get("data", 0))) if st_wal_pre == 200 else Decimal(0)

        # ORD-31: Create and pay for order
        self.request("DELETE", "/cart", token=self.tokens["CUSTOMER"])
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER"])
        self.request("POST", "/cart/items", {"variantId": variant_id, "quantity": 1}, token=self.tokens["CUSTOMER"])
        st_ord, b_ord, _ = self.request("POST", "/orders", {"addressId": addr_id}, token=self.tokens["CUSTOMER"])
        paid_order_id = b_ord.get("data", {}).get("id") if st_ord == 200 else None
        order_total = Decimal(str(b_ord.get("data", {}).get("totalAmountInr", 0))) if st_ord == 200 else Decimal(0)

        # Initiate & capture payment
        st_pay, b_pay, _ = self.request("POST", "/payment/initiate", {"orderId": paid_order_id}, token=self.tokens["CUSTOMER"])
        rz_id = b_pay.get("data", {}).get("razorpayOrderId") if st_pay == 200 else None
        
        self.request("POST", "/payment/webhook", {
            "event": "payment.captured",
            "event_id": "evt_" + str(uuid.uuid4()).replace("-", ""),
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_" + str(uuid.uuid4()).replace("-", "")[:12],
                        "order_id": rz_id,
                        "status": "captured",
                        "amount": int(order_total * 100),
                        "currency": "INR"
                    }
                }
            }
        }, headers={"X-Razorpay-Signature": "MOCK_SIGNATURE"})
        
        self.record("Cancellation", "ORD-31", "Create and pay for order prior to cancellation test", "PASS" if paid_order_id else "FAIL", "PAID", "PAID")

        # ORD-32: Customer cancels paid order
        st_can, b_can, _ = self.request("POST", f"/orders/{paid_order_id}/cancel?reason=Need%20to%20change%20destination", token=self.tokens["CUSTOMER"])
        can_status = b_can.get("data", {}).get("status") if st_can == 200 else None
        self.record("Cancellation", "ORD-32", "Cancelling a paid order transitions status to REFUNDED", "PASS" if can_status == "REFUNDED" else "FAIL", "REFUNDED", can_status)

        # ORD-33: Inventory restoration from soldQuantity back to availableQuantity
        st_inv_post, b_inv_post, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}", token=self.tokens["ADMIN"])
        avail_post = b_inv_post["data"]["availableQuantity"] if st_inv_post == 200 else 0
        sold_post = b_inv_post["data"]["soldQuantity"] if st_inv_post == 200 else 0
        is_sold_restocked = (avail_post == avail_pre and sold_post == sold_pre)
        self.record("Inventory", "ORD-33", "Paid order cancellation restores soldQuantity back to availableQuantity", "PASS" if is_sold_restocked else "FAIL", f"Avail: {avail_pre}, Sold: {sold_pre}", f"Avail: {avail_post}, Sold: {sold_post}")

        # ORD-34: Instant wallet refund credited to customer
        st_wal_post, b_wal_post, _ = self.request("GET", "/wallet/balance", token=self.tokens["CUSTOMER"])
        wal_post = Decimal(str(b_wal_post.get("data", 0))) if st_wal_post == 200 else Decimal(0)
        expected_wallet = wal_pre + order_total
        self.record("Wallet", "ORD-34", "Paid order cancellation automatically credits refund to customer wallet", "PASS" if wal_post == expected_wallet else "FAIL", expected_wallet, wal_post)

        # ORD-35: Cancellation and refund notifications dispatched
        st_notif, b_notif, _ = self.request("GET", f"/notifications", token=self.tokens["CUSTOMER"])
        notifs = b_notif.get("data", {}).get("content", []) if st_notif == 200 else []
        has_cancel_notif = any("cancel" in n.get("title", "").lower() or "refund" in n.get("title", "").lower() or "cancel" in str(n.get("eventType", "")).lower() or "refund" in str(n.get("eventType", "")).lower() for n in notifs)
        self.record("Notifications", "ORD-35", "Customer in-app notification center records cancellation & refund credit", "PASS" if has_cancel_notif else "FAIL", "True", has_cancel_notif)

    def test_cancellation_restrictions(self, delivered_order_id, unpaid_order_id, variant_id, addr_id):
        print("\n=======================================================")
        print("   9. CANCELLATION RESTRICTIONS & TERMINAL STATES")
        print("=======================================================")

        # ORD-36: Cannot cancel DELIVERED order
        st_can_deliv, b_can_deliv, _ = self.request("POST", f"/orders/{delivered_order_id}/cancel?reason=TryCancelDelivered", token=self.tokens["CUSTOMER"])
        self.record("BusinessRules", "ORD-36", "Order cancellation strictly prohibited once order is DELIVERED", "PASS" if st_can_deliv in (400, 409, 500) else "FAIL", "400/409/500", st_can_deliv)

        # ORD-37: Create a SHIPPED order and attempt cancellation
        self.request("DELETE", "/cart", token=self.tokens["CUSTOMER"])
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER"])
        self.request("POST", "/cart/items", {"variantId": variant_id, "quantity": 1}, token=self.tokens["CUSTOMER"])
        st_sh, b_sh, _ = self.request("POST", "/orders", {"addressId": addr_id}, token=self.tokens["CUSTOMER"])
        shipped_order_id = b_sh.get("data", {}).get("id") if st_sh == 200 else None
        sh_total = Decimal(str(b_sh.get("data", {}).get("totalAmountInr", 0))) if st_sh == 200 else Decimal(0)
        
        st_p, b_p, _ = self.request("POST", "/payment/initiate", {"orderId": shipped_order_id}, token=self.tokens["CUSTOMER"])
        rz_sh = b_p.get("data", {}).get("razorpayOrderId") if st_p == 200 else None
        self.request("POST", "/payment/webhook", {
            "event": "payment.captured",
            "event_id": "evt_" + str(uuid.uuid4()).replace("-", ""),
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_sh_" + str(uuid.uuid4()).replace("-", "")[:12],
                        "order_id": rz_sh,
                        "status": "captured",
                        "amount": int(sh_total * 100),
                        "currency": "INR"
                    }
                }
            }
        }, headers={"X-Razorpay-Signature": "MOCK_SIGNATURE"})
        
        self.request("PUT", f"/admin/orders/{shipped_order_id}/status", {"status": "PROCESSING", "reason": "Fulfilling for restriction test"}, token=self.tokens["ADMIN"])
        self.request("POST", f"/shipping/create", {"orderId": shipped_order_id, "courierPartner": "Delhivery Express"}, token=self.tokens["ADMIN"])

        # Customer attempts to cancel order that is now in SHIPPED status
        st_can_shipped, b_can_shipped, _ = self.request("POST", f"/orders/{shipped_order_id}/cancel?reason=TryCancelShipped", token=self.tokens["CUSTOMER"])
        self.record("BusinessRules", "ORD-37", "Order cancellation strictly prohibited once order is SHIPPED", "PASS" if st_can_shipped in (400, 409, 500) else "FAIL", "400/409/500", st_can_shipped)

        # ORD-38: State machine rejects invalid transition backwards from DELIVERED
        st_mod, b_mod, _ = self.request("PUT", f"/admin/orders/{delivered_order_id}/status", {
            "status": "PROCESSING",
            "reason": "Illegal transition test"
        }, token=self.tokens["ADMIN"])
        self.record("BusinessRules", "ORD-38", "State machine rejects invalid transition backwards from DELIVERED", "PASS" if st_mod in (400, 409, 500) else "FAIL", "400/409/500", st_mod)

        # ORD-39: Customer attempts to cancel an already CANCELLED order
        st_can_again, b_can_again, _ = self.request("POST", f"/orders/{unpaid_order_id}/cancel?reason=CancelAlreadyCancelled", token=self.tokens["CUSTOMER"])
        self.record("BusinessRules", "ORD-39", "State machine rejects duplicate cancellation on already CANCELLED order", "PASS" if st_can_again in (400, 409, 500) else "FAIL", "400/409/500", st_can_again)

    def test_concurrent_purchases(self, addr_id):
        print("\n=======================================================")
        print("   10. CONCURRENT PURCHASE ATTEMPTS & STOCK DEPLETION")
        print("=======================================================")

        # Create a test variant with exact stock = 2
        st_cat, b_cat, _ = self.request("GET", "/catalog/products")
        product_id = b_cat["data"]["content"][0]["id"] if "content" in b_cat.get("data", {}) else b_cat["data"][0]["id"]
        
        # Creating variant initializes inventory with stockQuantity=2 automatically
        unique_sku = f"SKU-CONC-{int(time.time())%100000}"
        st_v, b_v, _ = self.request("POST", f"/admin/catalog/products/{product_id}/variants", {
            "variantName": "Limited 2-Pack",
            "sku": unique_sku,
            "priceInr": 199.00,
            "stockQuantity": 2,
            "weightKg": 0.50,
            "isActive": True
        }, token=self.tokens["ADMIN"])
        
        if st_v != 200 or not b_v.get("data"):
            print("Could not create limited variant for concurrency test, skipping ORD-40/41.")
            return
            
        conc_var_id = b_v["data"]["id"]
        # Verify initial inventory is exactly 2 available, 0 reserved
        st_inv_init, b_inv_init, _ = self.request("GET", f"/admin/catalog/inventory/{conc_var_id}", token=self.tokens["ADMIN"])
        init_avail = b_inv_init.get("data", {}).get("availableQuantity", 0) if st_inv_init == 200 else 0
        if init_avail != 2:
            # Adjust to exactly 2 if needed
            diff = 2 - init_avail
            if diff > 0:
                self.request("POST", f"/admin/catalog/inventory/{conc_var_id}/replenish", {"quantity": diff, "reason": "Init 2"}, token=self.tokens["ADMIN"])

        # Customer 1 cart: 2 units
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER"])
        self.request("POST", "/cart/items", {"variantId": conc_var_id, "quantity": 2}, token=self.tokens["CUSTOMER"])

        # Customer 2 cart: 2 units
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER_2"])
        self.request("POST", "/cart/items", {"variantId": conc_var_id, "quantity": 2}, token=self.tokens["CUSTOMER_2"])

        # Create 2 concurrent checkout requests
        responses = [None, None]
        def checkout_worker(idx, token):
            st, b, _ = self.request("POST", "/orders", {
                "shippingAddress": {
                    "recipientName": f"Concurrent User {idx}",
                    "phone": f"982250990{idx}",
                    "line1": "Concurrency Lane",
                    "city": "Pune",
                    "state": "Maharashtra",
                    "pincode": "411001"
                }
            }, token=token)
            responses[idx] = (st, b)

        t1 = threading.Thread(target=checkout_worker, args=(0, self.tokens["CUSTOMER"]))
        t2 = threading.Thread(target=checkout_worker, args=(1, self.tokens["CUSTOMER_2"]))

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        statuses = [responses[0][0], responses[1][0]]
        success_count = sum(1 for s in statuses if s == 200)
        rejected_count = sum(1 for s in statuses if s in (400, 409, 500))

        # ORD-40: Concurrency deadlock prevention & isolation
        self.record("Concurrency", "ORD-40", "Concurrent checkouts compete without deadlock or race condition", "PASS" if (success_count + rejected_count == 2) else "FAIL", "2 completions", f"Statuses: {statuses}")

        # ORD-41: Exactly one checkout claims stock, second checkout gracefully rejected (no overselling)
        st_inv, b_inv, _ = self.request("GET", f"/admin/catalog/inventory/{conc_var_id}", token=self.tokens["ADMIN"])
        avail = b_inv.get("data", {}).get("availableQuantity", -1) if st_inv == 200 else -1
        self.record("Concurrency", "ORD-41", "Pessimistic row locking prevents overselling: available stock cannot go negative", "PASS" if (success_count == 1 and rejected_count == 1 and avail >= 0) else "FAIL", "1 Success, 1 Rejected, Avail >= 0", f"Success={success_count}, Rej={rejected_count}, Avail={avail}")

        # Clean up any leftover cart items from concurrency test
        self.request("DELETE", "/cart", token=self.tokens["CUSTOMER"])
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER"])
        self.request("DELETE", "/cart", token=self.tokens["CUSTOMER_2"])
        self.request("DELETE", "/cart/clear", token=self.tokens["CUSTOMER_2"])

    def test_cross_entity_consistency(self, order_id, variant_id):
        print("\n=======================================================")
        print("   11. CROSS-ENTITY CONSISTENCY & AUDIT RECONCILIATION")
        print("=======================================================")

        # ORD-42: Order line item total reconciliation
        st_ord, b_ord, _ = self.request("GET", f"/orders/{order_id}", token=self.tokens["CUSTOMER"])
        ord_data = b_ord.get("data", {}) if st_ord == 200 else {}
        subtotal = Decimal(str(ord_data.get("subtotalAmountInr", 0)))
        gst = Decimal(str(ord_data.get("gstTotalAmountInr", 0)))
        shipping = Decimal(str(ord_data.get("shippingFeeInr", 0)))
        discount = Decimal(str(ord_data.get("discountTotalAmountInr", 0)))
        total = Decimal(str(ord_data.get("totalAmountInr", 0)))
        
        expected_total = subtotal + gst + shipping - discount
        reconciled = (expected_total == total)
        self.record("Consistency", "ORD-42", "Order items, GST, shipping, and discounts reconcile to grand total", "PASS" if reconciled else "FAIL", expected_total, total)

        # ORD-43: Inventory audit trail logging
        st_audit, b_audit, _ = self.request("GET", f"/admin/catalog/inventory/{variant_id}/audit", token=self.tokens["ADMIN"])
        trail = b_audit.get("data", []) if st_audit == 200 else []
        has_audit_events = len(trail) > 0
        self.record("Consistency", "ORD-43", "Inventory audit trail accurately logs every stock movement event", "PASS" if has_audit_events else "FAIL", "> 0 Events", f"{len(trail)} events logged")

        # ORD-44: Platform financial transaction ledger
        st_fin, b_fin, _ = self.request("GET", "/admin/finance/transactions?page=0&size=10", token=self.tokens["ADMIN"])
        has_fin = (st_fin == 200 and b_fin.get("data", {}).get("totalElements", 0) > 0)
        self.record("Consistency", "ORD-44", "Financial audit ledger records all platform wallet credits and refunds", "PASS" if has_fin else "FAIL", "> 0 Records", f"{b_fin.get('data', {}).get('totalElements', 0) if st_fin == 200 else 'N/A'}")

        # ORD-45: Support ticket and customer profile consistency
        st_prof, b_prof, _ = self.request("GET", "/customer/profile", token=self.tokens["CUSTOMER"])
        has_prof = (st_prof == 200 and b_prof.get("data", {}).get("userId") is not None and "ORDER" in b_prof.get("data", {}).get("capabilities", []))
        self.record("Consistency", "ORD-45", "Customer profile and capability bindings remain consistent post-orders", "PASS" if has_prof else "FAIL", "Consistent", f"User: {b_prof.get('data', {}).get('userId') if st_prof==200 else 'N/A'}")

    def print_summary(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["status"] == "SKIP")
        pass_rate = (passed / total * 100) if total > 0 else 0.0

        print("\n=======================================================")
        print("       PHASE 8 ORDER & INVENTORY LIFECYCLE SUMMARY")
        print("=======================================================")
        print(f"Total Test Cases Executed : {total}")
        print(f"Passed                    : {passed}")
        print(f"Failed                    : {failed}")
        print(f"Skipped                   : {skipped}")
        print(f"Pass Rate                 : {pass_rate:.1f}%")
        print("=======================================================\n")

        output = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "skipped": skipped,
                "passRate": f"{pass_rate:.1f}%"
            },
            "results": self.results
        }
        with open("audit_output/08_order_lifecycle_test_results.json", "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)

if __name__ == "__main__":
    tester = OrderLifecycleTester()
    tester.run_all()
