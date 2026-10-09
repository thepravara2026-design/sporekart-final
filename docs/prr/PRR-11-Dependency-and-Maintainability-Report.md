# PRR-11: Dependency & Maintainability Review — Sporekart

**Date:** October 9, 2026  
**Review Board:** Lead Maintainability & Release Specialist  
**Target Repository:** `f:\sporekart-v1\sporekart-final`  

---

## 1. Key Dependency Versions & Compliance

| Layer | Package Name | Version | License | Status / Maintainability Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | `org.springframework.boot` | `3.3.3` | Apache 2.0 | **Current & Supported** |
| **Backend** | `io.jsonwebtoken:jjwt-api` | `0.12.6` | Apache 2.0 | **Current** |
| **Backend** | `com.razorpay:razorpay-java` | `1.4.6` | MIT | **Current** |
| **Backend** | `com.tngtech.archunit:archunit-junit5` | `1.3.0` | Apache 2.0 | **Current** |
| **Frontend** | `react` / `react-dom` | `18.3.1` | MIT | **Current** |
| **Frontend** | `react-router-dom` | `6.26.1` | MIT | **Current** (Deprecation warnings for v7 flags) |
| **Frontend** | `tailwindcss` | `3.4.10` | MIT | **Current** |
| **Frontend** | `@supabase/supabase-js` | `2.117.3` | MIT | **Current** |
| **Frontend** | `eslint` | **MISSING** | MIT | **FAIL**: Script defined in package.json but package missing in devDependencies |

---

## 2. Lockfile & Build Reproducibility Audit

- **Frontend Lockfile (`package-lock.json`):** Present and committed (166 KB).
- **Backend Build (`pom.xml`):** Maven central resolution clean. All plugin versions explicitly pinned (`maven-compiler-plugin:3.13.0`, `jacoco-maven-plugin:0.8.12`).
- **Required Action:** Add `"eslint": "^8.57.0"` and `"eslint-plugin-react": "^7.35.0"` to `frontend/package.json` devDependencies.
