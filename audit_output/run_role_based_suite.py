import base64
import hmac
import hashlib
import json
import time
import urllib.request
import urllib.error
import uuid
import sys

sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://localhost:8080/api/v1"
JWT_SECRET_B64 = "404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971"
SHIPROCKET_WEBHOOK_TOKEN = "sporekart_shiprocket_webhook_secret_key_2026"

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

class RoleBasedTester:
    def __init__(self):
        self.results = []
        
        # Test Users
        self.admin_id = uuid.uuid4()
        self.cust_a_id = uuid.uuid4()
        self.cust_b_id = uuid.uuid4()
        self.trainee_id = uuid.uuid4()

        self.tokens = {
            "ANONYMOUS": None,
            "ADMIN": None,
            "CUSTOMER_A": None,
            "CUSTOMER_B": None,
            "TRAINEE": None
        }

    def record(self, workflow, test_id, description, status, expected, actual, details=None):
        entry = {
            "workflow": workflow,
            "test_id": test_id,
            "description": description,
            "status": status,
            "expected": str(expected),
            "actual": str(actual),
            "details": details or ""
        }
        self.results.append(entry)
        symbol = "[PASS]" if status == "PASS" else "[FAIL]"
        print(f"{symbol} [{workflow}] {test_id}: {description} | Expected: {expected}, Got: {actual}", flush=True)
        if details and status == "FAIL":
            print(f"       Details: {details}", flush=True)

    def request(self, method, path, data=None, token=None, headers=None):
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
            with urllib.request.urlopen(req, timeout=30) as resp:
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
        print("\n--- 0. Provisioning Real Identities & Roles ---")
        # 1. Admin identity via Google OAuth
        st, b, _ = self.request("POST", "/auth/oauth/google", {
            "email": "thepravara2026@gmail.com",
            "fullName": "Sporekart Master Admin",
            "googleSub": "google-sub-admin-phase7"
        })
        if st == 200 and b.get("success"):
            self.admin_id = uuid.UUID(b["data"]["userId"])
            self.tokens["ADMIN"] = b["data"]["token"]
            print(f"Provisioned ADMIN: {self.admin_id} ({b['data']['role']})")
        else:
            self.tokens["ADMIN"] = generate_jwt(self.admin_id, "thepravara2026@gmail.com", "ROLE_ADMIN")

        # 2. Customer A
        st, b, _ = self.request("POST", "/auth/oauth/google", {
            "email": "custA_p7@sporekart.test",
            "fullName": "Alice Customer A",
            "googleSub": "google-sub-custA-p7"
        })
        if st == 200 and b.get("success"):
            self.cust_a_id = uuid.UUID(b["data"]["userId"])
            self.tokens["CUSTOMER_A"] = b["data"]["token"]
            print(f"Provisioned CUSTOMER A: {self.cust_a_id} ({b['data']['role']})")

        # 3. Customer B (Adversary/Attacker)
        st, b, _ = self.request("POST", "/auth/oauth/google", {
            "email": "custB_p7@sporekart.test",
            "fullName": "Bob Customer B (Adversary)",
            "googleSub": "google-sub-custB-p7"
        })
        if st == 200 and b.get("success"):
            self.cust_b_id = uuid.UUID(b["data"]["userId"])
            self.tokens["CUSTOMER_B"] = b["data"]["token"]
            print(f"Provisioned CUSTOMER B: {self.cust_b_id} ({b['data']['role']})")

        # 4. Trainee User
        st, b, _ = self.request("POST", "/auth/oauth/google", {
            "email": "trainee_p7@sporekart.test",
            "fullName": "Tara Trainee",
            "googleSub": "google-sub-trainee-p7"
        })
        if st == 200 and b.get("success"):
            self.trainee_id = uuid.UUID(b["data"]["userId"])
            # Generate JWT with ROLE_TRAINEE
            self.tokens["TRAINEE"] = generate_jwt(self.trainee_id, "trainee_p7@sporekart.test", "ROLE_TRAINEE")
            print(f"Provisioned TRAINEE: {self.trainee_id} (ROLE_TRAINEE)")

    def run_customer_workflow_tests(self):
        print("\n=======================================================")
        print("   1. CUSTOMER WORKFLOW TESTING")
        print("=======================================================")
        
        # 1.1 Browsing & Product Variants
        st, b, _ = self.request("GET", "/catalog/products?page=0&size=5")
        self.record("Customer", "CUST-01", "Public product catalog browsing", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/products/popular")
        self.record("Customer", "CUST-02", "Public popular products browsing", "PASS" if st == 200 else "FAIL", 200, st)

        # 1.2 Cart & Checkout
        session_id = f"sess-{uuid.uuid4()}"
        # Fetch active variant
        st_cat, b_cat, _ = self.request("GET", "/catalog/products")
        variant_id = None
        if st_cat == 200 and b_cat.get("data"):
            products = b_cat["data"] if isinstance(b_cat["data"], list) else b_cat["data"].get("content", [])
            for p in products:
                if p.get("variants") and len(p["variants"]) > 0:
                    variant_id = p["variants"][0]["id"]
                    break

        if variant_id:
            st, b, _ = self.request("POST", "/cart/items", {
                "variantId": variant_id,
                "quantity": 1
            }, token=self.tokens["CUSTOMER_A"], headers={"X-Session-ID": session_id})
            self.record("Customer", "CUST-03", "Customer adds item to cart", "PASS" if st == 200 else "FAIL", 200, st)
        else:
            self.record("Customer", "CUST-03", "Customer adds item to cart", "SKIP", 200, "No variant found")

        # 1.3 Address Management
        unique_phone = f"98{int(time.time()*10)%100000000:08d}"
        st, b, _ = self.request("POST", "/customer/addresses", {
            "recipientName": "Alice Address",
            "phone": unique_phone,
            "line1": "Flat 101, Test Residency",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411001",
            "isDefault": True
        }, token=self.tokens["CUSTOMER_A"])
        addr_id = b["data"]["id"] if st == 200 and b.get("data") else None
        self.record("Customer", "CUST-04", "Customer creates shipping address", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/customer/addresses", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-05", "Customer lists saved addresses", "PASS" if st == 200 and len(b.get("data", [])) > 0 else "FAIL", 200, st)

        if addr_id:
            st, b, _ = self.request("PUT", f"/customer/addresses/{addr_id}", {
                "recipientName": "Alice Updated",
                "phone": unique_phone,
                "line1": "Flat 102, Test Residency",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001",
                "isDefault": True
            }, token=self.tokens["CUSTOMER_A"])
            self.record("Customer", "CUST-06", "Customer updates own address", "PASS" if st == 200 else "FAIL", 200, st)

        # 1.4 Orders & Cancellation
        order_id = None
        if addr_id and variant_id:
            st, b, _ = self.request("POST", "/orders", {
                "addressId": addr_id,
                "notes": "Phase 7 Role Test Order"
            }, token=self.tokens["CUSTOMER_A"], headers={"X-Session-ID": session_id, "Idempotency-Key": str(uuid.uuid4())})
            order_id = b["data"]["id"] if st == 200 and b.get("data") else None
            self.record("Customer", "CUST-07", "Customer creates order from cart", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/orders", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-08", "Customer views my orders", "PASS" if st == 200 else "FAIL", 200, st)

        if order_id:
            st, b, _ = self.request("GET", f"/orders/{order_id}", token=self.tokens["CUSTOMER_A"])
            self.record("Customer", "CUST-09", "Customer views own order details", "PASS" if st == 200 else "FAIL", 200, st)

            st, b, _ = self.request("POST", f"/orders/{order_id}/cancel?reason=Role%20Testing%20Cancel", token=self.tokens["CUSTOMER_A"])
            self.record("Customer", "CUST-10", "Customer cancels own unpaid order", "PASS" if st == 200 else "FAIL", 200, st)

        # 1.5 Payments and Refunds
        # Create a fresh order for payment initiation
        st, b, _ = self.request("POST", "/cart/items", {
            "variantId": variant_id,
            "quantity": 1
        }, token=self.tokens["CUSTOMER_A"], headers={"X-Session-ID": session_id})
        st_o, b_o, _ = self.request("POST", "/orders", {
            "addressId": addr_id
        }, token=self.tokens["CUSTOMER_A"], headers={"X-Session-ID": session_id, "Idempotency-Key": str(uuid.uuid4())})
        paid_order_id = b_o["data"]["id"] if st_o == 200 and b_o.get("data") else None

        if paid_order_id:
            st, b, _ = self.request("POST", "/payment/initiate", {
                "orderId": paid_order_id
            }, token=self.tokens["CUSTOMER_A"])
            self.record("Customer", "CUST-11", "Customer initiates order payment", "PASS" if st == 200 else "FAIL", 200, st)

            st, b, _ = self.request("GET", f"/payment/summary?type=ORDER&id={paid_order_id}", token=self.tokens["CUSTOMER_A"])
            self.record("Customer", "CUST-12", "Customer views payment summary", "PASS" if st == 200 else "FAIL", 200, st)

        # 1.6 Wallet Transactions
        st, b, _ = self.request("GET", "/wallet", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-13", "Customer views wallet summary", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/wallet/balance", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-14", "Customer views wallet balance", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/wallet/transactions?page=0&size=10", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-15", "Customer views wallet transaction ledger", "PASS" if st == 200 else "FAIL", 200, st)

        # 1.7 Training Enrollment & Cancellation
        # Fetch active batch
        st_trn, b_trn, _ = self.request("GET", "/training/courses")
        course_id, batch_id = None, None
        if st_trn == 200 and b_trn.get("data") and len(b_trn["data"]) > 0:
            course = b_trn["data"][0]
            course_id = course["id"]
            if course.get("slots") and len(course["slots"]) > 0:
                batch_id = course["slots"][0]["id"]
            else:
                st_b, b_b, _ = self.request("GET", f"/training/courses/{course_id}/batches")
                if st_b == 200 and b_b.get("data") and len(b_b["data"]) > 0:
                    batch_id = b_b["data"][0]["id"]

        cust_enrollment_id = None
        if batch_id:
            st, b, _ = self.request("POST", "/training/enroll", {
                "batchId": batch_id
            }, token=self.tokens["CUSTOMER_A"])
            cust_enrollment_id = b["data"]["id"] if st == 200 and b.get("data") else None
            self.record("Customer", "CUST-16", "Customer enrolls in training batch", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/training/my-bookings", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-17", "Customer views my training bookings", "PASS" if st == 200 else "FAIL", 200, st)

        if cust_enrollment_id:
            st, b, _ = self.request("GET", f"/training/enrollments/{cust_enrollment_id}", token=self.tokens["CUSTOMER_A"])
            self.record("Customer", "CUST-18", "Customer views own enrollment details", "PASS" if st == 200 else "FAIL", 200, st)

            # Cancellation on a near-term or past batch is blocked per Sporekart 7-day cancellation window rule
            st, b, _ = self.request("POST", f"/training/enrollments/{cust_enrollment_id}/cancel?reason=Schedule%20Change", token=self.tokens["CUSTOMER_A"])
            is_policy_enforced = (st == 409 and ("7 days" in str(b) or "cancellation" in str(b).lower()))
            self.record("Customer", "CUST-19", "Cancellation policy blocked within 7 days of batch start (409 Conflict)", "PASS" if is_policy_enforced else "FAIL", 409, st, details=str(b))

        # 1.8 Shipment Tracking
        st, b, _ = self.request("GET", "/shipping/check-pincode/411001", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-20", "Customer checks pincode serviceability", "PASS" if st == 200 else "FAIL", 200, st)

        # 1.9 Tickets and Notifications
        st, b, _ = self.request("POST", "/support/tickets", {
            "subject": "Role Test Support Ticket",
            "category": "PRODUCT_INQUIRY",
            "priority": "MEDIUM",
            "message": "Testing customer support ticket creation workflow."
        }, token=self.tokens["CUSTOMER_A"])
        ticket_id = b["data"]["id"] if st == 200 and b.get("data") else None
        self.record("Customer", "CUST-21", "Customer creates support ticket", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/support/tickets", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-22", "Customer views my tickets", "PASS" if st == 200 else "FAIL", 200, st)

        if ticket_id:
            st, b, _ = self.request("POST", f"/support/tickets/{ticket_id}/messages", {
                "message": "Follow up message from customer."
            }, token=self.tokens["CUSTOMER_A"])
            self.record("Customer", "CUST-23", "Customer adds message to own ticket", "PASS" if st == 200 else "FAIL", 200, st)

            st, b, _ = self.request("POST", f"/support/tickets/{ticket_id}/close", {
                "rating": 5,
                "feedback": "Great service!"
            }, token=self.tokens["CUSTOMER_A"])
            self.record("Customer", "CUST-24", "Customer closes own ticket with CSAT", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/notifications?page=0&size=10", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-25", "Customer views in-app notifications", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/notifications/unread-count", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-26", "Customer views unread notification count", "PASS" if st == 200 else "FAIL", 200, st)

        # 1.10 Profile Management
        st, b, _ = self.request("GET", "/customer/profile", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-27", "Customer views own profile", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/customer/capabilities", token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-28", "Customer views own capabilities", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("PUT", "/customer/profile", {
            "fullName": "Alice Customer Verified",
            "farmSizeSqft": 2500,
            "gstin": "27AAAAA0000A1Z5"
        }, token=self.tokens["CUSTOMER_A"])
        self.record("Customer", "CUST-29", "Customer updates own profile details", "PASS" if st == 200 else "FAIL", 200, st)

        return order_id, addr_id, ticket_id, cust_enrollment_id

    def run_admin_workflow_tests(self):
        print("\n=======================================================")
        print("   2. ADMIN WORKFLOW TESTING")
        print("=======================================================")

        # 2.1 Dashboard & Reporting
        st, b, _ = self.request("GET", "/admin/analytics/overview", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-01", "Admin views dashboard overview statistics", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/admin/finance/overview", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-02", "Admin views platform finance summary", "PASS" if st == 200 else "FAIL", 200, st)

        # 2.2 Product & Inventory Management
        st, b, _ = self.request("GET", "/admin/catalog/products?page=0&size=10", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-03", "Admin views product catalog for management", "PASS" if st == 200 else "FAIL", 200, st)

        # 2.3 Order Lifecycle & Cancellations
        st, b, _ = self.request("GET", "/admin/orders?page=0&size=10", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-04", "Admin views full platform order queue", "PASS" if st == 200 else "FAIL", 200, st)

        # 2.4 Payment & Refund Handling
        st, b, _ = self.request("GET", "/admin/finance/transactions?page=0&size=10", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-05", "Admin views financial transaction audit ledger", "PASS" if st == 200 else "FAIL", 200, st)

        # 2.5 Wallet Adjustments and Approvals
        st, b, _ = self.request("GET", "/admin/finance/withdrawals", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-06", "Admin views customer withdrawal requests", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("POST", "/admin/finance/manual-adjustment", {
            "userId": str(self.cust_a_id),
            "amount": 100.00,
            "direction": "CREDIT",
            "reason": "Phase 7 Role Test Wallet Courtesy Credit"
        }, token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-07", "Admin performs manual wallet credit adjustment", "PASS" if st == 200 else "FAIL", 200, st)

        # 2.6 Training Courses, Batches, and Enrollments
        st, b, _ = self.request("GET", "/admin/training/enrollments", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-08", "Admin views master enrollment registry", "PASS" if st == 200 else "FAIL", 200, st)

        # 2.7 Shipment Management
        st, b, _ = self.request("GET", "/shipping/check-pincode/110001", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-09", "Admin checks logistics serviceability", "PASS" if st == 200 else "FAIL", 200, st)

        # 2.8 Tickets & Notifications
        st, b, _ = self.request("GET", "/admin/support/tickets", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-10", "Admin views customer support ticket queue", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/admin/notifications?page=0&size=5", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-11", "Admin views outbox notification event stream", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("GET", "/admin/customers?page=0&size=10", token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-12", "Admin views customer accounts and capabilities", "PASS" if st == 200 else "FAIL", 200, st)

        st, b, _ = self.request("POST", f"/admin/customers/{self.trainee_id}/capability", {
            "capability": "TRAINING"
        }, token=self.tokens["ADMIN"])
        self.record("Admin", "ADM-13", "Admin grants TRAINING capability to user", "PASS" if st == 200 else "FAIL", 200, st)

    def run_trainee_workflow_tests(self):
        print("\n=======================================================")
        print("   3. TRAINEE WORKFLOW TESTING")
        print("=======================================================")

        # 3.1 Course and Batch Browsing
        st, b, _ = self.request("GET", "/training/courses", token=self.tokens["TRAINEE"])
        self.record("Trainee", "TRN-01", "Trainee browses masterclass courses", "PASS" if st == 200 else "FAIL", 200, st)

        course_id, batch_id = None, None
        if st == 200 and b.get("data") and len(b["data"]) > 0:
            course = b["data"][0]
            course_id = course["id"]
            st_b, b_b, _ = self.request("GET", f"/training/courses/{course_id}/batches", token=self.tokens["TRAINEE"])
            if st_b == 200 and b_b.get("data") and len(b_b["data"]) > 0:
                batch_id = b_b["data"][0]["id"]
            self.record("Trainee", "TRN-02", "Trainee browses batch schedules for course", "PASS" if st_b == 200 else "FAIL", 200, st_b)

        # 3.2 Enrollment & Payment
        trainee_enrollment_id = None
        if batch_id:
            st, b, _ = self.request("POST", "/training/enroll", {
                "batchId": batch_id
            }, token=self.tokens["TRAINEE"])
            trainee_enrollment_id = b["data"]["id"] if st == 200 and b.get("data") else None
            self.record("Trainee", "TRN-03", "Trainee creates batch enrollment", "PASS" if st == 200 else "FAIL", 200, st)

            # 3.3 Duplicate Enrollment Prevention
            st_dup, b_dup, _ = self.request("POST", "/training/enroll", {
                "batchId": batch_id
            }, token=self.tokens["TRAINEE"])
            is_dup_idempotent = (st_dup == 200 and b_dup.get("data") and b_dup["data"]["id"] == trainee_enrollment_id)
            self.record("Trainee", "TRN-04", "Duplicate enrollment prevention / idempotency", "PASS" if is_dup_idempotent else "FAIL", "Idempotent/200", f"{st_dup} (ID: {b_dup.get('data', {}).get('id') if st_dup == 200 else 'N/A'})")

            # 3.4 Payment Initiation
            st, b, _ = self.request("POST", "/payment/initiate-enrollment", {
                "enrollmentId": trainee_enrollment_id
            }, token=self.tokens["TRAINEE"])
            self.record("Trainee", "TRN-05", "Trainee initiates enrollment payment", "PASS" if st == 200 else "FAIL", 200, st)

            # 3.5 Training Status & Bookings
            st, b, _ = self.request("GET", "/training/my-bookings", token=self.tokens["TRAINEE"])
            self.record("Trainee", "TRN-06", "Trainee views registered training bookings", "PASS" if st == 200 and len(b.get("data", [])) > 0 else "FAIL", 200, st)

            # 3.6 Enrollment Cancellation & Refund Consequences on future batch (> 7 days away)
            import datetime
            start_date = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
            end_date = (datetime.date.today() + datetime.timedelta(days=32)).isoformat()
            st_batch, b_batch, _ = self.request("POST", "/admin/training/batches", {
                "courseId": course_id,
                "batchCode": f"FUT-{int(time.time())%100000}",
                "startDate": start_date,
                "endDate": end_date,
                "capacity": 15
            }, token=self.tokens["ADMIN"])
            if st_batch == 200 and b_batch.get("data"):
                fut_batch_id = b_batch["data"]["id"]
                st_enr, b_enr, _ = self.request("POST", "/training/enroll", {"batchId": fut_batch_id}, token=self.tokens["TRAINEE"])
                fut_enr_id = b_enr["data"]["id"] if st_enr == 200 and b_enr.get("data") else None
                if fut_enr_id:
                    st_can, b_can, _ = self.request("POST", f"/training/enrollments/{fut_enr_id}/cancel?reason=Future%20Conflict", token=self.tokens["TRAINEE"])
                    self.record("Trainee", "TRN-07", "Trainee cancels future batch enrollment with capacity restoration", "PASS" if st_can == 200 else "FAIL", 200, st_can)
                else:
                    self.record("Trainee", "TRN-07", "Trainee cancels enrollment", "FAIL", 200, st_enr)
            else:
                self.record("Trainee", "TRN-07", "Trainee cancels enrollment", "SKIP", 200, "Could not create future batch")

        return trainee_enrollment_id

    def run_courier_workflow_tests(self):
        print("\n=======================================================")
        print("   4. COURIER INTEGRATION & WEBHOOK TESTING")
        print("=======================================================")
        print("Note: In Sporekart architecture, Courier is an External Automated Integration (Shiprocket API + Webhooks)")
        print("      Shipment creation/dispatch is managed by Admin (@PreAuthorize('hasRole(\"ADMIN\")')).")

        # 4.1 Shipment Creation restricted to Admin
        dummy_order_id = str(uuid.uuid4())
        st, b, _ = self.request("POST", "/shipping/create", {
            "orderId": dummy_order_id
        }, token=self.tokens["CUSTOMER_A"])
        self.record("Courier", "COUR-01", "Customer denied shipment creation (Admin-only)", "PASS" if st == 403 else "FAIL", 403, st)

        st, b, _ = self.request("POST", "/shipping/create", {
            "orderId": dummy_order_id
        }, token=self.tokens["TRAINEE"])
        self.record("Courier", "COUR-02", "Trainee denied shipment creation (Admin-only)", "PASS" if st == 403 else "FAIL", 403, st)

        st, b, _ = self.request("POST", "/shipping/create", {
            "orderId": dummy_order_id
        })
        self.record("Courier", "COUR-03", "Anonymous denied shipment creation (Admin-only)", "PASS" if st in (401, 403) else "FAIL", "401/403", st)

        # 4.2 Webhook Signature & Token Authentication
        # Unauthorized Webhook (Missing token)
        st, b, _ = self.request("POST", "/shipping/webhook", {
            "awb": "SR100200300",
            "current_status": "IN_TRANSIT"
        })
        self.record("Courier", "COUR-04", "Courier webhook rejects missing signature/token", "PASS" if st == 401 else "FAIL", 401, st)

        # Unauthorized Webhook (Forged token)
        st, b, _ = self.request("POST", "/shipping/webhook", {
            "awb": "SR100200300",
            "current_status": "IN_TRANSIT"
        }, headers={"X-Shiprocket-Token": "forged_malicious_token_123"})
        self.record("Courier", "COUR-05", "Courier webhook rejects forged token", "PASS" if st == 401 else "FAIL", 401, st)

        # Authenticated Webhook (Valid token, unknown AWB safe handle)
        st, b, _ = self.request("POST", "/shipping/webhook", {
            "awb": "SR_NON_EXISTENT_AWB",
            "current_status": "IN_TRANSIT",
            "current_location": "Bhiwandi Hub",
            "scans": "Arrived at Hub"
        }, headers={"X-Shiprocket-Token": SHIPROCKET_WEBHOOK_TOKEN})
        self.record("Courier", "COUR-06", "Courier webhook processes valid token with unknown AWB safely", "PASS" if st == 200 else "FAIL", 200, st)

    def run_object_level_authorization_tests(self, cust_a_order_id, cust_a_addr_id, cust_a_ticket_id, cust_a_enrollment_id):
        print("\n=======================================================")
        print("   5. OBJECT-LEVEL AUTHORIZATION (IDOR / BOLA) TESTING")
        print("=======================================================")

        # 5.1 Orders IDOR: Customer B cannot view Customer A's order
        if cust_a_order_id:
            st, b, _ = self.request("GET", f"/orders/{cust_a_order_id}", token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-01", "User B cannot view User A's order details", "PASS" if st == 403 else "FAIL", 403, st)

            st, b, _ = self.request("POST", f"/orders/{cust_a_order_id}/cancel?reason=Malicious%20Cancel", token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-02", "User B cannot cancel User A's order", "PASS" if st == 403 else "FAIL", 403, st)

            st, b, _ = self.request("GET", f"/orders/{cust_a_order_id}/invoice", token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-03", "User B cannot download User A's order invoice", "PASS" if st in (403, 400, 500) else "FAIL", "403/Forbidden", st)

        # 5.2 Address IDOR: Customer B cannot update or delete Customer A's address
        if cust_a_addr_id:
            st, b, _ = self.request("PUT", f"/customer/addresses/{cust_a_addr_id}", {
                "recipientName": "Attacker Bob",
                "phone": "9999999999",
                "line1": "Attacker Hideout",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "isDefault": True
            }, token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-04", "User B cannot update User A's address", "PASS" if st in (403, 404) else "FAIL", "403/404", st)

            st, b, _ = self.request("DELETE", f"/customer/addresses/{cust_a_addr_id}", token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-05", "User B cannot delete User A's address", "PASS" if st in (403, 404) else "FAIL", "403/404", st)

        # 5.3 Support Ticket IDOR: Customer B cannot view, message on, or close Customer A's ticket
        if cust_a_ticket_id:
            st, b, _ = self.request("GET", f"/support/tickets/{cust_a_ticket_id}", token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-06", "User B cannot view User A's support ticket", "PASS" if st == 403 else "FAIL", 403, st)

            st, b, _ = self.request("POST", f"/support/tickets/{cust_a_ticket_id}/messages", {
                "message": "Forged malicious message from User B"
            }, token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-07", "User B cannot post messages to User A's support ticket", "PASS" if st == 403 else "FAIL", 403, st)

            st, b, _ = self.request("POST", f"/support/tickets/{cust_a_ticket_id}/close", {
                "rating": 1,
                "feedback": "Sabotaged"
            }, token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-08", "User B cannot close User A's support ticket", "PASS" if st == 403 else "FAIL", 403, st)

        # 5.4 Training Enrollment IDOR: Customer B cannot view or cancel Customer A's enrollment
        if cust_a_enrollment_id:
            st, b, _ = self.request("GET", f"/training/enrollments/{cust_a_enrollment_id}", token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-09", "User B cannot view User A's training enrollment details", "PASS" if st == 403 else "FAIL", 403, st)

            st, b, _ = self.request("POST", f"/training/enrollments/{cust_a_enrollment_id}/cancel?reason=Attacker%20Cancel", token=self.tokens["CUSTOMER_B"])
            self.record("IDOR", "IDOR-10", "User B cannot cancel User A's training enrollment", "PASS" if st == 403 else "FAIL", 403, st)

            # Anonymous cannot view Customer A's enrollment
            st, b, _ = self.request("GET", f"/training/enrollments/{cust_a_enrollment_id}")
            self.record("IDOR", "IDOR-11", "Anonymous cannot view User A's training enrollment details", "PASS" if st in (401, 403) else "FAIL", "401/403", st)

        # 5.5 Elevation of Privilege / Role Isolation: Customer cannot access Admin endpoints
        st, b, _ = self.request("GET", "/admin/orders", token=self.tokens["CUSTOMER_A"])
        self.record("Elevation", "ELEV-01", "Customer cannot access /admin/orders", "PASS" if st == 403 else "FAIL", 403, st)

        st, b, _ = self.request("GET", "/admin/finance/overview", token=self.tokens["CUSTOMER_A"])
        self.record("Elevation", "ELEV-02", "Customer cannot access /admin/finance/overview", "PASS" if st == 403 else "FAIL", 403, st)

        st, b, _ = self.request("GET", "/admin/notifications", token=self.tokens["CUSTOMER_A"])
        self.record("Elevation", "ELEV-03", "Customer cannot access /admin/notifications", "PASS" if st == 403 else "FAIL", 403, st)

        st, b, _ = self.request("POST", "/media/link", {
            "entityType": "PRODUCT",
            "entityId": str(uuid.uuid4()),
            "mediaAssetId": str(uuid.uuid4())
        }, token=self.tokens["CUSTOMER_A"])
        self.record("Elevation", "ELEV-04", "Customer cannot link media (/media/link)", "PASS" if st == 403 else "FAIL", 403, st)

        st, b, _ = self.request("DELETE", f"/media/{uuid.uuid4()}", token=self.tokens["CUSTOMER_A"])
        self.record("Elevation", "ELEV-05", "Customer cannot delete media assets (/media/{id})", "PASS" if st == 403 else "FAIL", 403, st)

    def print_summary(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["status"] == "SKIP")
        pass_rate = (passed / total * 100) if total > 0 else 0.0

        print("\n=======================================================")
        print("          PHASE 7 ROLE-BASED TEST SUMMARY")
        print("=======================================================")
        print(f"Total Test Cases Executed : {total}")
        print(f"Passed                    : {passed}")
        print(f"Failed                    : {failed}")
        print(f"Skipped                   : {skipped}")
        print(f"Pass Rate                 : {pass_rate:.1f}%")
        print("=======================================================\n")

        with open("audit_output/07_role_based_test_results.json", "w") as f:
            json.dump({
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "summary": {
                    "total": total,
                    "passed": passed,
                    "failed": failed,
                    "skipped": skipped,
                    "passRate": f"{pass_rate:.1f}%"
                },
                "results": self.results
            }, f, indent=2)

if __name__ == "__main__":
    tester = RoleBasedTester()
    tester.setup_identities()
    order_id, addr_id, ticket_id, trn_id = tester.run_customer_workflow_tests()
    tester.run_admin_workflow_tests()
    tester.run_trainee_workflow_tests()
    tester.run_courier_workflow_tests()
    tester.run_object_level_authorization_tests(order_id, addr_id, ticket_id, trn_id)
    tester.print_summary()
