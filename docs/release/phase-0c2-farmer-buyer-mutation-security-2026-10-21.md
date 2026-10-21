# Phase 0-C2 — Farmer & Buyer Mutation Security Implementation

**Status:** Implemented in draft PR #8; CI and staging release gates apply.  
**Code baseline:** Phase 0-B + Phase 0-C patches, not merged into live Production.  
**Scope:** Cookie-authenticated Farmer/Buyer write endpoints, account-password rotation, frontend password-change UX, regression tests.  
**Exclusions:** Existing ledger/escrow settlement algorithms, direct bank transfer invocation, payment provider callbacks, cron jobs, public GET/lookup endpoints, destructive migrations.

## High-severity defect resolved in branch

`POST /api/user/password` previously used the unverified `userId` cookie (or the hardcoded `usr_demo_buyer` fallback) as target identity, compared an obsolete PBKDF2 hash or plaintext, and replaced the stored credential with PBKDF2 incompatible with the actual bcrypt-login flow.

The replacement:
- Requires `getSession()` with current revocable PostgreSQL User/Session binding (depends on PR #6);
- Requires a trusted same-origin browser request (depends on PR #7);
- Resolves user ID exclusively from the authenticated session, ignoring arbitrary cookies/request body target IDs;
- Verifies bcrypt current hash, hashes replacement with bcrypt cost 12, rejects unchanged/short/greater-than-72-byte passwords;
- Uses a single Prisma transaction with password compare-and-set `updateMany` then `Session.updateMany(revokedAt)`; a failed change does not revoke sessions;
- Buyer and Farmer settings redirect to `/login` on success, since every realm session is now invalidated.

**Caveat:** The old PBKDF2 password route had historically persisted hashes unusable by bcrypt-based login; resetting those pre-existing accounts would require a separate verified recovery process, not untrusted legacy hash acceptance.

## Browser mutation scope guarded

| Route | Methods | Business owner/validation |
|---|---|---|
| `/api/user/password` | POST | Session user, bcrypt, atomic revocation |
| `/api/user/profile` | PATCH | User session, existing profile authorizations |
| `/api/user/addresses` | POST, PATCH, DELETE | User session and owned Buyer addresses |
| `/api/user/preferences` | PUT | User session |
| `/api/user/notification-preferences` | PATCH | User session |
| `/api/wallet/bank-accounts` | POST, PATCH, DELETE | User session and owned bank record |
| `/api/wallet/disputes` | POST | User session and service authorization |
| `/api/notifications` | PUT | Realm-scoped notification user |
| `/api/farmer/produce` | POST | Farmer/Admin session, real profile and product rules |
| `/api/farmer/produce/[id]/status` | PATCH | Farmer product owner or admin |
| `/api/farmer/produce/bulk` | POST | Farmer profile and product-ownership check |
| `/api/farmer/sub-orders/[id]` | PATCH | Seller order's Farmer owner |
| `/api/kyc/upload` | POST | Farmer session/user, verification record |
| `/api/products/[id]` | PATCH, DELETE | Farmer owner or Admin |
| `/api/reviews` | POST | Buyer session/verified purchase |
| `/api/orders` | POST | Buyer session, existing checkout invariants |
| `/api/orders/[id]` | PUT | Buyer/Farmer/Admin permission rules as defined in route |
| `/api/orders/[id]/cancel` | POST | Order buyer/Admin, refund logic unchanged |
| `/api/orders/[id]/release-escrow` | POST | Order buyer/Admin, escrow logic unchanged |
| `/api/orders/[id]/dispute` | POST | Buyer/related party authorized order |
| `/api/disputes` | POST | Authorized buyer/farmer/admin |
| `/api/deliveries/[id]/pod` | POST | Server-side actor/delivery ownership |
| `/api/fulfillment/[orderId]` | PUT | Authenticated fulfillment role |

**Invariant:** The CSRF guard never replaces an authorization, verification status, ownership or financial state check. Signed Origin/Referer is only a browser cross-origin request barrier, not proof of user identity.

## Route-level regression tests

- `__tests__/security/p0c2-password-change.test.ts`: anonymous/forged user ID, cross-origin, missing Origin, invalid bcrypt password, input length/reuse, correct bcrypt and atomic session revoke, concurrent-update conflict.
- `__tests__/security/p0c2-role-mutation-guards.test.ts`: Farmer produce, Buyer checkout, KYC upload, bank-account creation, product edit, review and origin-less checkout all reject before database calls; authorized same-origin with missing session rejects.
- Pre-existing integration fixtures using legitimate browser POST/PUT were updated to specify the localhost Origin. Tests of cross-origin rejections remain unchanged.
- CI `p0c2-farmer-buyer-security` plus prior Phase 0-A/B/C gates and full Vitest/build must pass **on the final PR head**.
- Mocked route security tests do **not** prove production persistence; three-role browser E2E and staging DB fixtures remain a release blocker.

## CRITICAL follow-up: money-moving authorization (not addressed in this CSRF patch)

A final code-path review found the following direct money-moving entry points. They must be contained **before enabling payment operations or real-money escrow**:

- `POST /api/wallet/escrow` accepts any authenticated user session and a caller-provided `dbOrderId`, then calls `WalletService.executeEscrowRelease(session.userId, dbOrderId)`. In its current service implementation, the order's buyer is derived from the loaded order; the passed `session.userId` does **not** enforce ownership. Consequently, the route has no reliable order-owner authorization or financial eligibility check before release.
- `POST /api/payments/settlement/[orderId]` accepts any session whose role is ADMIN or BUYER and invokes `executeRefund(orderId, ...)` without verifying that a Buyer owns that specific order, or that the caller is authorized to perform a direct refund. A Buyer should submit a dispute/refund request; only the authorized financial workflow may execute an actual payout reversal.
- `POST /api/payments/flutterwave/initialize` reads a session but does not enforce its presence or order ownership before initializing payment for a provided order ID. Review authenticated intent ownership, transaction integrity and signed gateway callbacks together.

These are authorization/financial domain defects, **not merely CSRF omissions**. Adding an Origin header check alone cannot resolve them. Address in a dedicated, reviewed financial-security hotfix with tests proving other buyers cannot release/refund orders, invalid fulfillment/dispute/payment states reject, retries remain idempotent and money is reconciled. Do not move real funds during tests.

## Explicit exclusions / follow-up audit obligations

1. **Flutterwave initialize, verify, settlement, bank transfer callbacks:** Require distinct payment state-machine, authenticated buyer ownership, payment-intent idempotency, signed provider webhook and order-total checks. **Do not indiscriminately attach cookie browser CSRF checks to signed callbacks or server-to-server webhook handlers.** No payment enablement until Phase 5 financial gate.
2. **`/api/jobs/*` reconciliation and cron:** Use dedicated secret/signed service-to-service authentication rather than browser Origin.
3. **KYC evidence upload:** Still accepts user-supplied `documentUrl`. Phase 2 must use private owned asset storage with document verification before approval.
4. **Admin Product creation seller binding and Farmer availability DTO mismatch:** Phase 3 shared schema needed; the CSRF fix does not change these broken contracts.
5. **Buyer catalog/detail/checkout publication predicates; multiseller order states, escrow/ledger atomicity:** High-severity findings remain from cross-role audit; not waived by CSRF tests.
6. **Notification-preferences and Admin settings persistence:** Current settings may be process-memory only. Phase 6 must persist reliably.
7. **Existing account password recovery:** No unauthenticated reset route is introduced. Any emergency reset process needs verified identity and a one-use token.
8. **Production deployments:** Connected Vercel scope previously returned 403; merge, deployed commit, DNS aliases, and browser E2E must be verified by authorized operator.

**Release gate:** PR #6 (sessions) then #7 (admin CSRF) then #8 (this scoped Farmer/Buyer CSRF and password fix), with staging tests, migration baseline validation and deployment readiness. Do not merge into Production out of order.
