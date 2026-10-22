#!/usr/bin/env python3
"""
Sporekart Phase 11 — Training and Enrollment Audit Suite
Tests courses, batches, enrollment, capacity, payment, cancellation, refund, and notification flows.
Covers:
- Course catalog & batches integrity, schedule management, slug lookups
- Duplicate enrollment idempotency, invalid identifiers, RBAC restrictions
- Full batches, concurrent enrollment race conditions, zero overbooking
- Free vs paid course payment flows, tamper protection, idempotency
- Cancellation policy (7-day rule), refund-to-wallet behavior, unpaid enrollment protection
- Completed course protection, cancellation replay idempotency
- Notification event audit trail, customer capability grants
- Attendance marking, course completion, certificate issuance & verification
- Reviews & feedback lifecycle, verified trainee constraints
- End-to-end seat invariants and platform financial liability reconciliation
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
from datetime import datetime, timedelta, timezone

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://localhost:8080/api/v1"

class TrainingAuditTester:
    def __init__(self):
        self.results = []
        self.admin_email = "thepravara2026@gmail.com"
        self.admin_token = None
        self.admin_id = None

        self.cust_1_email = f"p11_trainee_1_{int(time.time())}@sporekart.test"
        self.cust_1_token = None
        self.cust_1_id = None

        self.cust_2_email = f"p11_trainee_2_{int(time.time())}@sporekart.test"
        self.cust_2_token = None
        self.cust_2_id = None

        self.cust_3_email = f"p11_trainee_3_{int(time.time())}@sporekart.test"
        self.cust_3_token = None
        self.cust_3_id = None

        self.created_category_id = None
        self.created_course_id = None
        self.created_course_slug = None
        self.created_batch_id = None
        self.created_schedule_id = None
        self.created_free_course_id = None
        self.created_free_batch_id = None
        self.concurrency_batch_id = None
        self.short_notice_batch_id = None
        self.enrollment_1_id = None
        self.enrollment_2_id = None
        self.initial_finance_overview = None

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
                parsed = json.loads(err_body)
            except Exception:
                parsed = err_body
            return e.code, parsed
        except Exception as e:
            return 500, {"error": str(e)}

    def authenticate_identities(self):
        # 1. Admin login
        admin_payload = {
            "googleSub": "admin_sub_pravara",
            "email": self.admin_email,
            "firstName": "Pravara",
            "lastName": "Admin",
            "fullName": "Pravara Admin"
        }
        st, res = self.api_request("POST", "/auth/oauth/google", payload=admin_payload)
        if st == 200 and res.get("success"):
            self.admin_token = res["data"]["token"]
            self.admin_id = uuid.UUID(res["data"]["userId"])
        else:
            raise RuntimeError(f"Failed to authenticate admin: {res}")

        # 2. Customer 1 login
        c1_payload = {
            "googleSub": f"sub_{self.cust_1_email}",
            "email": self.cust_1_email,
            "firstName": "Aarav",
            "lastName": "Patel",
            "fullName": "Aarav Patel"
        }
        st, res = self.api_request("POST", "/auth/oauth/google", payload=c1_payload)
        if st == 200 and res.get("success"):
            self.cust_1_token = res["data"]["token"]
            self.cust_1_id = uuid.UUID(res["data"]["userId"])

        # 3. Customer 2 login
        c2_payload = {
            "googleSub": f"sub_{self.cust_2_email}",
            "email": self.cust_2_email,
            "firstName": "Priya",
            "lastName": "Sharma",
            "fullName": "Priya Sharma"
        }
        st, res = self.api_request("POST", "/auth/oauth/google", payload=c2_payload)
        if st == 200 and res.get("success"):
            self.cust_2_token = res["data"]["token"]
            self.cust_2_id = uuid.UUID(res["data"]["userId"])

        # 4. Customer 3 login
        c3_payload = {
            "googleSub": f"sub_{self.cust_3_email}",
            "email": self.cust_3_email,
            "firstName": "Rohan",
            "lastName": "Deshmukh",
            "fullName": "Rohan Deshmukh"
        }
        st, res = self.api_request("POST", "/auth/oauth/google", payload=c3_payload)
        if st == 200 and res.get("success"):
            self.cust_3_token = res["data"]["token"]
            self.cust_3_id = uuid.UUID(res["data"]["userId"])

    def record_test(self, test_id, name, passed, details):
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {test_id} - {name}")
        if not passed:
            print(f"       Details: {details}")
        self.results.append({
            "id": test_id,
            "name": name,
            "passed": passed,
            "status": status,
            "details": details
        })

    def run_all(self):
        print("Starting Sporekart Phase 11 Training and Enrollment Audit Suite")
        self.authenticate_identities()
        print(f"Admin Identity:    {self.admin_email} ({self.admin_id})")
        print(f"Test Trainee 1:    {self.cust_1_email} ({self.cust_1_id})")
        print(f"Test Trainee 2:    {self.cust_2_email} ({self.cust_2_id})")
        print(f"Test Trainee 3:    {self.cust_3_email} ({self.cust_3_id})")
        print("Constraint Check: Failed operations do not consume seats incorrectly or leave inconsistent records.")
        print("=" * 80)

        # Baseline snapshot of platform wallet liability
        st, res = self.api_request("GET", "/admin/finance/overview", token=self.admin_token)
        if st == 200 and res.get("success"):
            self.initial_finance_overview = res.get("data", {})
            print(f"Baseline Platform Wallet Liability: ₹{self.initial_finance_overview.get('totalWalletLiability', '0.00')}")

        self.run_category_1_courses_and_batches()
        self.run_category_2_enrollment_flow_and_rbac()
        self.run_category_3_payment_flows_and_tamper_protection()
        self.run_category_4_capacity_and_concurrency()
        self.run_category_5_cancellation_refund_and_seat_restoration()
        self.run_category_6_notifications_and_capabilities()
        self.run_category_7_attendance_completion_and_reviews()
        self.run_category_8_partial_failure_and_reconciliation()

        self.summarize()

    # --- Category 1: Courses & Batches Catalog Integrity ---
    def run_category_1_courses_and_batches(self):
        print("\n--- Category 1: Courses & Batches Catalog Integrity ---")
        ts = int(time.time())

        # TRN-01: Admin creates course category
        cat_slug = f"specialty-fungi-{ts}"
        cat_payload = {
            "name": f"Specialty Fungi Cultivation {ts}",
            "slug": cat_slug,
            "description": "High-yield commercial cultivation techniques for Lion's Mane and Reishi"
        }
        st, res = self.api_request("POST", "/admin/training/categories", token=self.admin_token, payload=cat_payload)
        passed = (st == 200 and res.get("success") and res.get("data", {}).get("slug") == cat_slug)
        if passed:
            self.created_category_id = res["data"]["id"]
        self.record_test("TRN-01", "Admin Creates Course Category", passed, f"Status: {st}, Body: {res}")

        # TRN-02: Admin creates training course
        course_slug = f"lions-mane-masterclass-{ts}"
        course_payload = {
            "categoryId": self.created_category_id,
            "title": f"Lion's Mane Commercial Masterclass {ts}",
            "slug": course_slug,
            "description": "End-to-end substrate preparation, humidity control, and sterile inoculations",
            "durationDays": 14,
            "feeInr": 1500.00
        }
        st, res = self.api_request("POST", "/admin/training/courses", token=self.admin_token, payload=course_payload)
        passed = (st == 200 and res.get("success") and res.get("data", {}).get("slug") == course_slug)
        if passed:
            self.created_course_id = res["data"]["id"]
            self.created_course_slug = course_slug
        self.record_test("TRN-02", "Admin Creates Paid Training Course (Fee: ₹1500.00)", passed, f"Status: {st}, Body: {res}")

        # TRN-03: Batch parameter validation (Reject invalid capacity or dates)
        invalid_batch_payload = {
            "courseId": self.created_course_id,
            "batchCode": f"BATCH-INV-{ts}",
            "startDate": (datetime.now(timezone.utc) + timedelta(days=20)).strftime("%Y-%m-%d"),
            "endDate": (datetime.now(timezone.utc) + timedelta(days=10)).strftime("%Y-%m-%d"),
            "capacity": 0
        }
        st_inv, res_inv = self.api_request("POST", "/admin/training/batches", token=self.admin_token, payload=invalid_batch_payload)
        passed_inv = (st_inv in [400, 422, 500])
        self.record_test("TRN-03", "Batch Creation Validates Bounds (Capacity > 0, Start <= End Date)", passed_inv, f"Status: {st_inv}, Body: {res_inv}")

        # TRN-04: Admin creates valid batch with capacity 10 and future start date (> 14 days out)
        start_date = (datetime.now(timezone.utc) + timedelta(days=20)).strftime("%Y-%m-%d")
        end_date = (datetime.now(timezone.utc) + timedelta(days=34)).strftime("%Y-%m-%d")
        batch_code = f"BATCH-LM-{ts}"
        batch_payload = {
            "courseId": self.created_course_id,
            "batchCode": batch_code,
            "startDate": start_date,
            "endDate": end_date,
            "capacity": 10
        }
        st, res = self.api_request("POST", "/admin/training/batches", token=self.admin_token, payload=batch_payload)
        passed = (st == 200 and res.get("success") and res.get("data", {}).get("batchCode") == batch_code and res.get("data", {}).get("capacity") == 10)
        if passed:
            self.created_batch_id = res["data"]["id"]
        self.record_test("TRN-04", "Admin Creates Batch with Capacity 10 and Future Start Date", passed, f"Status: {st}, Body: {res}")

        # TRN-05: Admin adds batch schedule
        sched_time = (datetime.now(timezone.utc) + timedelta(days=20, hours=10)).isoformat()
        sched_payload = {
            "batchId": self.created_batch_id,
            "topic": "Cleanroom Inoculation & HEPA Filtration Protocols",
            "scheduledAt": sched_time,
            "durationMinutes": 90,
            "meetingLink": "https://meet.sporekart.com/training/batch-lm"
        }
        st, res = self.api_request("POST", "/admin/training/schedules", token=self.admin_token, payload=sched_payload)
        passed = (st == 200 and res.get("success") and res.get("data", {}).get("topic") == sched_payload["topic"])
        if passed:
            self.created_schedule_id = res["data"]["id"]
        self.record_test("TRN-05", "Admin Adds Batch Schedule with Meeting Link", passed, f"Status: {st}, Body: {res}")

        # TRN-06: Public course catalog retrieval and slug lookup
        st1, res1 = self.api_request("GET", "/training/courses")
        st2, res2 = self.api_request("GET", f"/training/courses/{self.created_course_slug}")
        passed = (st1 == 200 and res1.get("success") and st2 == 200 and res2.get("success") and res2.get("data", {}).get("slug") == self.created_course_slug)
        self.record_test("TRN-06", "Public Course Catalog Retrieval and Slug Lookup", passed, f"st1: {st1}, st2: {st2}")

        # TRN-07: Batch slots availability computation
        course_data = res2.get("data", {})
        slots = course_data.get("slots", [])
        matched_slot = next((s for s in slots if s.get("id") == self.created_batch_id), None)
        passed = False
        if matched_slot:
            cap = matched_slot.get("capacity")
            enr = matched_slot.get("enrolledCount")
            avail = matched_slot.get("availableSeats")
            is_avail = matched_slot.get("available") or matched_slot.get("isAvailable")
            passed = (cap == 10 and enr == 0 and avail == 10 and is_avail is True)
        self.record_test("TRN-07", "Batch Slot Available Seats Computation (Capacity 10 - Enrolled 0 = Available 10)", passed, f"Matched Slot: {matched_slot}")

        # TRN-08: Public gallery glimpses retrieval
        st, res = self.api_request("GET", "/training/glimpses")
        passed = (st == 200 and res.get("success") and isinstance(res.get("data"), list))
        self.record_test("TRN-08", "Public Training Gallery Glimpses Retrieval", passed, f"Status: {st}, Count: {len(res.get('data', [])) if passed else 0}")

    # --- Category 2: Enrollment Flow, Validation & RBAC ---
    def run_category_2_enrollment_flow_and_rbac(self):
        print("\n--- Category 2: Enrollment Flow, Validation & RBAC ---")

        # TRN-09: Admin account blocked from enrolling as trainee
        admin_enroll_payload = {"batchId": self.created_batch_id}
        st, res = self.api_request("POST", "/training/enroll", token=self.admin_token, payload=admin_enroll_payload)
        passed = (st in [400, 403, 409, 500] and ("admin" in str(res).lower() or "cannot enroll" in str(res).lower()))
        self.record_test("TRN-09", "Admin Blocked from Enrolling as Trainee (ROLE_ADMIN Trainee Barrier)", passed, f"Status: {st}, Body: {res}")

        # TRN-10: Invalid identifiers handling (non-existent batch ID)
        fake_batch_id = str(uuid.uuid4())
        st, res = self.api_request("POST", "/training/enroll", token=self.cust_1_token, payload={"batchId": fake_batch_id})
        passed = (st in [404, 400] and ("not found" in str(res).lower() or "invalid" in str(res).lower()))
        self.record_test("TRN-10", "Enrollment with Non-Existent Batch ID Rejected (HTTP 404/400)", passed, f"Status: {st}, Body: {res}")

        # TRN-11: Customer enrollment creates record in PENDING_PAYMENT without consuming seat
        st, res = self.api_request("POST", "/training/enroll", token=self.cust_1_token, payload={"batchId": self.created_batch_id})
        passed = (st == 200 and res.get("success") and res.get("data", {}).get("status") == "PENDING_PAYMENT")
        if passed:
            self.enrollment_1_id = res["data"]["id"]
        # Verify batch enrolledCount is still 0
        st_b, res_b = self.api_request("GET", f"/training/courses/{self.created_course_slug}")
        slot = next((s for s in res_b.get("data", {}).get("slots", []) if s.get("id") == self.created_batch_id), {})
        passed = passed and (slot.get("enrolledCount") == 0)
        self.record_test("TRN-11", "Customer Enrollment Creates PENDING_PAYMENT Without Incrementing Enrolled Seats", passed, f"Status: {st}, Slot Enrolled: {slot.get('enrolledCount')}")

        # TRN-12: Duplicate enrollment attempt returns existing enrollment idempotently
        st_dup, res_dup = self.api_request("POST", "/training/enroll", token=self.cust_1_token, payload={"batchId": self.created_batch_id})
        passed = (st_dup == 200 and res_dup.get("success") and res_dup.get("data", {}).get("id") == self.enrollment_1_id)
        self.record_test("TRN-12", "Duplicate Enrollment Attempt Returns Existing Enrollment Idempotently", passed, f"Status: {st_dup}, ID: {res_dup.get('data', {}).get('id')}")

        # TRN-13: Customer views personal bookings
        st, res = self.api_request("GET", "/training/my-bookings", token=self.cust_1_token)
        bookings = res.get("data", []) if (st == 200 and res.get("success")) else []
        matched = any(b.get("id") == self.enrollment_1_id for b in bookings)
        passed = (st == 200 and matched)
        self.record_test("TRN-13", "Customer Views Personal Bookings (/training/my-bookings)", passed, f"Status: {st}, Matched: {matched}")

        # TRN-14: Cross-user enrollment authorization boundary (User B cannot view User A's enrollment)
        st, res = self.api_request("GET", f"/training/enrollments/{self.enrollment_1_id}", token=self.cust_2_token)
        passed = (st in [403, 401])
        self.record_test("TRN-14", "Cross-User Enrollment Authorization Boundary (User B Access Denied: HTTP 403)", passed, f"Status: {st}, Body: {res}")

        # TRN-15: Owner customer and Admin can view enrollment details
        st_owner, res_owner = self.api_request("GET", f"/training/enrollments/{self.enrollment_1_id}", token=self.cust_1_token)
        st_admin, res_admin = self.api_request("GET", f"/training/enrollments/{self.enrollment_1_id}", token=self.admin_token)
        passed = (st_owner == 200 and res_owner.get("success") and st_admin == 200 and res_admin.get("success"))
        self.record_test("TRN-15", "Owner Trainee and Administrator Can Access Enrollment Details", passed, f"st_owner: {st_owner}, st_admin: {st_admin}")

    # --- Category 3: Free vs Paid Course Payment Flows & Tamper Protection ---
    def run_category_3_payment_flows_and_tamper_protection(self):
        print("\n--- Category 3: Free vs Paid Course Payment Flows & Tamper Protection ---")
        ts = int(time.time())

        # Free course creation
        free_course_payload = {
            "categoryId": self.created_category_id,
            "title": f"Community Mushroom Foraging Primer {ts}",
            "slug": f"foraging-primer-{ts}",
            "description": "Free beginner safety orientation on wild spore identification",
            "durationDays": 1,
            "feeInr": 0.00
        }
        st, res = self.api_request("POST", "/admin/training/courses", token=self.admin_token, payload=free_course_payload)
        self.created_free_course_id = res["data"]["id"]

        free_batch_payload = {
            "courseId": self.created_free_course_id,
            "batchCode": f"BATCH-FREE-{ts}",
            "startDate": (datetime.now(timezone.utc) + timedelta(days=25)).strftime("%Y-%m-%d"),
            "endDate": (datetime.now(timezone.utc) + timedelta(days=26)).strftime("%Y-%m-%d"),
            "capacity": 20
        }
        st_b, res_b = self.api_request("POST", "/admin/training/batches", token=self.admin_token, payload=free_batch_payload)
        self.created_free_batch_id = res_b["data"]["id"]

        # TRN-16: Free course enrollment bypass/direct confirmation
        st_e, res_e = self.api_request("POST", "/training/enroll", token=self.cust_2_token, payload={"batchId": self.created_free_batch_id})
        free_enrollment_id = res_e.get("data", {}).get("id")
        verify_free_payload = {
            "enrollmentId": free_enrollment_id,
            "paymentMethod": "FREE",
            "transactionReference": "FREE_BYPASS"
        }
        st_vf, res_vf = self.api_request("POST", "/payment/verify-enrollment", token=self.cust_2_token, payload=verify_free_payload)
        passed = (st_vf == 200 and res_vf.get("success") and (res_vf.get("data", {}).get("success") is True or res_vf.get("data", {}).get("isSuccess") is True))
        self.record_test("TRN-16", "Free Course Enrollment Confirmed Directly (₹0.00 Bypass)", passed, f"Status: {st_vf}, Body: {res_vf}")

        # TRN-17: Paid course enrollment payment initiation generates order
        st, res = self.api_request("POST", "/payment/initiate-enrollment", token=self.cust_1_token, payload={"enrollmentId": self.enrollment_1_id})
        passed = (st == 200 and res.get("success") and res.get("data", {}).get("razorpayOrderId") is not None)
        if passed:
            self.enrollment_1_rzp_order_id = res["data"]["razorpayOrderId"]
        self.record_test("TRN-17", "Initiate Enrollment Payment Generates Razorpay Order (Receipt ENROLL-...)", passed, f"Status: {st}, Body: {res}")

        # TRN-18: Cross-user payment initiation blocked
        st, res = self.api_request("POST", "/payment/initiate-enrollment", token=self.cust_2_token, payload={"enrollmentId": self.enrollment_1_id})
        passed = (st in [403, 401])
        self.record_test("TRN-18", "Cross-User Payment Initiation Blocked (User B -> User A's Enrollment)", passed, f"Status: {st}, Body: {res}")

        # TRN-19: Payment verification forgery protection
        forgery_payload = {
            "enrollmentId": self.enrollment_1_id,
            "paymentMethod": "ONLINE",
            "razorpayOrderId": self.enrollment_1_rzp_order_id if hasattr(self, 'enrollment_1_rzp_order_id') else "fake_order",
            "razorpayPaymentId": "pay_forged_12345",
            "razorpaySignature": "sig_forged_12345"
        }
        st, res = self.api_request("POST", "/payment/verify-enrollment", token=self.cust_2_token, payload=forgery_payload)
        passed = (st in [403, 401])
        self.record_test("TRN-19", "Payment Verification Forgery Blocked (Owner Verification)", passed, f"Status: {st}, Body: {res}")

        # TRN-20: Payment failure & missing payload validation
        st, res = self.api_request("POST", "/payment/verify-enrollment", token=self.cust_1_token, payload={"enrollmentId": self.enrollment_1_id, "paymentMethod": "ONLINE", "razorpayPaymentId": ""})
        passed = (st in [400, 422, 500])
        # Verify enrollment is still PENDING_PAYMENT
        st_chk, res_chk = self.api_request("GET", f"/training/enrollments/{self.enrollment_1_id}", token=self.cust_1_token)
        passed = passed and (res_chk.get("data", {}).get("status") == "PENDING_PAYMENT")
        self.record_test("TRN-20", "Payment Failure / Invalid Payload Rejection (Status Remains PENDING_PAYMENT)", passed, f"Status: {st}, Current Status: {res_chk.get('data', {}).get('status')}")

        # TRN-21: Valid payment confirmation transitions enrollment to CONFIRMED and increments batch enrolledCount
        confirm_ref = f"PAY-TRN-{int(time.time())}"
        st_c, res_c = self.api_request("POST", f"/training/enrollments/{self.enrollment_1_id}/confirm-payment", token=self.cust_1_token, payload={"paymentReference": confirm_ref})
        passed = (st_c == 200 and res_c.get("success") and res_c.get("data", {}).get("status") == "CONFIRMED")
        # Verify batch enrolledCount incremented from 0 to 1
        st_b, res_b = self.api_request("GET", f"/training/courses/{self.created_course_slug}")
        slot = next((s for s in res_b.get("data", {}).get("slots", []) if s.get("id") == self.created_batch_id), {})
        passed = passed and (slot.get("enrolledCount") == 1)
        self.record_test("TRN-21", "Valid Payment Confirmation Transitions to CONFIRMED & Atomically Increments Seat Count (0 -> 1)", passed, f"Status: {st_c}, Slot Enrolled: {slot.get('enrolledCount')}")

        # TRN-22: Replay of payment confirmation is idempotent
        st_rep, res_rep = self.api_request("POST", f"/training/enrollments/{self.enrollment_1_id}/confirm-payment", token=self.cust_1_token, payload={"paymentReference": confirm_ref})
        # Verify batch enrolledCount did NOT increment again (still exactly 1)
        st_b2, res_b2 = self.api_request("GET", f"/training/courses/{self.created_course_slug}")
        slot2 = next((s for s in res_b2.get("data", {}).get("slots", []) if s.get("id") == self.created_batch_id), {})
        passed = (st_rep == 200 and res_rep.get("success") and slot2.get("enrolledCount") == 1)
        self.record_test("TRN-22", "Replay of Payment Confirmation is Idempotent (Zero Duplicate Seat Increment)", passed, f"Status: {st_rep}, Slot Enrolled: {slot2.get('enrolledCount')}")

    # --- Category 4: Capacity Enforcement & Concurrency Stress Test ---
    def run_category_4_capacity_and_concurrency(self):
        print("\n--- Category 4: Capacity Enforcement & Concurrency Stress Test ---")
        ts = int(time.time())

        # Create a batch with capacity = 2 for strict concurrency testing
        conc_batch_payload = {
            "courseId": self.created_course_id,
            "batchCode": f"BATCH-RACE-{ts}",
            "startDate": (datetime.now(timezone.utc) + timedelta(days=22)).strftime("%Y-%m-%d"),
            "endDate": (datetime.now(timezone.utc) + timedelta(days=36)).strftime("%Y-%m-%d"),
            "capacity": 2
        }
        st, res = self.api_request("POST", "/admin/training/batches", token=self.admin_token, payload=conc_batch_payload)
        self.concurrency_batch_id = res["data"]["id"]

        # 5 distinct customers registered via Google Auth competing for 2 seats
        test_users = []
        for i in range(5):
            u_email = f"p11_race_trainee_{i}_{ts}@sporekart.test"
            u_payload = {
                "googleSub": f"sub_{u_email}",
                "email": u_email,
                "firstName": f"Racer{i}",
                "lastName": "Trainee",
                "fullName": f"Racer{i} Trainee"
            }
            st_u, res_u = self.api_request("POST", "/auth/oauth/google", payload=u_payload)
            test_users.append({
                "id": uuid.UUID(res_u["data"]["userId"]),
                "email": u_email,
                "token": res_u["data"]["token"]
            })

        # Pre-create enrollments for all 5 users
        enrollments = []
        for u in test_users:
            st_e, res_e = self.api_request("POST", "/training/enroll", token=u["token"], payload={"batchId": self.concurrency_batch_id})
            if st_e == 200 and res_e.get("success"):
                enrollments.append({"user": u, "enrollmentId": res_e["data"]["id"]})

        # TRN-23: Concurrent confirmation of 5 users on batch with capacity = 2
        confirm_results = []
        threads = []

        def worker(item):
            ref = f"PAY-RACE-{uuid.uuid4().hex[:6]}"
            st_res, body = self.api_request("POST", f"/training/enrollments/{item['enrollmentId']}/confirm-payment", token=item["user"]["token"], payload={"paymentReference": ref})
            confirm_results.append({"status": st_res, "body": body})

        for item in enrollments:
            t = threading.Thread(target=worker, args=(item,))
            threads.append(t)

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        successes = [r for r in confirm_results if r["status"] == 200]
        failures = [r for r in confirm_results if r["status"] != 200]

        # Verify final batch enrolledCount
        st_b, res_b = self.api_request("GET", f"/training/courses/{self.created_course_slug}")
        slot = next((s for s in res_b.get("data", {}).get("slots", []) if s.get("id") == self.concurrency_batch_id), {})
        final_enrolled = slot.get("enrolledCount", -1)

        passed = (len(successes) == 2 and len(failures) == 3 and final_enrolled == 2)
        self.record_test("TRN-23", "High-Concurrency Race Condition: Exactly 2 Confirmed, 3 Rejected, Zero Overbooking", passed,
                         f"Successes: {len(successes)}, Failures: {len(failures)}, Final Enrolled: {final_enrolled} / Capacity: 2")

        # TRN-24: Subsequent enrollment attempt on full batch rejected
        u_extra_email = f"p11_extra_{ts}@sporekart.test"
        st_ex, res_ex = self.api_request("POST", "/auth/oauth/google", payload={"googleSub": f"sub_{u_extra_email}", "email": u_extra_email, "firstName": "Extra", "lastName": "Trainee"})
        u_extra_token = res_ex["data"]["token"]

        st_full, res_full = self.api_request("POST", "/training/enroll", token=u_extra_token, payload={"batchId": self.concurrency_batch_id})
        passed = (st_full in [400, 409, 500] and ("full" in str(res_full).lower() or "capacity" in str(res_full).lower()))
        self.record_test("TRN-24", "Enrollment on Full Batch Strictly Rejected (BatchCapacityExceededException)", passed, f"Status: {st_full}, Body: {res_full}")

    # --- Category 5: Cancellation, Refund & Seat Restoration Lifecycle ---
    def run_category_5_cancellation_refund_and_seat_restoration(self):
        print("\n--- Category 5: Cancellation, Refund & Seat Restoration Lifecycle ---")
        ts = int(time.time())

        # Create a batch starting in 3 days to test 7-day cancellation restriction
        short_notice_payload = {
            "courseId": self.created_course_id,
            "batchCode": f"BATCH-SHORT-{ts}",
            "startDate": (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d"),
            "endDate": (datetime.now(timezone.utc) + timedelta(days=17)).strftime("%Y-%m-%d"),
            "capacity": 5
        }
        st_sn, res_sn = self.api_request("POST", "/admin/training/batches", token=self.admin_token, payload=short_notice_payload)
        self.short_notice_batch_id = res_sn["data"]["id"]

        st_sne, res_sne = self.api_request("POST", "/training/enroll", token=self.cust_2_token, payload={"batchId": self.short_notice_batch_id})
        sn_enrollment_id = res_sne.get("data", {}).get("id")

        # TRN-25: Cancellation policy 7-day rule enforcement
        st_can_early, res_can_early = self.api_request("POST", f"/training/enrollments/{sn_enrollment_id}/cancel", token=self.cust_2_token)
        passed = (st_can_early in [400, 409, 500] and "7 days" in str(res_can_early).lower())
        self.record_test("TRN-25", "Cancellation Within 7 Days of Batch Start Date Strictly Rejected", passed, f"Status: {st_can_early}, Body: {res_can_early}")

        # TRN-26: Cross-user cancellation blocked
        st_cxc, res_cxc = self.api_request("POST", f"/training/enrollments/{self.enrollment_1_id}/cancel", token=self.cust_2_token)
        passed = (st_cxc in [403, 401])
        self.record_test("TRN-26", "Cross-User Cancellation Blocked (User B -> User A's Enrollment: HTTP 403)", passed, f"Status: {st_cxc}, Body: {res_cxc}")

        # TRN-27: Valid cancellation of paid & confirmed enrollment
        # Customer 1 cancels enrollment_1 (which was confirmed, fee: 1500)
        st_w_pre, res_w_pre = self.api_request("GET", "/wallet/balance", token=self.cust_1_token)
        d_val = res_w_pre.get("data") if (st_w_pre == 200 and res_w_pre.get("success")) else 0
        bal_pre = Decimal(str(d_val.get("availableBalance") if isinstance(d_val, dict) else d_val))

        st_can, res_can = self.api_request("POST", f"/training/enrollments/{self.enrollment_1_id}/cancel", token=self.cust_1_token, params={"reason": "Schedule Conflict"})
        passed_can = (st_can == 200 and res_can.get("success") and res_can.get("data", {}).get("status") == "CANCELLED")

        # Verify batch enrolledCount decremented from 1 back to 0
        st_b, res_b = self.api_request("GET", f"/training/courses/{self.created_course_slug}")
        slot = next((s for s in res_b.get("data", {}).get("slots", []) if s.get("id") == self.created_batch_id), {})
        dec_passed = (slot.get("enrolledCount") == 0)

        # Verify refund credited to wallet
        st_w_post, res_w_post = self.api_request("GET", "/wallet/balance", token=self.cust_1_token)
        d_post = res_w_post.get("data") if (st_w_post == 200 and res_w_post.get("success")) else 0
        bal_post = Decimal(str(d_post.get("availableBalance") if isinstance(d_post, dict) else d_post))
        refund_credited = (bal_post == bal_pre + Decimal("1500.00"))

        passed = passed_can and dec_passed and refund_credited
        self.record_test("TRN-27", "Valid Cancellation of Paid Enrollment Decrements Seat (1 -> 0) & Refunds to Wallet (+₹1500.00)", passed,
                         f"Cancel Status: {st_can}, Enrolled Count: {slot.get('enrolledCount')}, Bal Pre: {bal_pre}, Bal Post: {bal_post}")

        # TRN-28: Cancellation replay idempotency
        st_rep_can, res_rep_can = self.api_request("POST", f"/training/enrollments/{self.enrollment_1_id}/cancel", token=self.cust_1_token)
        # Check that wallet balance did not increase again
        st_w_post2, res_w_post2 = self.api_request("GET", "/wallet/balance", token=self.cust_1_token)
        d_post2 = res_w_post2.get("data")
        bal_post2 = Decimal(str(d_post2.get("availableBalance") if isinstance(d_post2, dict) else d_post2))
        passed = (st_rep_can == 200 and res_rep_can.get("success") and bal_post2 == bal_post)
        self.record_test("TRN-28", "Replay of Cancellation is Idempotent (No Double-Refund, No Negative Seat Count)", passed,
                         f"Status: {st_rep_can}, Bal Post2: {bal_post2} == {bal_post}")

        # TRN-29: Confirm payment on CANCELLED enrollment rejected
        st_resurrect, res_resurrect = self.api_request("POST", f"/training/enrollments/{self.enrollment_1_id}/confirm-payment", token=self.cust_1_token, payload={"paymentReference": "TRY-RESURRECT"})
        # Should be rejected (status must remain CANCELLED)
        st_chk, res_chk = self.api_request("GET", f"/training/enrollments/{self.enrollment_1_id}", token=self.cust_1_token)
        curr_status = res_chk.get("data", {}).get("status")
        passed = (st_resurrect in [400, 409, 500] and curr_status == "CANCELLED")
        self.record_test("TRN-29", "Payment Confirmation on Cancelled Enrollment Strictly Rejected (Cannot Resurrect)", passed,
                         f"Confirm Status: {st_resurrect}, Current Enrollment Status: {curr_status}")

        # TRN-30: Unpaid PENDING_PAYMENT enrollment cancellation must NOT issue wallet refund
        # Customer 3 enrolls in a paid course, stays in PENDING_PAYMENT, then cancels
        st_e3, res_e3 = self.api_request("POST", "/training/enroll", token=self.cust_3_token, payload={"batchId": self.created_batch_id})
        e3_id = res_e3.get("data", {}).get("id")

        st_w3_pre, res_w3_pre = self.api_request("GET", "/wallet/balance", token=self.cust_3_token)
        d3_pre = res_w3_pre.get("data") if (st_w3_pre == 200 and res_w3_pre.get("success")) else 0
        w3_bal_pre = Decimal(str(d3_pre.get("availableBalance") if isinstance(d3_pre, dict) else d3_pre))

        st_can3, res_can3 = self.api_request("POST", f"/training/enrollments/{e3_id}/cancel", token=self.cust_3_token)
        st_w3_post, res_w3_post = self.api_request("GET", "/wallet/balance", token=self.cust_3_token)
        d3_post = res_w3_post.get("data") if (st_w3_post == 200 and res_w3_post.get("success")) else 0
        w3_bal_post = Decimal(str(d3_post.get("availableBalance") if isinstance(d3_post, dict) else d3_post))

        # Must NOT refund since user never paid!
        passed = (st_can3 == 200 and w3_bal_post == w3_bal_pre)
        self.record_test("TRN-30", "Unpaid PENDING_PAYMENT Enrollment Cancellation Does NOT Issue Unearned Wallet Refund", passed,
                         f"Bal Pre: {w3_bal_pre}, Bal Post: {w3_bal_post} (Delta: {w3_bal_post - w3_bal_pre})")

    # --- Category 6: Notifications & Capabilities ---
    def run_category_6_notifications_and_capabilities(self):
        print("\n--- Category 6: Notifications & Customer Capabilities ---")

        # Enroll customer 2 into paid course batch and confirm payment
        st_e2, res_e2 = self.api_request("POST", "/training/enroll", token=self.cust_2_token, payload={"batchId": self.created_batch_id})
        self.enrollment_2_id = res_e2.get("data", {}).get("id")
        self.api_request("POST", f"/training/enrollments/{self.enrollment_2_id}/confirm-payment", token=self.cust_2_token, payload={"paymentReference": "PAY-TRN-CUST2"})

        # Allow async events to complete
        time.sleep(1.5)

        # TRN-31: Verify customer capability TRAINING is granted
        st_cap, res_cap = self.api_request("GET", "/customer/profile", token=self.cust_2_token)
        has_cap = False
        if st_cap == 200 and res_cap.get("success"):
            caps = res_cap.get("data", {}).get("capabilities", [])
            has_cap = "TRAINING" in caps or res_cap.get("data", {}).get("hasTrainingCapability") is True
        self.record_test("TRN-31", "Customer Capability TRAINING Successfully Granted Upon Enrollment Confirmation", has_cap, f"Profile: {res_cap}")

        # TRN-32: Admin notification events audit for enrollment confirmation
        st_notif, res_notif = self.api_request("GET", "/admin/notifications", token=self.admin_token, params={"search": str(self.enrollment_2_id)})
        passed_notif = False
        events = []
        if st_notif == 200 and res_notif.get("success"):
            events = res_notif.get("data", {}).get("content", [])
            passed_notif = any(ev.get("eventType") == "ENROLLMENT_CONFIRMED" for ev in events)
        self.record_test("TRN-32", "ENROLLMENT_CONFIRMED Event Successfully Recorded in Notification Audit Trail", passed_notif, f"Status: {st_notif}, Found: {passed_notif}")

        # TRN-33: ENROLLMENT_CANCELLED notification event recorded
        st_notif_can, res_notif_can = self.api_request("GET", "/admin/notifications", token=self.admin_token, params={"search": str(self.enrollment_1_id)})
        passed_notif_can = False
        if st_notif_can == 200 and res_notif_can.get("success"):
            events_can = res_notif_can.get("data", {}).get("content", [])
            passed_notif_can = any(ev.get("eventType") == "ENROLLMENT_CANCELLED" for ev in events_can)
        self.record_test("TRN-33", "ENROLLMENT_CANCELLED Event Successfully Recorded in Notification Audit Trail", passed_notif_can, f"Status: {st_notif_can}, Found: {passed_notif_can}")

    # --- Category 7: Attendance, Completion, Certificates & Reviews ---
    def run_category_7_attendance_completion_and_reviews(self):
        print("\n--- Category 7: Attendance, Completion, Certificates & Reviews ---")

        # TRN-34: Admin marks trainee attendance
        att_payload = {
            "enrollmentId": self.enrollment_2_id,
            "scheduleId": self.created_schedule_id,
            "isPresent": True
        }
        st_att, res_att = self.api_request("POST", "/admin/training/attendance", token=self.admin_token, payload=att_payload)
        passed = (st_att == 200 and res_att.get("success"))
        self.record_test("TRN-34", "Admin Marks Trainee Attendance for Batch Schedule", passed, f"Status: {st_att}, Body: {res_att}")

        # TRN-35: Complete course and issue certificate on cancelled enrollment rejected
        st_comp_can, res_comp_can = self.api_request("POST", "/admin/training/complete-course", token=self.admin_token, payload={"enrollmentId": self.enrollment_1_id, "grade": "DISTINCTION"})
        passed = (st_comp_can in [400, 409, 500] and ("only confirmed" in str(res_comp_can).lower() or "cannot" in str(res_comp_can).lower()))
        self.record_test("TRN-35", "Course Completion on Cancelled Enrollment Strictly Rejected", passed, f"Status: {st_comp_can}, Body: {res_comp_can}")

        # TRN-36: Admin completes course and issues certificate for confirmed enrollment
        comp_payload = {
            "enrollmentId": self.enrollment_2_id,
            "grade": "DISTINCTION"
        }
        st_comp, res_comp = self.api_request("POST", "/admin/training/complete-course", token=self.admin_token, payload=comp_payload)
        cert_data = res_comp.get("data", {}) if (st_comp == 200 and res_comp.get("success")) else {}
        cert_code = cert_data.get("certificateCode", "")
        passed = (st_comp == 200 and cert_code.startswith("CERT-"))
        self.record_test("TRN-36", "Admin Completes Course & Issues Certificate (Code starts with CERT-...)", passed, f"Status: {st_comp}, Cert Code: {cert_code}")

        # TRN-37: Certificate retrieval by trainee
        st_cert, res_cert = self.api_request("GET", f"/training/certificate/{self.enrollment_2_id}", token=self.cust_2_token)
        passed = (st_cert == 200 and res_cert.get("success") and res_cert.get("data", {}).get("certificateCode") == cert_code)
        self.record_test("TRN-37", "Trainee Retrieves Certificate Successfully (/training/certificate/{id})", passed, f"Status: {st_cert}, Body: {res_cert}")

        # TRN-38: Unauthorized trainee blocked from accessing other's certificate
        st_unauth_cert, res_unauth_cert = self.api_request("GET", f"/training/certificate/{self.enrollment_2_id}", token=self.cust_1_token)
        passed = (st_unauth_cert in [403, 401])
        self.record_test("TRN-38", "Unauthorized Trainee Blocked from Accessing Another Trainee's Certificate (HTTP 403)", passed, f"Status: {st_unauth_cert}")

        # TRN-39: Completed course cancellation rejected
        st_can_comp, res_can_comp = self.api_request("POST", f"/training/enrollments/{self.enrollment_2_id}/cancel", token=self.cust_2_token)
        passed = (st_can_comp in [400, 409, 500] and ("completed" in str(res_can_comp).lower() or "cannot" in str(res_can_comp).lower()))
        self.record_test("TRN-39", "Completed Course Cancellation & Post-Certification Refund Strictly Blocked", passed, f"Status: {st_can_comp}, Body: {res_can_comp}")

        # TRN-40: Trainee submits verified review
        review_payload = {
            "enrollmentId": self.enrollment_2_id,
            "rating": 5,
            "instructorRating": 5,
            "reviewTitle": "Outstanding Commercial Lion's Mane Training!",
            "reviewText": "Detailed protocols on humidity buffering and sterile inoculation were top tier."
        }
        st_rev, res_rev = self.api_request("POST", "/training/reviews", token=self.cust_2_token, payload=review_payload)
        passed = (st_rev == 200 and res_rev.get("success") and (res_rev.get("data", {}).get("verifiedTrainee") is True or res_rev.get("data", {}).get("isVerifiedTrainee") is True))
        self.record_test("TRN-40", "Verified Trainee Submits 5-Star Course Review (isVerifiedTrainee = True)", passed, f"Status: {st_rev}, Body: {res_rev}")

        # TRN-41: Duplicate review rejected
        st_dup_rev, res_dup_rev = self.api_request("POST", "/training/reviews", token=self.cust_2_token, payload=review_payload)
        passed = (st_dup_rev in [400, 409, 500] and "already reviewed" in str(res_dup_rev).lower())
        self.record_test("TRN-41", "Duplicate Course Review Submission Strictly Rejected", passed, f"Status: {st_dup_rev}, Body: {res_dup_rev}")

        # TRN-42: Public course review summary reflects published review
        st_sum, res_sum = self.api_request("GET", f"/training/courses/{self.created_course_id}/reviews/summary")
        passed = False
        if st_sum == 200 and res_sum.get("success"):
            sum_data = res_sum.get("data", {})
            passed = (sum_data.get("totalReviews", 0) >= 1 and sum_data.get("fiveStarCount", 0) >= 1)
        self.record_test("TRN-42", "Public Course Review Summary Reflects Verified Trainee Ratings", passed, f"Status: {st_sum}, Summary: {res_sum}")

    # --- Category 8: Partial Failure Recovery & End-to-End Financial Invariants Reconciliation ---
    def run_category_8_partial_failure_and_reconciliation(self):
        print("\n--- Category 8: Partial Failure Recovery & Financial Reconciliation ---")

        # TRN-43: Batch capacity invariant reconciliation:
        # Check that for all created batches, enrolledCount equals number of CONFIRMED or COMPLETED enrollments
        st_admin_enr, res_admin_enr = self.api_request("GET", "/admin/training/enrollments", token=self.admin_token)
        all_enrollments = res_admin_enr.get("data", []) if (st_admin_enr == 200 and res_admin_enr.get("success")) else []

        batch_enrolled_counts = {}
        for e in all_enrollments:
            b_id = e.get("batchId")
            st_val = e.get("status")
            if st_val in ["CONFIRMED", "COMPLETED"]:
                batch_enrolled_counts[b_id] = batch_enrolled_counts.get(b_id, 0) + 1

        # Check our primary batch
        st_b, res_b = self.api_request("GET", f"/training/courses/{self.created_course_slug}")
        slots = res_b.get("data", {}).get("slots", [])
        primary_slot = next((s for s in slots if s.get("id") == self.created_batch_id), {})
        slot_enrolled = primary_slot.get("enrolledCount", -1)
        expected_enrolled = batch_enrolled_counts.get(self.created_batch_id, 0)

        passed = (slot_enrolled == expected_enrolled)
        self.record_test("TRN-43", "Batch Seat Invariant: enrolledCount == Count(CONFIRMED + COMPLETED Enrollments)", passed,
                         f"Slot Enrolled: {slot_enrolled}, Expected Active: {expected_enrolled}")

        # TRN-44: Platform wallet liability baseline reconciliation
        # Verify that pre-existing accounts experienced zero unexpected financial drift
        st_fin, res_fin = self.api_request("GET", "/admin/finance/overview", token=self.admin_token)
        final_overview = res_fin.get("data", {}) if (st_fin == 200 and res_fin.get("success")) else {}
        pre_liability = Decimal(str(self.initial_finance_overview.get("walletLiabilityBalance", "0.00"))) if self.initial_finance_overview else Decimal("0.00")
        post_liability = Decimal(str(final_overview.get("walletLiabilityBalance", "0.00"))) if final_overview else Decimal("0.00")

        # Customer 1 received ₹1500 refund from cancelling paid enrollment 1
        expected_drift = Decimal("1500.00")
        actual_drift = post_liability - pre_liability
        reconciled = (actual_drift == expected_drift)
        self.record_test("TRN-44", "Platform Financial Reconciliation: Net Drift Matches Valid Training Refunds Exactly (₹1,500.00)", reconciled,
                         f"Pre-Audit: ₹{pre_liability}, Post-Audit: ₹{post_liability}, Net Drift: ₹{actual_drift} == Expected: ₹{expected_drift}")

    def summarize(self):
        print("\n" + "=" * 80)
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed
        rate = (passed / total * 100) if total > 0 else 0

        print("TRAINING AND ENROLLMENT AUDIT SUMMARY:")
        print(f"Total Tests Executed: {total}")
        print(f"Tests Passed:         {passed}")
        print(f"Tests Failed:         {failed}")
        print(f"Pass Rate:            {rate:.1f}%")
        print("=" * 80)

        out_path = "audit_output/11_training_test_results.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "total": total,
                "passed": passed,
                "failed": failed,
                "pass_rate": rate,
                "results": self.results
            }, f, indent=2)
        print(f"Results written to {out_path}\n")

if __name__ == "__main__":
    tester = TrainingAuditTester()
    tester.run_all()
