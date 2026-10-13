# 10 — Blocked & Untested Cases Report

## 1. Environment & Integration Boundaries

In adherence with the strict mandate of Section 2:
> *"Test environment: Development/staging only. Never use production data or live financial transactions. Mock OTP verification and payment processing only when the application is explicitly configured for development simulation. Clearly separate simulated payment-flow coverage from genuine payment-provider integration coverage."*

---

## 2. Integration Boundary Inventory

| Integration Feature | Operational Mode | Real Production Integration Tested? | Rationale & Safety Boundary | Audit Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Razorpay Live Banking Settlement** | Mock / Development Simulation | **No (By Design)** | Prevented live financial transfers, real credit card debits, or bank account charges in test environments. Tested complete server-side payment lifecycle via HMAC-SHA256 signature verification. | **EXPLICITLY SIMULATED** |
| **Shiprocket Production Carrier Pickup** | Development Simulation | **No (By Design)** | No live courier dispatches or physical warehouse pickups were triggered. The complete shipment state machine (AWB generation, tracking number creation, status transitions) was verified via database and API. | **EXPLICITLY SIMULATED** |
| **Google Production OAuth Consent** | Dev Bypass Mode | **No (By Design)** | Google OAuth consent screens in automated browser workers encounter rate limiting and CAPTCHA challenges. Tested using development OAuth token generation endpoint (`/auth/oauth/google`). | **EXPLICITLY SIMULATED** |
| **Transactional SMS Gateway (Fast2SMS / Twilio)** | Dev Log Mode | **No (By Design)** | Live SMS credits not consumed. SMS notification events were verified via backend log capture and database event dispatch records. | **EXPLICITLY SIMULATED** |

---

## 3. Explicitly Blocked Scenarios
- **Scenario Count**: 0.
- No application features were blocked due to unreachable local services; all core database, backend, and frontend instances were online, healthy, and accessible throughout the entire audit execution.

---

## 4. Untested Scenarios
- **Scenario Count**: 0.
- All 45 discovered functional scenarios across Customer, Trainee, Payment, Wallet, Ticketing, Notifications, and Admin Control Console were actively executed and analyzed.
