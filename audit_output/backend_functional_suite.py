import urllib.request
import urllib.error
import json
import uuid
import time
import sys

sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://localhost:8080/api/v1"

class BackendTester:
    def __init__(self):
        self.results = []
        self.admin_token = None
        self.customer1_token = None
        self.customer2_token = None
        self.customer1_user = None
        self.customer2_user = None

    def record(self, category, test_id, name, status, expected, actual, details=None):
        res = {
            "category": category,
            "test_id": test_id,
            "name": name,
            "status": status,
            "expected": str(expected),
            "actual": str(actual),
            "details": details or ""
        }
        self.results.append(res)
        symbol = "[PASS]" if status == "PASS" else "[FAIL]"
        print(f"{symbol} [{category}] {test_id}: {name} (Exp: {expected}, Got: {actual})", flush=True)
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
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                body = resp.read().decode("utf-8")
                try:
                    json_body = json.loads(body)
                except Exception:
                    json_body = body
                return status, json_body, resp.headers
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                json_body = json.loads(body)
            except Exception:
                json_body = body
            return e.code, json_body, e.headers
        except Exception as ex:
            return 0, str(ex), {}

    def setup_accounts(self):
        print("\n--- Setting up Test Accounts ---")
        # 1. Admin account
        st, body, _ = self.request("POST", "/auth/oauth/google", {
            "email": "thepravara2026@gmail.com",
            "fullName": "Sporekart Administrator",
            "googleSub": "google-admin-phase5"
        })
        if st == 200 and body.get("success"):
            self.admin_token = body["data"]["token"]
            print("Admin account initialized successfully.")
        else:
            print("Failed to initialize admin account:", st, body)

        # 2. Customer 1
        st, body, _ = self.request("POST", "/auth/oauth/google", {
            "email": "cust1_phase5@sporekart-qa.test",
            "fullName": "Alice Customer",
            "googleSub": "google-cust1-phase5"
        })
        if st == 200 and body.get("success"):
            self.customer1_token = body["data"]["token"]
            self.customer1_user = body["data"]
            print(f"Customer 1 initialized: {self.customer1_user['userId']}")

        # 3. Customer 2
        st, body, _ = self.request("POST", "/auth/oauth/google", {
            "email": "cust2_phase5@sporekart-qa.test",
            "fullName": "Bob Customer",
            "googleSub": "google-cust2-phase5"
        })
        if st == 200 and body.get("success"):
            self.customer2_token = body["data"]["token"]
            self.customer2_user = body["data"]
            print(f"Customer 2 initialized: {self.customer2_user['userId']}")

    def test_public_routes(self):
        print("\n--- 1. Testing Public Routes & Accessibility ---")
        routes = [
            ("/catalog/products", "GET", 200),
            ("/products/popular", "GET", 200),
            ("/products/bestsellers", "GET", 200),
            ("/search?q=mushroom", "GET", 200),
            ("/content/posts", "GET", 200),
            ("/training/courses", "GET", 200),
            ("/promotions/available", "GET", 200),
            ("/seo/robots.txt", "GET", 200),
            ("/seo/sitemap.xml", "GET", 200),
            ("/shipping/check-pincode/411001", "GET", 200)
        ]
        for path, meth, exp in routes:
            st, body, _ = self.request(meth, path)
            status = "PASS" if st == exp else "FAIL"
            self.record("Public Routes", f"ROUTE_{path.split('?')[0].replace('/', '_')}", f"Public access to {path}", status, exp, st)

    def test_auth_and_rbac(self):
        print("\n--- 2. Testing Authentication & RBAC Isolation ---")
        
        # Admin route without token -> 401
        st, body, _ = self.request("GET", "/admin/orders")
        self.record("RBAC", "RBAC_GUEST_ADMIN", "Guest accessing /admin/orders", "PASS" if st == 401 else "FAIL", 401, st)

        # Admin route with customer token -> 403
        st, body, _ = self.request("GET", "/admin/orders", token=self.customer1_token)
        self.record("RBAC", "RBAC_CUST_ADMIN", "Customer accessing /admin/orders", "PASS" if st == 403 else "FAIL", 403, st)

        # Admin route with admin token -> 200
        st, body, _ = self.request("GET", "/admin/orders", token=self.admin_token)
        self.record("RBAC", "RBAC_ADMIN_ACCESS", "Admin accessing /admin/orders", "PASS" if st == 200 else "FAIL", 200, st)

        # Protected customer route without token -> 401
        st, body, _ = self.request("GET", "/wallet/balance")
        self.record("RBAC", "RBAC_GUEST_WALLET", "Guest accessing /wallet/balance", "PASS" if st == 401 else "FAIL", 401, st)

        # Protected customer route with customer token -> 200
        st, body, _ = self.request("GET", "/wallet/balance", token=self.customer1_token)
        self.record("RBAC", "RBAC_CUST_WALLET", "Customer accessing /wallet/balance", "PASS" if st == 200 else "FAIL", 200, st)

        # Retired OTP endpoints return 410 GONE
        st, body, _ = self.request("POST", "/auth/otp/request", {"identifier": "test@sporekart.in"})
        self.record("RBAC", "RBAC_RETIRED_AUTH_OTP", "Calling retired /auth/otp/request", "PASS" if st == 410 else "FAIL", 410, st)

        st, body, _ = self.request("POST", "/admin/auth/otp/request", {"identifier": "admin@sporekart.in"})
        self.record("RBAC", "RBAC_RETIRED_ADMIN_OTP", "Calling retired /admin/auth/otp/request", "PASS" if st == 410 else "FAIL", 410, st)

        # Remediated Training Admin glimpses endpoint behavior under /admin/training/glimpses
        st_glimpse_guest, _, _ = self.request("GET", "/admin/training/glimpses")
        self.record("RBAC", "RBAC_GLIMPSES_GUEST", "GET /admin/training/glimpses as guest rejected", "PASS" if st_glimpse_guest == 401 else "FAIL", 401, st_glimpse_guest)

        st_glimpse_cust, _, _ = self.request("GET", "/admin/training/glimpses", token=self.customer1_token)
        self.record("RBAC", "RBAC_GLIMPSES_CUST", "GET /admin/training/glimpses as customer rejected", "PASS" if st_glimpse_cust == 403 else "FAIL", 403, st_glimpse_cust)

        st_glimpse_admin, _, _ = self.request("GET", "/admin/training/glimpses", token=self.admin_token)
        self.record("RBAC", "RBAC_GLIMPSES_ADMIN", "GET /admin/training/glimpses as admin authorized", "PASS" if st_glimpse_admin == 200 else "FAIL", 200, st_glimpse_admin)

        st_glimpse_pub, _, _ = self.request("GET", "/training/glimpses")
        self.record("RBAC", "RBAC_GLIMPSES_PUBLIC", "Public access to /training/glimpses", "PASS" if st_glimpse_pub == 200 else "FAIL", 200, st_glimpse_pub)

    def test_null_type_and_schema_validation(self):
        print("\n--- 3. Testing Null, Type & Schema Validation ---")

        # Malformed JSON payload
        st, body, _ = self.request("POST", "/cart/items", data="{ malformed json", token=self.customer1_token)
        self.record("Validation", "VAL_MALFORMED_JSON", "Malformed JSON syntax rejection", "PASS" if st == 400 else "FAIL", 400, st)

        # Type mismatch: string for integer quantity
        st, body, _ = self.request("POST", "/cart/items", data={"variantId": str(uuid.uuid4()), "quantity": "invalid_number"}, token=self.customer1_token)
        self.record("Validation", "VAL_TYPE_MISMATCH", "String passed for integer quantity", "PASS" if st == 400 else "FAIL", 400, st)

        # Missing required body on @Valid endpoint (e.g. /customer/addresses)
        st, body, _ = self.request("POST", "/customer/addresses", data={}, token=self.customer1_token)
        self.record("Validation", "VAL_EMPTY_ADDRESS_REQ", "Empty address payload on @Valid", "PASS" if st == 400 else "FAIL", 400, st)

        # Invalid PIN code regex on address
        st, body, _ = self.request("POST", "/customer/addresses", data={
            "recipientName": "Alice",
            "phone": "9876543210",
            "line1": "Street 1",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "012345"
        }, token=self.customer1_token)
        self.record("Validation", "VAL_INVALID_PIN_REGEX", "PIN code starting with 0 rejection", "PASS" if st == 400 else "FAIL", 400, st)

        # Negative quantity on cart item
        st, body, _ = self.request("POST", "/cart/items", data={"variantId": str(uuid.uuid4()), "quantity": -5}, token=self.customer1_token)
        self.record("Validation", "VAL_NEGATIVE_QTY", "Negative quantity rejected", "PASS" if st == 400 else "FAIL", 400, st)

        # Standardized error response envelope verification
        has_error_envelope = isinstance(body, dict) and body.get("success") is False and "error" in body
        self.record("Validation", "VAL_ERROR_ENVELOPE", "RFC 7807 unified ApiResponse error structure", "PASS" if has_error_envelope else "FAIL", True, has_error_envelope)

    def test_business_rule_enforcement(self):
        print("\n--- 4. Testing Business Rule Enforcement ---")

        # Explicitly clear cart first
        self.request("DELETE", "/cart", token=self.customer1_token)

        # Checkout with empty cart -> 409 Conflict
        st, body, _ = self.request("POST", "/orders", {
            "shippingAddress": {
                "recipientName": "Alice",
                "phone": "+919111111111",
                "line1": "Farm 1",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001"
            }
        }, token=self.customer1_token)
        self.record("Business Rules", "BIZ_EMPTY_CART_CHECKOUT", "Checkout with empty cart rejection", "PASS" if st == 409 else "FAIL", 409, st)

        # Now add an item to cart so we can test missing shipping address validation
        st_cat, cat_resp, _ = self.request("GET", "/catalog/products")
        if st_cat == 200 and cat_resp.get("data") and len(cat_resp["data"]) > 0:
            var_id = cat_resp["data"][0]["variants"][0]["id"]
            self.request("POST", "/cart/items", {"variantId": var_id, "quantity": 1}, token=self.customer1_token)

        # Checkout without shipping address -> 400 Bad Request
        st, body, _ = self.request("POST", "/orders", {}, token=self.customer1_token)
        self.record("Business Rules", "BIZ_NO_ADDRESS_CHECKOUT", "Checkout without shipping address rejection", "PASS" if st == 400 else "FAIL", 400, st)

        # Cancel non-existent order -> 404 Not Found
        fake_order_id = str(uuid.uuid4())
        st, body, _ = self.request("POST", f"/orders/{fake_order_id}/cancel", token=self.customer1_token)
        self.record("Business Rules", "BIZ_CANCEL_NONEXISTENT", "Cancel non-existent order", "PASS" if st == 404 else "FAIL", 404, st)

        # Initialize wallet first
        self.request("GET", "/wallet/balance", token=self.customer1_token)

        # Wallet withdrawal exceeding balance -> 400 Bad Request (or 404 if no ledger)
        st, body, _ = self.request("POST", "/wallet/withdraw", {
            "amount": 999999.00,
            "bankName": "HDFC Bank",
            "accountNumber": "123456789012",
            "ifscCode": "HDFC0001234",
            "accountHolderName": "Alice Customer"
        }, token=self.customer1_token)
        self.record("Business Rules", "BIZ_EXCESS_WITHDRAWAL", "Withdrawal exceeding wallet balance rejection", "PASS" if st in [400, 404] else "FAIL", "400 or 404", st)

        # Wallet add-money with negative amount -> 400 Bad Request
        st, body, _ = self.request("POST", "/wallet/add-money", {"amount": -500.00}, token=self.customer1_token)
        self.record("Business Rules", "BIZ_NEGATIVE_WALLET_TOPUP", "Negative wallet top-up rejection", "PASS" if st == 400 else "FAIL", 400, st)

        # Non-existent training batch enrollment -> 404 Not Found
        st, body, _ = self.request("POST", "/training/enroll", {"batchId": str(uuid.uuid4())}, token=self.customer1_token)
        self.record("Business Rules", "BIZ_NONEXISTENT_BATCH", "Enrollment in non-existent batch", "PASS" if st == 404 else "FAIL", 404, st)

    def test_idempotency_and_duplicates(self):
        print("\n--- 5. Testing Idempotency & Duplicate Request Resistance ---")

        # Setup cart item for Customer 1
        st, cat_resp, _ = self.request("GET", "/catalog/products")
        if st == 200 and cat_resp.get("data") and len(cat_resp["data"]) > 0:
            prod = cat_resp["data"][0]
            if prod.get("variants") and len(prod["variants"]) > 0:
                variant_id = prod["variants"][0]["id"]
                self.request("POST", "/cart/items", {"variantId": variant_id, "quantity": 1}, token=self.customer1_token)
                
                idem_key = "idem_test_" + str(uuid.uuid4())
                order_payload = {
                    "shippingAddress": {
                        "recipientName": "Alice",
                        "phone": "+919111111111",
                        "line1": "Plot 42 Agro Park",
                        "city": "Pune",
                        "state": "Maharashtra",
                        "pincode": "411001"
                    }
                }
                st1, body1, _ = self.request("POST", "/orders", order_payload, token=self.customer1_token, headers={"Idempotency-Key": idem_key})
                
                if st1 == 200 and body1.get("data"):
                    order_id1 = body1["data"]["id"]
                    st2, body2, _ = self.request("POST", "/orders", order_payload, token=self.customer1_token, headers={"Idempotency-Key": idem_key})
                    order_id2 = body2["data"]["id"] if (st2 == 200 and body2.get("data")) else None

                    is_idempotent = (st1 == 200 and st2 == 200 and order_id1 == order_id2)
                    self.record("Idempotency", "IDEM_ORDER_CHECKOUT", "Order placement with repeated Idempotency-Key", "PASS" if is_idempotent else "FAIL", True, is_idempotent)
                else:
                    self.record("Idempotency", "IDEM_ORDER_CHECKOUT", "Initial order placement", "FAIL", 200, st1, str(body1))
            else:
                self.record("Idempotency", "IDEM_ORDER_CHECKOUT", "No variants in test product", "SKIP", 200, 200)
        else:
            self.record("Idempotency", "IDEM_ORDER_CHECKOUT", "No products available to test idempotency", "SKIP", 200, 200)

        # Webhook signature rejection test: forging webhook without signature returns 400
        st_w, body_w, _ = self.request("POST", "/payment/webhook", {"event": "payment.captured"})
        sig_rejected = (st_w == 400)
        self.record("Idempotency", "IDEM_WEBHOOK_FORGERY_REJECTION", "Tampered/unsigned webhook signature rejected", "PASS" if sig_rejected else "FAIL", 400, st_w)

    def test_multi_tenant_isolation(self):
        print("\n--- 6. Testing Multi-Tenant Data Isolation ---")

        # Customer 1 creates an address
        st, addr_body, _ = self.request("POST", "/customer/addresses", {
            "recipientName": "Alice Customer",
            "phone": "+919111111111",
            "line1": "Private Residence 1",
            "city": "Nashik",
            "state": "Maharashtra",
            "pincode": "422001",
            "isDefault": True
        }, token=self.customer1_token)

        if st == 200 and addr_body.get("data"):
            addr_id = addr_body["data"]["id"]
            # Customer 2 attempts to delete Customer 1's address (blocked with 400 IllegalArgumentException or 403 Forbidden)
            st_del, body_del, _ = self.request("DELETE", f"/customer/addresses/{addr_id}", token=self.customer2_token)
            self.record("Tenant Isolation", "ISO_CROSS_ADDRESS_DELETE", "Customer 2 deleting Customer 1 address", "PASS" if st_del in [400, 403, 404] else "FAIL", "400, 403 or 404", st_del)

            # Customer 2 attempts to update Customer 1's address (blocked with 400 IllegalArgumentException or 403 Forbidden)
            st_put, body_put, _ = self.request("PUT", f"/customer/addresses/{addr_id}", {
                "recipientName": "Tampered Name",
                "phone": "+919222222222",
                "line1": "Hacked",
                "city": "Pune",
                "state": "Maharashtra",
                "pincode": "411001"
            }, token=self.customer2_token)
            self.record("Tenant Isolation", "ISO_CROSS_ADDRESS_UPDATE", "Customer 2 updating Customer 1 address", "PASS" if st_put in [400, 403, 404] else "FAIL", "400, 403 or 404", st_put)
        else:
            self.record("Tenant Isolation", "ISO_CROSS_ADDRESS_SETUP", "Setup Customer 1 address", "FAIL", 200, st)

        # Support ticket cross-tenant isolation
        st_t, t_body, _ = self.request("POST", "/support/tickets", {
            "subject": "Private Query from Customer 1",
            "message": "Confidential mushroom growing question"
        }, token=self.customer1_token)

        if st_t == 200 and t_body.get("data"):
            ticket_id = t_body["data"]["id"]
            st_read, body_read, _ = self.request("GET", f"/support/tickets/{ticket_id}", token=self.customer2_token)
            self.record("Tenant Isolation", "ISO_CROSS_TICKET_READ", "Customer 2 reading Customer 1 ticket", "PASS" if st_read in [403, 404] else "FAIL", "403 or 404", st_read)

            st_msg, body_msg, _ = self.request("POST", f"/support/tickets/{ticket_id}/messages", {
                "message": "Unauthorized intruder reply"
            }, token=self.customer2_token)
            self.record("Tenant Isolation", "ISO_CROSS_TICKET_REPLY", "Customer 2 replying to Customer 1 ticket", "PASS" if st_msg in [403, 404] else "FAIL", "403 or 404", st_msg)
        else:
            self.record("Tenant Isolation", "ISO_CROSS_TICKET_SETUP", "Setup Customer 1 ticket", "FAIL", 200, st_t)

    def test_pagination_and_clamping(self):
        print("\n--- 7. Testing Pagination Bounds & Clamping ---")

        # Negative page number
        st, body, _ = self.request("GET", "/catalog/products?page=-1&size=10")
        self.record("Pagination", "PAG_NEGATIVE_PAGE", "Negative page parameter handling", "PASS" if st in [200, 400] else "FAIL", "200 or 400", st)

        # Excessive page size (e.g. 50,000)
        st, body, _ = self.request("GET", "/catalog/products?page=0&size=50000")
        if st == 200 and isinstance(body.get("data"), list):
            returned_count = len(body["data"])
            is_clamped = returned_count <= 100
            self.record("Pagination", "PAG_SIZE_CLAMPING", "Excessive page size clamped to limit", "PASS" if is_clamped else "FAIL", "<= 100 items", f"{returned_count} items")
        else:
            self.record("Pagination", "PAG_SIZE_CLAMPING", "Excessive page size response", "PASS" if st in [200, 400] else "FAIL", "200 or 400", st)

        # Admin pagination bounds
        st, body, _ = self.request("GET", "/admin/orders?page=-5&size=9999", token=self.admin_token)
        self.record("Pagination", "PAG_ADMIN_BOUNDS", "Admin order pagination bounds handling", "PASS" if st in [200, 400] else "FAIL", "200 or 400", st)

    def test_sensitive_data_exposure(self):
        print("\n--- 8. Testing Sensitive Data Exposure & Masking ---")

        st, me_body, _ = self.request("GET", "/auth/me", token=self.customer1_token)
        user_data = me_body.get("data", {}) if st == 200 else {}
        user_str = json.dumps(user_data).lower()
        leaks_pass = "password" in user_str or "secret" in user_str or "hash" in user_str
        self.record("Security", "SEC_NO_PASSWORD_IN_ME", "User profile excludes password/secret/hash", "PASS" if not leaks_pass else "FAIL", "No credentials", f"Leaks: {leaks_pass}")

        st, prof_body, _ = self.request("GET", "/customer/profile", token=self.customer1_token)
        prof_str = json.dumps(prof_body).lower()
        leaks_prof = "password" in prof_str or "salt" in prof_str
        self.record("Security", "SEC_NO_PASSWORD_IN_PROFILE", "Customer profile excludes credentials", "PASS" if not leaks_prof else "FAIL", "No credentials", f"Leaks: {leaks_prof}")

        st, err_body, _ = self.request("POST", "/cart/items", data="{ bad json", token=self.customer1_token)
        err_str = json.dumps(err_body).lower()
        has_stack = "exception" in err_str and ("at com.sporekart" in err_str or "trace" in err_str)
        self.record("Security", "SEC_NO_STACKTRACE_LEAK", "Error responses omit Java stack traces", "PASS" if not has_stack else "FAIL", "No stack trace", f"Has trace: {has_stack}")

    def run_all(self):
        self.setup_accounts()
        self.test_public_routes()
        self.test_auth_and_rbac()
        self.test_null_type_and_schema_validation()
        self.test_business_rule_enforcement()
        self.test_idempotency_and_duplicates()
        self.test_multi_tenant_isolation()
        self.test_pagination_and_clamping()
        self.test_sensitive_data_exposure()

        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["status"] == "SKIP")

        print("\n==================================================")
        print(f"Total Tests Executed: {total}")
        print(f"Passed: {passed} ({(passed/total)*100:.1f}%)")
        print(f"Failed: {failed}")
        print(f"Skipped: {skipped}")
        print("==================================================")

        with open("audit_output/live_functional_test_results.json", "w", encoding="utf-8") as f:
            json.dump({
                "summary": {
                    "total": total,
                    "passed": passed,
                    "failed": failed,
                    "skipped": skipped,
                    "pass_rate": f"{(passed/total)*100:.1f}%"
                },
                "tests": self.results
            }, f, indent=2)

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all()
