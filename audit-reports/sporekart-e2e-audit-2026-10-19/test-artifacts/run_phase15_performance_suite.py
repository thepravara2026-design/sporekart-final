#!/usr/bin/env python3
"""
Sporekart Performance and Reliability Benchmark Suite (Phase 15)
Measures latency (min, p50, p90, p95, p99, max, mean, stddev),
throughput (RPS), error rates, HikariCP connection pool metrics,
and JVM resource utilization across varying concurrency levels.
"""

import os
import sys
import time
import math
import json
import base64
import hmac
import hashlib
import uuid
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:8080/api/v1"
JWT_SECRET_B64 = "404E635266556A586E3272357538782F413F4428472B4B6250655368566D5971"

def b64url(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def generate_jwt(user_id, email, role, exp_delta=86400):
    header = b64url(json.dumps({'alg': 'HS256', 'typ': 'JWT'}))
    payload = b64url(json.dumps({
        'sub': str(user_id),
        'identifier': email,
        'role': role,
        'iat': int(time.time()),
        'exp': int(time.time()) + exp_delta
    }))
    secret = base64.b64decode(JWT_SECRET_B64)
    sig = b64url(hmac.new(secret, f"{header}.{payload}".encode('utf-8'), hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"

class PerformanceBenchmark:
    def __init__(self):
        self.admin_id = uuid.UUID("529a5ab9-9def-405b-965b-21bdfa98cf7e")
        self.user_a_id = uuid.UUID("68c1c221-6a02-4b2f-b72e-43196874870a")
        self.admin_token = generate_jwt(self.admin_id, "admin@sporekart.in", "ROLE_ADMIN")
        self.user_token = generate_jwt(self.user_a_id, "addr_cust_1791859033460_7210@sporekart-qa.test", "ROLE_CUSTOMER")
        self.session_id = "sess_perf_test_" + str(uuid.uuid4())[:8]

        self.sample_product_id = None
        self.sample_variant_id = None

    def get_actuator_metric(self, metric_name):
        url = f"{BASE_URL}/actuator/metrics/{metric_name}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {self.admin_token}"})
        try:
            with urllib.request.urlopen(req, timeout=5) as res:
                data = json.loads(res.read().decode())
                if "measurements" in data and len(data["measurements"]) > 0:
                    return data["measurements"][0]["value"]
        except Exception:
            return None
        return None

    def capture_system_snapshot(self):
        metrics = {}
        for m in [
            "jvm.memory.used",
            "jvm.memory.max",
            "system.cpu.usage",
            "process.cpu.usage",
            "hikaricp.connections.active",
            "hikaricp.connections.idle",
            "hikaricp.connections.pending",
            "hikaricp.connections.max",
            "jvm.threads.live",
            "jvm.threads.peak"
        ]:
            val = self.get_actuator_metric(m)
            if val is not None:
                metrics[m] = round(val, 4) if isinstance(val, float) else val
        return metrics

    def setup_fixtures(self):
        print("[*] Setting up benchmark fixtures...")
        req = urllib.request.Request(f"{BASE_URL}/products?page=0&size=10")
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                body = json.loads(res.read().decode())
                data = body.get("data", [])
                if isinstance(data, dict):
                    data = data.get("content", [])
                if data and len(data) > 0:
                    self.sample_product_id = data[0].get("id")
                    variants = data[0].get("variants", [])
                    if variants:
                        self.sample_variant_id = variants[0].get("id")
                    print(f"    - Sample Product ID: {self.sample_product_id}")
                    print(f"    - Sample Variant ID: {self.sample_variant_id}")
        except Exception as e:
            print(f"    [!] Failed to fetch sample product: {e}")

        # Warmup
        print("[*] Warming up JIT and database connection pool (10 requests)...")
        for _ in range(10):
            try:
                urllib.request.urlopen(urllib.request.Request(f"{BASE_URL}/products?page=0&size=10"), timeout=10)
            except Exception:
                pass
        time.sleep(1)

    def execute_request(self, method, endpoint, headers=None, body_bytes=None, timeout=30):
        url = f"{BASE_URL}{endpoint}"
        req_headers = {"User-Agent": "Sporekart-Benchmark/1.0"}
        if headers:
            req_headers.update(headers)
        if body_bytes:
            req_headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)
        start_time = time.perf_counter()
        status_code = 0
        error = None
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                status_code = res.status
                res.read()  # Consume body
        except urllib.error.HTTPError as e:
            status_code = e.code
            try:
                e.read()
            except Exception:
                pass
        except Exception as ex:
            error = str(ex)
            status_code = 0
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        return latency_ms, status_code, error

    def run_scenario(self, scenario_name, method, endpoint, headers, body_bytes, concurrency, total_requests):
        print(f"  -> Testing: {scenario_name} | Concurrency: {concurrency} | Total: {total_requests}")
        latencies = []
        status_counts = {}
        error_count = 0

        pre_snapshot = self.capture_system_snapshot()
        wall_start = time.perf_counter()

        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [
                executor.submit(self.execute_request, method, endpoint, headers, body_bytes)
                for _ in range(total_requests)
            ]
            for f in as_completed(futures):
                latency_ms, status, err = f.result()
                latencies.append(latency_ms)
                status_counts[status] = status_counts.get(status, 0) + 1
                if err or status < 200 or status >= 400:
                    error_count += 1

        wall_duration = time.perf_counter() - wall_start
        post_snapshot = self.capture_system_snapshot()

        latencies.sort()
        n = len(latencies)
        mean_lat = sum(latencies) / n if n > 0 else 0
        variance = sum((x - mean_lat) ** 2 for x in latencies) / n if n > 0 else 0
        stddev_lat = math.sqrt(variance)

        def pct(p):
            if not latencies:
                return 0.0
            idx = min(int(math.ceil(p * n)) - 1, n - 1)
            return latencies[max(0, idx)]

        p50 = pct(0.50)
        p90 = pct(0.90)
        p95 = pct(0.95)
        p99 = pct(0.99)
        min_lat = latencies[0] if latencies else 0.0
        max_lat = latencies[-1] if latencies else 0.0
        rps = total_requests / wall_duration if wall_duration > 0 else 0.0
        error_rate = (error_count / total_requests) * 100.0 if total_requests > 0 else 0.0

        result = {
            "scenario": scenario_name,
            "method": method,
            "endpoint": endpoint,
            "concurrency": concurrency,
            "total_requests": total_requests,
            "duration_seconds": round(wall_duration, 3),
            "throughput_rps": round(rps, 2),
            "error_count": error_count,
            "error_rate_pct": round(error_rate, 2),
            "status_codes": status_counts,
            "latency_ms": {
                "min": round(min_lat, 2),
                "mean": round(mean_lat, 2),
                "median_p50": round(p50, 2),
                "p90": round(p90, 2),
                "p95": round(p95, 2),
                "p99": round(p99, 2),
                "max": round(max_lat, 2),
                "stddev": round(stddev_lat, 2)
            },
            "system_snapshot": {
                "pre": pre_snapshot,
                "post": post_snapshot
            }
        }

        print(f"     [Result] RPS: {result['throughput_rps']} | p50: {p50:.1f}ms | p95: {p95:.1f}ms | p99: {p99:.1f}ms | Max: {max_lat:.1f}ms | Err: {error_rate:.1f}%")
        return result

    def run_all_benchmarks(self):
        self.setup_fixtures()
        all_results = []

        scenarios = [
            {
                "name": "Public Catalog Listing (page=0, size=20)",
                "method": "GET",
                "endpoint": "/products?page=0&size=20",
                "headers": {},
                "body": None
            },
            {
                "name": "Product Detail with Variants",
                "method": "GET",
                "endpoint": f"/products/{self.sample_product_id}" if self.sample_product_id else "/products",
                "headers": {},
                "body": None
            },
            {
                "name": "Training Courses Catalog",
                "method": "GET",
                "endpoint": "/training/courses",
                "headers": {},
                "body": None
            },
            {
                "name": "Customer Profile & Capabilities (Auth)",
                "method": "GET",
                "endpoint": "/customer/profile",
                "headers": {"Authorization": f"Bearer {self.user_token}"},
                "body": None
            },
            {
                "name": "Customer Cart Retrieval",
                "method": "GET",
                "endpoint": "/cart",
                "headers": {
                    "Authorization": f"Bearer {self.user_token}",
                    "X-Session-ID": self.session_id
                },
                "body": None
            },
            {
                "name": "Cart Item Addition (Concurrent Mutation)",
                "method": "POST",
                "endpoint": "/cart/items",
                "headers": {
                    "Authorization": f"Bearer {self.user_token}",
                    "X-Session-ID": self.session_id
                },
                "body": json.dumps({
                    "variantId": str(self.sample_variant_id) if self.sample_variant_id else "9e8264bb-7f89-4fc4-bcbe-ea6fc5e49051",
                    "quantity": 1
                }).encode('utf-8')
            },
            {
                "name": "Admin Analytics Overview (Auth)",
                "method": "GET",
                "endpoint": "/admin/analytics/overview",
                "headers": {"Authorization": f"Bearer {self.admin_token}"},
                "body": None
            },
            {
                "name": "Admin Orders Listing (page=0, size=20)",
                "method": "GET",
                "endpoint": "/admin/orders?page=0&size=20",
                "headers": {"Authorization": f"Bearer {self.admin_token}"},
                "body": None
            }
        ]

        # Concurrency matrix
        test_matrix = [
            {"concurrency": 1, "requests_per_scenario": 30, "label": "Baseline (C=1)"},
            {"concurrency": 5, "requests_per_scenario": 50, "label": "Light Load (C=5)"},
            {"concurrency": 10, "requests_per_scenario": 100, "label": "Moderate Load (C=10)"},
            {"concurrency": 20, "requests_per_scenario": 100, "label": "Pool Saturation Stress (C=20)"}
        ]

        print("\n=================================================================")
        print("SPOREKART ENTERPRISE PERFORMANCE & RELIABILITY BENCHMARK SUITE")
        print("=================================================================\n")

        overall_start = time.time()
        for matrix in test_matrix:
            c = matrix["concurrency"]
            reqs = matrix["requests_per_scenario"]
            lbl = matrix["label"]
            print(f"\n>>> EXECUTING TIER: {lbl} (Concurrency: {c}, Requests per endpoint: {reqs}) <<<")
            tier_results = []
            for sc in scenarios:
                res = self.run_scenario(
                    sc["name"],
                    sc["method"],
                    sc["endpoint"],
                    sc["headers"],
                    sc["body"],
                    concurrency=c,
                    total_requests=reqs
                )
                tier_results.append(res)
                # Short pause between scenarios to allow connection pool reset
                time.sleep(0.5)
            all_results.append({
                "tier": lbl,
                "concurrency": c,
                "scenarios": tier_results
            })

        overall_duration = time.time() - overall_start

        final_report = {
            "metadata": {
                "benchmark_name": "Sporekart Performance and Reliability Audit",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "environment": {
                    "os": "Windows 11 Pro 64-bit",
                    "runtime": "Java 21 OpenJDK / Spring Boot 3.3.3 / Embedded Tomcat 10.1.28",
                    "database": "Supabase PostgreSQL 17.6 (AWS Tokyo ap-northeast-1, PgBouncer port 6543)",
                    "pool_config": {
                        "pool_name": "HikariPool-1",
                        "maximum_pool_size": 15,
                        "minimum_idle": 5,
                        "connection_timeout_ms": 20000,
                        "idle_timeout_ms": 30000,
                        "max_lifetime_ms": 1800000
                    }
                },
                "total_benchmark_duration_seconds": round(overall_duration, 2),
                "total_requests_executed": sum(sc["total_requests"] for tier in all_results for sc in tier["scenarios"])
            },
            "tiers": all_results
        }

        output_path = "f:/sporekart-v1/sporekart-final/audit_output/15_performance_test_results.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_report, f, indent=2)

        print(f"\n[+] Successfully saved benchmark results to: {output_path}")
        print(f"[+] Total benchmark duration: {overall_duration:.2f}s across {final_report['metadata']['total_requests_executed']} requests.")
        return final_report

if __name__ == "__main__":
    benchmark = PerformanceBenchmark()
    benchmark.run_all_benchmarks()
