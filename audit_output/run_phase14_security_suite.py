import base64
import hmac
import hashlib
import json
import time
import urllib.request
import urllib.error
import urllib.parse
import uuid
import sys
import os

sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://localhost:8080/api/v1"
JWT_SECRET_B64 = "404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971"
SHIPROCKET_WEBHOOK_TOKEN = "sporekart_shiprocket_webhook_secret_key_2026"

def b64url(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def generate_jwt(user_id, email, role, exp_delta=86400, alg='HS256', tampered=False):
    header = b64url(json.dumps({'alg': alg, 'typ': 'JWT'}))
    payload = b64url(json.dumps({
        'sub': str(user_id),
        'identifier': email,
        'role': role,
        'iat': int(time.time()),
        'exp': int(time.time()) + exp_delta
    }))
    if alg == 'none':
        return f"{header}.{payload}."
    
    secret = base64.b64decode(JWT_SECRET_B64)
    sig = b64url(hmac.new(secret, f"{header}.{payload}".encode('utf-8'), hashlib.sha256).digest())
    if tampered:
        sig = sig[:-4] + "XXXX"
    return f"{header}.{payload}.{sig}"

class SecurityTester:
    def __init__(self):
        self.results = []
        # Real seeded users from DB
        self.user_a_id = uuid.UUID("68c1c221-6a02-4b2f-b72e-43196874870a")
        self.user_b_id = uuid.UUID("85b4d0b5-dcc6-4660-9c01-981bfd6e4c31")
        self.admin_id = uuid.UUID("529a5ab9-9def-405b-965b-21bdfa98cf7e")

        self.token_a = generate_jwt(self.user_a_id, "addr_cust_1791859033460_7210@sporekart-qa.test", "ROLE_CUSTOMER")
        self.token_b = generate_jwt(self.user_b_id, "hacker_cust_1791859036682_6905@sporekart-qa.test", "ROLE_CUSTOMER")
        self.token_admin = generate_jwt(self.admin_id, "admin@sporekart.in", "ROLE_ADMIN")
        
        # Attack / Malformed Tokens
        self.token_expired = generate_jwt(self.user_a_id, "addr_cust_1791859033460_7210@sporekart-qa.test", "ROLE_CUSTOMER", exp_delta=-3600)
        self.token_tampered = generate_jwt(self.user_a_id, "addr_cust_1791859033460_7210@sporekart-qa.test", "ROLE_CUSTOMER", tampered=True)
        self.token_none_alg = generate_jwt(self.user_a_id, "addr_cust_1791859033460_7210@sporekart-qa.test", "ROLE_CUSTOMER", alg='none')

        # Test Fixtures Created during execution
        self.order_a_id = None
        self.address_a_id = None
        self.ticket_a_id = None
        self.enrollment_a_id = None
        self.variant_id = None
        self.batch_id = None

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
        symbol = "[PASS]" if status == "PASS" else ("[FAIL]" if status == "FAIL" else "[NOTE]")
        print(f"{symbol} [{category}] {test_id}: {description} | Expected: {expected}, Got: {actual}", flush=True)
        if details and status == "FAIL":
            print(f"       Details: {details}", flush=True)

    def request(self, method, path, data=None, token=None, headers=None, raw_body=None):
        url = BASE_URL + path if path.startswith('/') else f"{BASE_URL}/{path}"
        req_headers = {}
        if data is not None or raw_body is not None:
            req_headers["Content-Type"] = "application/json"
        if token:
            req_headers["Authorization"] = f"Bearer {token}"
        if headers:
            req_headers.update(headers)

        body_bytes = None
        if raw_body is not None:
            body_bytes = raw_body.encode('utf-8') if isinstance(raw_body, str) else raw_body
        elif data is not None:
            body_bytes = json.dumps(data).encode('utf-8')

        req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                res_body = resp.read().decode('utf-8')
                resp_headers = dict(resp.info())
                try:
                    res_json = json.loads(res_body)
                except Exception:
                    res_json = res_body
                return resp.status, res_json, resp_headers
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            resp_headers = dict(e.headers)
            try:
                err_json = json.loads(err_body)
            except Exception:
                err_json = err_body
            return e.code, err_json, resp_headers
        except Exception as e:
            return 500, str(e), {}

    def setup_fixtures(self):
        print("\n--- [SETUP] Creating Test Fixtures for Security Testing ---", flush=True)
        # 1. Get a product variant
        status, data, _ = self.request("GET", "/products?page=0&size=5")
        if status == 200 and isinstance(data, dict) and "data" in data:
            d = data["data"]
            items = d if isinstance(d, list) else d.get("content", [])
            for p in items:
                vars = p.get("variants", [])
                if vars:
                    self.variant_id = vars[0]["id"]
                    print(f"  Setup: Using Variant ID = {self.variant_id}", flush=True)
                    break

        # 2. Get a training batch under public courses
        status, data, _ = self.request("GET", "/training/courses")
        if status == 200 and isinstance(data, dict) and "data" in data:
            courses = data["data"]
            if courses:
                cid = courses[0]["id"]
                st_b, data_b, _ = self.request("GET", f"/training/courses/{cid}/batches")
                if st_b == 200 and isinstance(data_b, dict) and "data" in data_b:
                    batches = data_b["data"]
                    if batches:
                        self.batch_id = batches[0]["id"]
                        print(f"  Setup: Using Batch ID = {self.batch_id}", flush=True)

        # 3. Create Address for Customer A with unique phone
        unique_phone = "98" + str(int(time.time()))[:8]
        addr_payload = {
            "recipientName": "Sec Customer A",
            "phone": unique_phone,
            "line1": "100 Security Lane",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "isDefault": True
        }
        status, data, _ = self.request("POST", "/customer/addresses", data=addr_payload, token=self.token_a)
        if status in [200, 201] and isinstance(data, dict):
            self.address_a_id = data.get("data", {}).get("id")
            print(f"  Setup: Created Address A ID = {self.address_a_id}", flush=True)
        else:
            print(f"  Setup: Address creation status = {status}, resp = {data}", flush=True)

        # 4. Create Order for Customer A (Cart -> Order)
        if self.variant_id and self.address_a_id:
            # Add to cart
            self.request("POST", "/cart/items", data={"variantId": self.variant_id, "quantity": 1}, token=self.token_a)
            order_payload = {
                "addressId": self.address_a_id,
                "notes": "Security IDOR test order"
            }
            status, data, _ = self.request("POST", "/orders", data=order_payload, token=self.token_a)
            if status in [200, 201] and isinstance(data, dict):
                self.order_a_id = data.get("data", {}).get("id")
                print(f"  Setup: Created Order A ID = {self.order_a_id}", flush=True)
            else:
                print(f"  Setup: Order creation status = {status}, resp = {data}", flush=True)

        # 5. Create Support Ticket for Customer A
        ticket_payload = {
            "subject": "Confidential Security Inquiry A",
            "category": "ORDER_ISSUE",
            "priority": "HIGH",
            "message": "Sensitive customer communication that Customer B must not read."
        }
        status, data, _ = self.request("POST", "/support/tickets", data=ticket_payload, token=self.token_a)
        if status in [200, 201] and isinstance(data, dict):
            self.ticket_a_id = data.get("data", {}).get("id")
            print(f"  Setup: Created Support Ticket A ID = {self.ticket_a_id}", flush=True)
        else:
            print(f"  Setup: Ticket creation status = {status}, resp = {data}", flush=True)

        # 6. Create Training Enrollment for Customer A
        if self.batch_id:
            enroll_payload = {
                "batchId": self.batch_id,
                "fullName": "Sec Customer A",
                "email": "addr_cust_1791859033460_7210@sporekart-qa.test",
                "phone": unique_phone
            }
            status, data, _ = self.request("POST", "/training/enroll", data=enroll_payload, token=self.token_a)
            if status in [200, 201] and isinstance(data, dict):
                self.enrollment_a_id = data.get("data", {}).get("id")
                print(f"  Setup: Created Enrollment A ID = {self.enrollment_a_id}", flush=True)
            else:
                print(f"  Setup: Enrollment creation status = {status}, resp = {data}", flush=True)

    # ==========================================
    # 1. AUTHENTICATION CONTROLS
    # ==========================================
    def test_authentication(self):
        print("\n=== Category 1: Authentication & Token Integrity ===", flush=True)

        # 1.1 Protected endpoint without token -> 401
        status, data, _ = self.request("GET", "/customer/profile")
        passed = (status == 401)
        self.record("AUTHENTICATION", "AUTH-01", "Access protected profile without Authorization header", "PASS" if passed else "FAIL", 401, status)

        # 1.2 Invalid Bearer format -> 401
        status, data, _ = self.request("GET", "/customer/profile", headers={"Authorization": "InvalidBearerFormatXYZ"})
        passed = (status == 401)
        self.record("AUTHENTICATION", "AUTH-02", "Access with malformed Authorization header", "PASS" if passed else "FAIL", 401, status)

        # 1.3 Expired JWT -> 401
        status, data, _ = self.request("GET", "/customer/profile", token=self.token_expired)
        passed = (status == 401)
        self.record("AUTHENTICATION", "AUTH-03", "Access with expired JWT token", "PASS" if passed else "FAIL", 401, status)

        # 1.4 Tampered Signature -> 401
        status, data, _ = self.request("GET", "/customer/profile", token=self.token_tampered)
        passed = (status == 401)
        self.record("AUTHENTICATION", "AUTH-04", "Access with cryptographically tampered JWT signature", "PASS" if passed else "FAIL", 401, status)

        # 1.5 'none' Algorithm Token Attack -> 401
        status, data, _ = self.request("GET", "/customer/profile", token=self.token_none_alg)
        passed = (status == 401)
        self.record("AUTHENTICATION", "AUTH-05", "Access with 'none' algorithm bypass JWT attempt", "PASS" if passed else "FAIL", 401, status)

        # 1.6 Valid Token -> 200
        status, data, _ = self.request("GET", "/customer/profile", token=self.token_a)
        passed = (status == 200)
        self.record("AUTHENTICATION", "AUTH-06", "Access protected profile with valid signed JWT", "PASS" if passed else "FAIL", 200, status)

    # ==========================================
    # 2. AUTHORIZATION & RBAC CONTROLS
    # ==========================================
    def test_authorization_rbac(self):
        print("\n=== Category 2: Role-Based Access Control (RBAC) ===", flush=True)

        admin_endpoints = [
            ("GET", "/admin/orders", "Admin Orders Listing"),
            ("GET", "/admin/customers", "Admin Customers Directory"),
            ("GET", "/admin/promotions", "Admin Promotions Engine"),
            ("GET", "/admin/analytics/overview", "Admin Analytics Overview"),
            ("GET", "/admin/finance/overview", "Admin Finance Overview"),
            ("GET", "/admin/training/enrollments", "Admin Training Enrollments"),
            ("GET", "/admin/reviews", "Admin Product Reviews Management")
        ]

        for method, endpoint, name in admin_endpoints:
            # Anonymous attempt -> 401
            status, _, _ = self.request(method, endpoint)
            passed = (status in [401, 403])
            self.record("AUTHORIZATION", f"RBAC-ANON-{endpoint.replace('/', '-')}", f"Anonymous access to {name}", "PASS" if passed else "FAIL", "401/403", status)

            # Customer attempt -> 403 Forbidden
            status, _, _ = self.request(method, endpoint, token=self.token_a)
            passed = (status == 403)
            self.record("AUTHORIZATION", f"RBAC-CUST-{endpoint.replace('/', '-')}", f"Customer (ROLE_CUSTOMER) access to {name}", "PASS" if passed else "FAIL", 403, status)

            # Admin attempt -> 200 OK
            status, _, _ = self.request(method, endpoint, token=self.token_admin)
            passed = (status == 200)
            self.record("AUTHORIZATION", f"RBAC-ADMIN-{endpoint.replace('/', '-')}", f"Administrator (ROLE_ADMIN) access to {name}", "PASS" if passed else "FAIL", 200, status)

    # ==========================================
    # 3. OBJECT-LEVEL ACCESS CONTROL (IDOR / BOLA)
    # ==========================================
    def test_object_level_access_control(self):
        print("\n=== Category 3: Object-Level Access Control (IDOR / BOLA) ===", flush=True)

        # 3.1 Order Read Isolation: Customer B reading Customer A's order -> 403 Forbidden
        if self.order_a_id:
            status, _, _ = self.request("GET", f"/orders/{self.order_a_id}", token=self.token_b)
            passed = (status == 403)
            self.record("IDOR_BOLA", "IDOR-ORDER-01", "Customer B attempting to read Customer A's Order", "PASS" if passed else "FAIL", 403, status)
        else:
            self.record("IDOR_BOLA", "IDOR-ORDER-01", "Customer B attempting to read Customer A's Order", "SKIPPED", 403, "No order fixture")

        # 3.2 Order Cancellation Isolation: Customer B cancelling Customer A's order -> 403 Forbidden
        if self.order_a_id:
            status, _, _ = self.request("POST", f"/orders/{self.order_a_id}/cancel", data={"reason": "Malicious cancellation attempt"}, token=self.token_b)
            passed = (status == 403)
            self.record("IDOR_BOLA", "IDOR-ORDER-02", "Customer B attempting to cancel Customer A's Order", "PASS" if passed else "FAIL", 403, status)
        else:
            self.record("IDOR_BOLA", "IDOR-ORDER-02", "Customer B attempting to cancel Customer A's Order", "SKIPPED", 403, "No order fixture")

        # 3.3 Order Invoice Isolation: Customer B downloading invoice for Customer A's order -> 403 Forbidden
        if self.order_a_id:
            status, _, _ = self.request("GET", f"/orders/{self.order_a_id}/invoice", token=self.token_b)
            passed = (status == 403)
            self.record("IDOR_BOLA", "IDOR-ORDER-03", "Customer B downloading Customer A's Order Invoice", "PASS" if passed else "FAIL", 403, status)
        else:
            self.record("IDOR_BOLA", "IDOR-ORDER-03", "Customer B downloading Customer A's Order Invoice", "SKIPPED", 403, "No order fixture")

        # 3.4 Address Isolation: Customer B updating Customer A's address -> 404 (scoped to user)
        if self.address_a_id:
            status, _, _ = self.request("PUT", f"/customer/addresses/{self.address_a_id}", data={"line1": "Hacked address", "recipientName": "Hacker", "phone": "9899887766", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}, token=self.token_b)
            passed = (status in [403, 404])
            self.record("IDOR_BOLA", "IDOR-ADDR-01", "Customer B updating Customer A's Saved Address", "PASS" if passed else "FAIL", "403/404", status)
        else:
            self.record("IDOR_BOLA", "IDOR-ADDR-01", "Customer B updating Customer A's Saved Address", "SKIPPED", "403/404", "No address fixture")

        # 3.5 Address Deletion Isolation: Customer B deleting Customer A's address -> 404 (scoped to user)
        if self.address_a_id:
            status, _, _ = self.request("DELETE", f"/customer/addresses/{self.address_a_id}", token=self.token_b)
            passed = (status in [403, 404])
            self.record("IDOR_BOLA", "IDOR-ADDR-02", "Customer B deleting Customer A's Saved Address", "PASS" if passed else "FAIL", "403/404", status)
        else:
            self.record("IDOR_BOLA", "IDOR-ADDR-02", "Customer B deleting Customer A's Saved Address", "SKIPPED", "403/404", "No address fixture")

        # 3.6 Address Hijacking in Checkout: Customer B placing order referencing Customer A's addressId -> 403 Forbidden
        if self.address_a_id and self.variant_id:
            # Customer B puts item in cart
            self.request("POST", "/cart/items", data={"variantId": self.variant_id, "quantity": 1}, token=self.token_b)
            hijack_order_payload = {
                "addressId": self.address_a_id,
                "notes": "Malicious address hijacking attempt"
            }
            status, _, _ = self.request("POST", "/orders", data=hijack_order_payload, token=self.token_b)
            passed = (status in [400, 403, 404])
            self.record("IDOR_BOLA", "IDOR-ADDR-03", "Customer B referencing Customer A's Address during checkout", "PASS" if passed else "FAIL", "400/403/404", status)
        else:
            self.record("IDOR_BOLA", "IDOR-ADDR-03", "Customer B referencing Customer A's Address during checkout", "SKIPPED", "400/403/404", "No fixture")

        # 3.7 Wallet Isolation: Wallet endpoint strictly resolves caller's principal
        status_a, data_a, _ = self.request("GET", "/wallet", token=self.token_a)
        status_b, data_b, _ = self.request("GET", "/wallet", token=self.token_b)
        wallet_isolated = False
        if status_a == 200 and status_b == 200:
            wallet_a_user = data_a.get("data", {}).get("userId")
            wallet_b_user = data_b.get("data", {}).get("userId")
            wallet_isolated = (str(wallet_a_user) != str(wallet_b_user) and str(wallet_b_user) == str(self.user_b_id))
        self.record("IDOR_BOLA", "IDOR-WALLET-01", "Wallet state isolated per authenticated user principal", "PASS" if wallet_isolated else "FAIL", "Strict isolation", f"A: {status_a}, B: {status_b}")

        # 3.8 Support Ticket Read Isolation: Customer B reading Customer A's ticket -> 403 Forbidden
        if self.ticket_a_id:
            status, _, _ = self.request("GET", f"/support/tickets/{self.ticket_a_id}", token=self.token_b)
            passed = (status == 403)
            self.record("IDOR_BOLA", "IDOR-TICKET-01", "Customer B attempting to view Customer A's Support Ticket", "PASS" if passed else "FAIL", 403, status)
        else:
            self.record("IDOR_BOLA", "IDOR-TICKET-01", "Customer B attempting to view Customer A's Support Ticket", "SKIPPED", 403, "No ticket fixture")

        # 3.9 Support Ticket Message Tampering: Customer B posting message to Customer A's ticket -> 403 Forbidden
        if self.ticket_a_id:
            msg_payload = {"message": "Malicious reply from unauthorized user B"}
            status, _, _ = self.request("POST", f"/support/tickets/{self.ticket_a_id}/messages", data=msg_payload, token=self.token_b)
            passed = (status == 403)
            self.record("IDOR_BOLA", "IDOR-TICKET-02", "Customer B posting message to Customer A's Support Ticket", "PASS" if passed else "FAIL", 403, status)
        else:
            self.record("IDOR_BOLA", "IDOR-TICKET-02", "Customer B posting message to Customer A's Support Ticket", "SKIPPED", 403, "No ticket fixture")

        # 3.10 Training Enrollment Read Isolation: Customer B viewing Customer A's enrollment -> 403 Forbidden
        if self.enrollment_a_id:
            status, _, _ = self.request("GET", f"/training/enrollments/{self.enrollment_a_id}", token=self.token_b)
            passed = (status == 403)
            self.record("IDOR_BOLA", "IDOR-ENROLL-01", "Customer B viewing Customer A's Training Enrollment", "PASS" if passed else "FAIL", 403, status)
        else:
            self.record("IDOR_BOLA", "IDOR-ENROLL-01", "Customer B viewing Customer A's Training Enrollment", "SKIPPED", 403, "No enrollment fixture")

        # 3.11 Training Enrollment Cancel Isolation: Customer B cancelling Customer A's enrollment -> 403 Forbidden
        if self.enrollment_a_id:
            status, _, _ = self.request("POST", f"/training/enrollments/{self.enrollment_a_id}/cancel", token=self.token_b)
            passed = (status == 403)
            self.record("IDOR_BOLA", "IDOR-ENROLL-02", "Customer B cancelling Customer A's Training Enrollment", "PASS" if passed else "FAIL", 403, status)
        else:
            self.record("IDOR_BOLA", "IDOR-ENROLL-02", "Customer B cancelling Customer A's Training Enrollment", "SKIPPED", 403, "No enrollment fixture")

    # ==========================================
    # 4. INPUT VALIDATION & SQL INJECTION RESILIENCE
    # ==========================================
    def test_input_validation_and_sqli(self):
        print("\n=== Category 4: Input Validation & SQL Injection Resilience ===", flush=True)

        # 4.1 SQL Injection probe in Product Search
        sqli_query = "oyster' OR 1=1 -- "
        status, data, _ = self.request("GET", f"/products?query={urllib.parse.quote(sqli_query)}")
        passed = (status == 200 and not (isinstance(data, str) and ("syntax error" in data.lower() or "exception" in data.lower())))
        self.record("SQLI_INPUT", "SQLI-01", "Product search query parameter with SQL meta-characters", "PASS" if passed else "FAIL", 200, status)

        # 4.2 SQL Injection probe in Category filter
        sqli_cat = "mushrooms' UNION SELECT null, null, null --"
        status, data, _ = self.request("GET", f"/products?category={urllib.parse.quote(sqli_cat)}")
        passed = (status in [200, 400] and not (isinstance(data, str) and "syntax error" in data.lower()))
        self.record("SQLI_INPUT", "SQLI-02", "Category query parameter with SQL UNION injection probe", "PASS" if passed else "FAIL", "200/400", status)

        # 4.3 Malformed UUID in Path Variable
        status, _, _ = self.request("GET", "/products/not-a-valid-uuid")
        passed = (status in [400, 404])
        self.record("SQLI_INPUT", "VALID-01", "Malformed UUID in path parameter (/products/not-a-valid-uuid)", "PASS" if passed else "FAIL", "400/404", status)

        # 4.4 Negative Quantity in Cart Item Add
        if self.variant_id:
            cart_payload = {"variantId": self.variant_id, "quantity": -5}
            status, _, _ = self.request("POST", "/cart/items", data=cart_payload, token=self.token_a)
            passed = (status == 400)
            self.record("SQLI_INPUT", "VALID-02", "Negative quantity validation in cart addition", "PASS" if passed else "FAIL", 400, status)

        # 4.5 Invalid Phone Number in Address Creation
        bad_phone_payload = {
            "recipientName": "Sec Tester",
            "phone": "12345", # invalid phone
            "line1": "Street 1",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "isDefault": False
        }
        status, _, _ = self.request("POST", "/customer/addresses", data=bad_phone_payload, token=self.token_a)
        passed = (status == 400)
        self.record("SQLI_INPUT", "VALID-03", "Invalid phone number validation in address creation", "PASS" if passed else "FAIL", 400, status)

        # 4.6 Invalid PIN Code in Address Creation
        bad_pin_payload = {
            "recipientName": "Sec Tester",
            "phone": "9876543210",
            "line1": "Street 1",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "ABC1234", # invalid pin
            "isDefault": False
        }
        status, _, _ = self.request("POST", "/customer/addresses", data=bad_pin_payload, token=self.token_a)
        passed = (status == 400)
        self.record("SQLI_INPUT", "VALID-04", "Invalid postal code validation in address creation", "PASS" if passed else "FAIL", 400, status)

    # ==========================================
    # 5. CROSS-SITE SCRIPTING (XSS)
    # ==========================================
    def test_xss_resilience(self):
        print("\n=== Category 5: Cross-Site Scripting (XSS) Stored & Reflected ===", flush=True)

        # 5.1 Stored XSS payload in Support Ticket Subject & Message
        xss_payload = {
            "subject": "XSS Test <script>alert('XSS-SUBJECT')</script>",
            "category": "GENERAL_SUPPORT",
            "priority": "LOW",
            "message": "Message containing <img src=x onerror=alert('XSS-BODY')> payload"
        }
        status, data, resp_headers = self.request("POST", "/support/tickets", data=xss_payload, token=self.token_a)
        content_type = resp_headers.get("Content-Type", "") or resp_headers.get("content-type", "")
        # The API must always respond with application/json, never text/html, ensuring raw script execution cannot occur via API
        is_json = "application/json" in content_type
        self.record("XSS_DOM", "XSS-01", "Stored XSS payload handling & JSON Content-Type enforcement", "PASS" if is_json else "FAIL", "application/json", content_type)

    # ==========================================
    # 6. WEBHOOK SECURITY
    # ==========================================
    def test_webhook_security(self):
        print("\n=== Category 6: Webhook Security & Signature Verification ===", flush=True)

        # 6.1 Shiprocket Webhook: Missing Token -> 401
        status, _, _ = self.request("POST", "/shipping/webhook", data={"awb": "AWB123", "current_status": "IN_TRANSIT"})
        passed = (status == 401)
        self.record("WEBHOOK", "WH-SR-01", "Shiprocket webhook without authentication token", "PASS" if passed else "FAIL", 401, status)

        # 6.2 Shiprocket Webhook: Invalid / Forged Token -> 401
        status, _, _ = self.request("POST", "/shipping/webhook", data={"awb": "AWB123", "current_status": "IN_TRANSIT"}, headers={"X-Shiprocket-Token": "forged_invalid_token_12345"})
        passed = (status == 401)
        self.record("WEBHOOK", "WH-SR-02", "Shiprocket webhook with forged authentication token", "PASS" if passed else "FAIL", 401, status)

        # 6.3 Shiprocket Webhook: Valid Token -> 200
        sr_payload = {
            "awb": "AWB-SEC-9999",
            "current_status": "IN_TRANSIT",
            "current_location": "Sec Warehouse Hub"
        }
        status, _, _ = self.request("POST", "/shipping/webhook", data=sr_payload, headers={"X-Shiprocket-Token": SHIPROCKET_WEBHOOK_TOKEN})
        passed = (status == 200)
        self.record("WEBHOOK", "WH-SR-03", "Shiprocket webhook with legitimate secret token", "PASS" if passed else "FAIL", 200, status)

        # 6.4 Razorpay Webhook: Missing Signature -> 400
        rzp_payload = json.dumps({"event": "payment.captured", "payload": {"payment": {"entity": {"id": "pay_test123"}}}})
        status, _, _ = self.request("POST", "/payment/webhook", raw_body=rzp_payload)
        passed = (status in [400, 401, 403])
        self.record("WEBHOOK", "WH-RZP-01", "Razorpay webhook missing X-Razorpay-Signature header", "PASS" if passed else "FAIL", "400/401/403", status)

        # 6.5 Razorpay Webhook: Invalid / Forged Signature -> 400
        status, _, _ = self.request("POST", "/payment/webhook", raw_body=rzp_payload, headers={"X-Razorpay-Signature": "forged_unauthorized_signature"})
        passed = (status in [400, 401, 403])
        self.record("WEBHOOK", "WH-RZP-02", "Razorpay webhook with arbitrary forged HMAC signature rejection", "PASS" if passed else "FAIL", 400, status)

        # 6.6 Shiprocket Webhook: Array scans JSON payload -> 200
        sr_array_payload = {
            "awb": "AWB-SEC-ARRAY-01",
            "current_status": "IN_TRANSIT",
            "current_location": "Sec Warehouse Hub",
            "scans": [{"location": "Hub A", "date": "2026-10-18"}]
        }
        status, _, _ = self.request("POST", "/shipping/webhook", data=sr_array_payload, headers={"X-Shiprocket-Token": SHIPROCKET_WEBHOOK_TOKEN})
        passed = (status == 200)
        self.record("WEBHOOK", "WH-SR-04", "Shiprocket webhook with JSON array scans format", "PASS" if passed else "FAIL", 200, status)

    # ==========================================
    # 7. CORS & SECURITY HEADERS
    # ==========================================
    def test_cors_and_security_headers(self):
        print("\n=== Category 7: CORS & Security Headers ===", flush=True)

        # 7.1 Security Headers on API response
        status, _, headers = self.request("GET", "/products?page=0&size=1")
        
        has_content_type_options = ("x-content-type-options" in headers or "X-Content-Type-Options" in headers)
        ct_val = headers.get("x-content-type-options") or headers.get("X-Content-Type-Options")
        self.record("HEADERS", "HDR-01", "X-Content-Type-Options: nosniff presence", "PASS" if ct_val == "nosniff" else "FAIL", "nosniff", str(ct_val))

        frame_val = headers.get("x-frame-options") or headers.get("X-Frame-Options")
        self.record("HEADERS", "HDR-02", "X-Frame-Options clickjacking protection", "PASS" if frame_val == "SAMEORIGIN" else "FAIL", "SAMEORIGIN", str(frame_val))

        csp_val = headers.get("content-security-policy") or headers.get("Content-Security-Policy")
        has_csp = csp_val is not None and "default-src" in str(csp_val)
        self.record("HEADERS", "HDR-03", "Content-Security-Policy (CSP) header enforcement", "PASS" if has_csp else "FAIL", "CSP defined", str(csp_val))

        ref_val = headers.get("referrer-policy") or headers.get("Referrer-Policy")
        has_ref = ref_val is not None and "strict-origin" in str(ref_val)
        self.record("HEADERS", "HDR-04", "Referrer-Policy header enforcement", "PASS" if has_ref else "FAIL", "strict-origin-when-cross-origin", str(ref_val))

        perm_val = headers.get("permissions-policy") or headers.get("Permissions-Policy")
        has_perm = perm_val is not None and "camera" in str(perm_val)
        self.record("HEADERS", "HDR-05", "Permissions-Policy header enforcement", "PASS" if has_perm else "FAIL", "Permissions policy defined", str(perm_val))

        # 7.2 CORS Preflight OPTIONS Request with Origin
        status, _, cors_headers = self.request(
            "OPTIONS", 
            "/products", 
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            }
        )
        passed = (status in [200, 204])
        self.record("CORS", "CORS-01", "CORS preflight handling for authorized frontend origin (localhost:5173)", "PASS" if passed else "FAIL", "200/204", status)

    # ==========================================
    # 8. SENSITIVE DATA EXPOSURE & SENSITIVE LOGS
    # ==========================================
    def test_sensitive_data_exposure(self):
        print("\n=== Category 8: Sensitive Data Exposure & API Output ===", flush=True)

        # 8.1 User Profile should not expose password hash or salt
        status, data, _ = self.request("GET", "/customer/profile", token=self.token_a)
        pwd_leaked = False
        if status == 200 and isinstance(data, dict):
            profile = data.get("data", {})
            for sensitive_key in ["password", "passwordHash", "salt", "secret", "token"]:
                if sensitive_key in profile:
                    pwd_leaked = True
        self.record("SENSITIVE_DATA", "SENS-01", "Customer profile DTO excludes password hashes / secrets", "PASS" if not pwd_leaked else "FAIL", "No sensitive keys", f"Keys: {list(profile.keys()) if 'profile' in locals() else 'None'}")

        # 8.2 Actuator / Env / Config Server Exposure
        status, _, _ = self.request("GET", "/actuator/env")
        passed = (status in [401, 403, 404])
        self.record("SENSITIVE_DATA", "SENS-02", "Spring Actuator /actuator/env access restriction", "PASS" if passed else "FAIL", "401/403/404", status)

    def run_all(self):
        self.setup_fixtures()
        self.test_authentication()
        self.test_authorization_rbac()
        self.test_object_level_access_control()
        self.test_input_validation_and_sqli()
        self.test_xss_resilience()
        self.test_webhook_security()
        self.test_cors_and_security_headers()
        self.test_sensitive_data_exposure()

        print("\n=======================================================", flush=True)
        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        noted = sum(1 for r in self.results if r["status"] not in ["PASS", "FAIL"])
        print(f"Total Tests Executed: {total} | Passed: {passed} | Failed: {failed} | Noted/Skipped: {noted}", flush=True)
        print("=======================================================", flush=True)

        # Save to JSON
        output_path = os.path.join("audit_output", "14_security_test_results.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump({
                "summary": {
                    "total": total,
                    "passed": passed,
                    "failed": failed,
                    "noted": noted,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                },
                "results": self.results
            }, f, indent=2)
        print(f"Results saved to {output_path}", flush=True)

if __name__ == "__main__":
    tester = SecurityTester()
    tester.run_all()
