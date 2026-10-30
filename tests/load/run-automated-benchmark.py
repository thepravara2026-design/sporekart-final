#!/usr/bin/env python3
"""
Sporekart Automated CI/CD Performance & Benchmark Harness (Phase 2)
Standalone, reproducible performance runner with zero third-party dependencies.
Measures latency distribution (min, p50, p90, p95, p99, max, stddev),
throughput (RPS), error rates, and validates against strict SLA quality gates.
"""

import os
import sys
import time
import math
import json
import uuid
import argparse
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

DEFAULT_BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080/api/v1")

# Quality Gate SLA Criteria
SLA_MAX_P95_MS = 500.0
SLA_MAX_P99_MS = 1200.0
SLA_MAX_ERROR_RATE_PCT = 1.0

class AutomatedBenchmarkRunner:
    def __init__(self, base_url=DEFAULT_BASE_URL, verbose=True):
        self.base_url = base_url.rstrip("/")
        self.verbose = verbose
        self.sample_product_id = None
        self.sample_variant_id = None
        self.sample_course_id = None
        self.sample_batch_id = None

    def log(self, message):
        if self.verbose:
            print(message)

    def discover_fixtures(self):
        self.log(f"[*] Discovering live dynamic test fixtures from {self.base_url}...")
        
        # 1. Product & Variant Discovery
        try:
            req = urllib.request.Request(
                f"{self.base_url}/products?page=0&size=5",
                headers={"User-Agent": "Sporekart-Benchmark-CI/2.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                body = json.loads(res.read().decode("utf-8"))
                items = body if isinstance(body, list) else (body.get("data") or body.get("content") or [])
                if items and len(items) > 0:
                    first = items[0]
                    self.sample_product_id = first.get("id")
                    variants = first.get("variants") or []
                    if variants:
                        self.sample_variant_id = variants[0].get("id")
                    self.log(f"    - Sample Product: {first.get('title')} (ID: {self.sample_product_id})")
                    self.log(f"    - Sample Variant ID: {self.sample_variant_id}")
        except Exception as e:
            self.log(f"    [!] Warning: Product discovery failed: {e}")

        # 2. Courses Discovery
        try:
            req = urllib.request.Request(
                f"{self.base_url}/training/courses",
                headers={"User-Agent": "Sporekart-Benchmark-CI/2.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                body = json.loads(res.read().decode("utf-8"))
                courses = body if isinstance(body, list) else (body.get("data") or [])
                if courses and len(courses) > 0:
                    first_course = courses[0]
                    self.sample_course_id = first_course.get("id")
                    self.log(f"    - Sample Course: {first_course.get('title')} (ID: {self.sample_course_id})")
        except Exception as e:
            self.log(f"    [!] Warning: Course discovery failed: {e}")

    def warmup(self, requests_count=10):
        self.log(f"[*] Warming up connection pool and Caffeine caches ({requests_count} requests)...")
        for _ in range(requests_count):
            try:
                req = urllib.request.Request(
                    f"{self.base_url}/products?page=0&size=5",
                    headers={"User-Agent": "Sporekart-Benchmark-CI/2.0"}
                )
                with urllib.request.urlopen(req, timeout=5) as res:
                    res.read()
            except Exception:
                pass
        time.sleep(0.5)

    def execute_request(self, method, endpoint, headers=None, body_bytes=None, timeout=15):
        url = f"{self.base_url}{endpoint}"
        req_headers = {
            "User-Agent": "Sporekart-Benchmark-CI/2.0",
            "Accept": "application/json"
        }
        if headers:
            req_headers.update(headers)
        if body_bytes:
            req_headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)
        start_time = time.perf_counter()
        status_code = 0
        error = None
        etag = None

        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                status_code = res.status
                etag = res.headers.get("ETag")
                res.read()
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
        return latency_ms, status_code, error, etag

    def run_scenario(self, scenario_name, method, endpoint, headers=None, body_bytes=None, concurrency=10, total_requests=100):
        self.log(f"  -> Testing: {scenario_name} | Concurrency: {concurrency} | Total: {total_requests}")
        latencies = []
        status_counts = {}
        error_count = 0

        wall_start = time.perf_counter()

        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [
                executor.submit(self.execute_request, method, endpoint, headers, body_bytes)
                for _ in range(total_requests)
            ]
            for f in as_completed(futures):
                latency_ms, status, err, _ = f.result()
                latencies.append(latency_ms)
                status_counts[status] = status_counts.get(status, 0) + 1
                if err or status < 200 or status >= 400:
                    error_count += 1

        wall_duration = time.perf_counter() - wall_start
        latencies.sort()
        n = len(latencies)

        mean_lat = sum(latencies) / n if n > 0 else 0.0
        variance = sum((x - mean_lat) ** 2 for x in latencies) / n if n > 0 else 0.0
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

        passed_sla = (p95 <= SLA_MAX_P95_MS) and (p99 <= SLA_MAX_P99_MS) and (error_rate <= SLA_MAX_ERROR_RATE_PCT)

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
                "p50": round(p50, 2),
                "p90": round(p90, 2),
                "p95": round(p95, 2),
                "p99": round(p99, 2),
                "max": round(max_lat, 2),
                "stddev": round(stddev_lat, 2),
            },
            "sla_check": {
                "p95_under_500ms": p95 <= SLA_MAX_P95_MS,
                "p99_under_1200ms": p99 <= SLA_MAX_P99_MS,
                "error_rate_under_1pct": error_rate <= SLA_MAX_ERROR_RATE_PCT,
                "overall_passed": passed_sla
            }
        }

        status_tag = "[PASS]" if passed_sla else "[FAIL SLA]"
        self.log(f"     {status_tag} RPS: {result['throughput_rps']} | p50: {p50:.1f}ms | p95: {p95:.1f}ms | p99: {p99:.1f}ms | Err: {error_rate:.1f}%")
        return result

    def test_etag_revalidation(self):
        self.log("  -> Testing: HTTP ETag 304 Revalidation...")
        # Step 1: Initial request to get ETag
        lat1, status1, err1, etag = self.execute_request("GET", "/products?page=0&size=10")
        if not etag:
            self.log("     [!] Warning: No ETag returned from server on /products")
            return {"etag_supported": False}

        # Step 2: Conditional request with If-None-Match
        lat2, status2, err2, _ = self.execute_request(
            "GET",
            "/products?page=0&size=10",
            headers={"If-None-Match": etag}
        )
        is_304 = status2 == 304
        self.log(f"     [Result] ETag: {etag} | Status with If-None-Match: {status2} (304: {is_304}) | Latency: {lat2:.1f}ms")
        return {
            "etag": etag,
            "conditional_status": status2,
            "is_304": is_304,
            "revalidation_latency_ms": round(lat2, 2)
        }

    def run_full_suite(self, concurrency_levels=[5, 15]):
        self.discover_fixtures()
        self.warmup(10)

        all_results = []
        scenarios = [
            ("Public Active Products Catalog", "GET", "/products?page=0&size=12", None),
            ("Categories Hierarchy Listing", "GET", "/categories", None),
            ("Training Courses Catalog", "GET", "/training/courses", None),
            ("Trigram Search for 'mushroom'", "GET", "/products/search?q=mushroom&page=0&size=10", None),
            ("Trigram Search for 'oyster'", "GET", "/products/search?q=oyster&page=0&size=10", None),
        ]

        if self.sample_product_id:
            scenarios.append(("Product Detail by ID", "GET", f"/products/{self.sample_product_id}", None))

        for name, method, endpoint, body in scenarios:
            for c in concurrency_levels:
                reqs = max(c * 10, 50)
                res = self.run_scenario(name, method, endpoint, None, body, concurrency=c, total_requests=reqs)
                all_results.append(res)

        etag_res = self.test_etag_revalidation()

        overall_pass = all(r["sla_check"]["overall_passed"] for r in all_results)
        summary = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "base_url": self.base_url,
            "overall_status": "PASSED" if overall_pass else "FAILED",
            "sla_thresholds": {
                "max_p95_ms": SLA_MAX_P95_MS,
                "max_p99_ms": SLA_MAX_P99_MS,
                "max_error_rate_pct": SLA_MAX_ERROR_RATE_PCT,
            },
            "etag_verification": etag_res,
            "results": all_results
        }
        return summary


def main():
    parser = argparse.ArgumentParser(description="Sporekart Automated Performance Benchmark")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help="Base API URL")
    parser.add_argument("--concurrency", nargs="+", type=int, default=[5, 15], help="Concurrency levels to test")
    parser.add_argument("--output", default=None, help="Path to write JSON results")
    args = parser.parse_args()

    print("================================================================")
    print("    SPOREKART AUTOMATED LOAD TESTING & BENCHMARK HARNESS")
    print(f"    Target: {args.url}")
    print(f"    SLA Gates: p95 < {SLA_MAX_P95_MS}ms | p99 < {SLA_MAX_P99_MS}ms | Error < {SLA_MAX_ERROR_RATE_PCT}%")
    print("================================================================")

    runner = AutomatedBenchmarkRunner(base_url=args.url)
    summary = runner.run_full_suite(concurrency_levels=args.concurrency)

    print("\n----------------------------------------------------------------")
    print(f"OVERALL BENCHMARK RESULT: {summary['overall_status']}")
    print("----------------------------------------------------------------")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        print(f"[*] Benchmark report written to {args.output}")

    if summary["overall_status"] != "PASSED":
        print("[!] One or more SLA quality gates failed.")
        sys.exit(1)
    else:
        print("[+] All SLA quality gates passed successfully.")
        sys.exit(0)


if __name__ == "__main__":
    main()
