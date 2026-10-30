# Sporekart Performance & Load Testing Suite (Phase 2)

This directory contains automated, reproducible load testing and concurrency stress testing suites for Sporekart.

## Test Suites Overview

| File | Framework | Purpose | SLA / Threshold Criteria |
| :--- | :--- | :--- | :--- |
| **`k6-performance-suite.js`** | Grafana k6 | Multi-stage user browsing, Caffeine cached catalog & courses, trigram GIN search, cart operations, HTTP ETag 304 revalidation. | `p(95) < 500ms`, `p(99) < 1200ms`, `error_rate < 1.0%`, `catalog_duration p(95) < 400ms`. |
| **`k6-concurrency-race.js`** | Grafana k6 | High-concurrency race condition testing for course batch capacity and inventory locking. | Graceful business rejection (`400`/`409`), zero overselling, zero database deadlocks (`500`). |
| **`run-automated-benchmark.py`** | Python 3 (stdlib) | Zero-dependency standalone benchmark runner for local development and CI/CD quality gate enforcement. | `p(95) < 500ms`, `p(99) < 1200ms`, `error_rate < 1.0%`. Exits with code `0` on success, `1` on violation. |

---

## 1. Running with Grafana k6

### Installation
- **macOS:** `brew install k6`
- **Windows (Chocolatey):** `choco install k6`
- **Windows (winget):** `winget install k6`
- **Linux:** `sudo apt install k6` or via official apt repository

### Execute Performance Suite
```bash
# Against local backend
k6 run tests/load/k6-performance-suite.js

# Against staging or custom URL
k6 run -e BASE_URL=https://staging.sporekart.in/api/v1 tests/load/k6-performance-suite.js
```

### Execute Concurrency Race Test
```bash
k6 run tests/load/k6-concurrency-race.js
```

### Run with Docker (No Local Installation Required)
```bash
docker run --rm -i grafana/k6 run - <tests/load/k6-performance-suite.js
```

---

## 2. Running Standalone Benchmark (Zero Dependencies)

The Python runner requires only standard Python 3.8+ with no extra packages (`pip install` not required):

```bash
# Basic run against local server
python tests/load/run-automated-benchmark.py

# Custom concurrency levels and export JSON report
python tests/load/run-automated-benchmark.py --url http://localhost:8080/api/v1 --concurrency 5 15 30 --output benchmark-report.json
```

---

## 3. GitHub Actions CI/CD Quality Gate Example

Add the following step to your `.github/workflows/ci.yml` or a dedicated `.github/workflows/performance.yml`:

```yaml
name: Performance Quality Gate
on:
  pull_request:
    branches: [main, dev]

jobs:
  performance-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Start Sporekart Backend
        run: |
          cd backend
          mvn spring-boot:start -Dspring-boot.run.profiles=test &
          sleep 20

      - name: Run Automated Performance Quality Gate
        run: |
          python3 tests/load/run-automated-benchmark.py --url http://localhost:8080/api/v1 --output performance-results.json
```
