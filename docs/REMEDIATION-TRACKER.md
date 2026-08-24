# SmartHub AgroChain — Remediation & Production Hardening Tracker

| ID | Domain | Severity | Problem Summary | Remediation Required | Status |
|---|---|---:|---|---|---|
| **SEC-001** | Auth | **P0** | Hardcoded JWT fallback secret | Fail-closed validation on app startup when `JWT_SECRET` is missing | `PASSED (VERIFIED)` |
| **SEC-002** | Auth | **P0** | Hardcoded test credentials in login API | Remove hardcoded test credentials and fallback user upserts in `/api/auth/login` | `PASSED (VERIFIED)` |
| **SEC-003** | Auth | **P0** | Public self-assignment of `ADMIN` role | Strip `role` input from public `/api/auth/register`; default strictly to `BUYER` | `PASSED (VERIFIED)` |
| **SEC-004** | Auth / Resource | **P0** | Unauthenticated farmer fallback in produce creation | Enforce authenticated session; eliminate `findFirst()` active farmer fallback | `PASSED (VERIFIED)` |
| **PAY-001** | Payments | **P0** | Weak webhook verification (`length > 10`) | Implement cryptographic HMAC SHA-256 webhook signature verification | `PASSED (VERIFIED)` |
| **PAY-002** | Payments | **P0** | Simulated card payment success | Eliminate simulated checkout success without live gateway callback verification | `PASSED (VERIFIED)` |
| **PAY-003** | Payments | **P0** | Single source of truth for platform fee | Unify fee (5% vs 2.5%) in single configuration service; replace in-memory state | `PASSED (VERIFIED)` |
| **PAY-004** | Payments | **P0** | Direct Flutterwave to Order lifecycle | Connect gateway webhook callbacks directly to order confirmation and escrow lock | `PASSED (VERIFIED)` |
| **DEL-001** | Delivery | **P0** | Non-persistent POD and hardcoded Lagos GPS | Persist POD evidence (photos, signatures, GPS) into DB; restrict driver actor | `PASSED (VERIFIED)` |
| **NOT-001** | Notifications | **P0** | Mock notification transport & in-memory outbox | Connect real provider adapters and replace in-memory array with DB outbox | `PASSED (VERIFIED)` |
| **ADM-001** | Admin UI | **P1** | Hardcoded mock user management (`initialUsers`) | Connect `/admin/users` UI directly to Prisma DB endpoints for fetch/suspend/activate | `PASSED (VERIFIED)` |
| **ADM-002** | Admin UI | **P1** | Hardcoded analytics charts & config state | Wire admin analytics and configuration endpoints directly to DB aggregations | `PASSED (VERIFIED)` |
| **MKT-001** | Marketplace | **P1** | Unverified farmer product publication | Enforce `farmerProfile.verificationStatus === APPROVED` on public marketplace | `PASSED (VERIFIED)` |
| **INV-001** | Inventory | **P1** | Concurrency race condition on checkout | Implement transactional inventory reservation (`SELECT FOR UPDATE` pattern) | `PASSED (VERIFIED)` |
| **AUD-001** | Governance | **P1** | Synthesized audit logs | Replace dynamic audit log view with persistent append-only event log model | `PASSED (VERIFIED)` |
