# PRR-13: Independent Challenge Review — Sporekart

**Date:** October 9, 2026  
**Review Board:** Independent Principal Reviewer  
**Target Repository:** `f:\sporekart-v1\sporekart-final`  

---

## 1. Challenge Questions & Empirical Findings

1. **Which important assumptions have not been verified?**
   - *Finding:* Production SMTP credentials and real Twilio API keys are unverified in live staging (they run in fallback log mode when `USE_REAL_SMTP=false` and `USE_REAL_TWILIO_SMS=false`). Production credentials must be tested in staging.
2. **Which features appear complete in UI but have backend gaps?**
   - *Finding:* Order lookup (`GET /api/v1/orders/{id}`) appears complete in UI, but backend permits unauthenticated guest retrieval without verifying user ownership (`DEF-SEC-01`).
3. **Which database failures would remain undetected?**
   - *Finding:* If a deployment runs via Supabase CLI, missing migration `V31` will cause runtime SQL errors when sending SMS notifications (`DEF-DB-01`).
4. **Which operations could cause financial inconsistency?**
   - *Finding:* Wallet balances lack DB-level `CHECK (available_balance >= 0)` constraint (`DEF-DB-02`). Idempotency is enforced on transaction records, but DB-level non-negative constraint is essential for financial safety.

---

## 2. Validation Audit Summary

- Confirmed that pessimistic locks (`PessimisticWrite`) on inventory reservation and training batch slots prevent overbooking under load.
- Confirmed that Razorpay payment webhooks validate HMAC-SHA256 signatures before committing order state changes.
- Re-verified that zero code changes have been committed during initial review phases.
