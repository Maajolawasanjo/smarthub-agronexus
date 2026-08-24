# SmartHub AgroChain — Complete Forensic Audit Report

*Document Baseline: Forensic Validation Phase*
*Scope: Complete Repository Inspection (`Maajolawasanjo/smarthub-agronexus`)*
*Rule: 0 Code Changes Executed. Forensic Evidence Only.*

---

## 1. Executive Summary

SmartHub AgroChain (AgroNexus) possesses a genuine, modern Next.js 16 (App Router), PostgreSQL, and Prisma ORM engineering foundation with custom JWT session management, transactional wallet operations, and Flutterwave API integration. 

However, forensic inspection confirms **significant security vulnerabilities, architectural contradictions, and prototype remnants**:
- **Critical Security Flaws**: Public registration self-assignment of `ADMIN` privilege, hardcoded test credentials in `/api/auth/login`, hardcoded JWT fallback secret in `src/lib/session.ts`, unauthenticated active-farmer fallback selection in produce creation, and stubbed webhook signature validation (`signatureHeader.length > 10`).
- **Accounting & Ledger Model**: The financial engine is a **single-entry transactional wallet ledger** with atomic balance mutations, NOT a true double-entry accounting system with balanced debit/credit journal postings.
- **Payment & Order Disconnect**: Flutterwave checkout webhooks execute generic wallet deposits rather than binding to pending order payment states and locking escrow for specific checkouts.
- **In-Memory & Prototype Remnants**: Admin UIs (Users, Settings, Analytics, Notifications) manipulate local React state or fallback to hardcoded mock arrays (`initialUsers`, `MOCK_NOTIFICATIONS`). The notification outbox is an in-memory Node process queue (`OutboxItem[]`).

---

## 2. Repository Architecture

- **Frontend & App Router**: Next.js 16.1.2, React 19.2.3, TypeScript 5, Tailwind CSS v4, Framer Motion.
- **ORM & Database**: Prisma 6.19.3 configured against PostgreSQL (`src/generated/prisma`).
- **Auth Engine**: Custom HMAC SHA-256 JWT sessions stored in HTTP-only `smarthub_session` cookies.
- **Testing Engine**: Vitest 4.1.10 (41 tests across 13 test files, 100% passing).
- **Execution Branch**: `remediation/baseline-hardening`.

---

## 3. Authentication & RBAC Audit

### Special Accounting & Role Check
The permissions file `src/lib/permissions.ts` defines 8 enterprise roles (`SUPER_ADMIN`, `COMPLIANCE_OFFICER`, `FINANCE_OFFICER`, etc.), but the Prisma schema (`prisma/schema.prisma`) defines only 3 roles: `ADMIN`, `FARMER`, `BUYER`. This architectural drift creates false security assumptions.

### Finding: SEC-001 (P0) — Hardcoded JWT Fallback Secret
- **Evidence**: `src/lib/session.ts:4`
  ```typescript
  const JWT_SECRET = process.env.JWT_SECRET || "smarthub-agrochain-production-secret-key-2026";
  ```
- **Affected Files**: `src/lib/session.ts`
- **Actual Behaviour**: If `JWT_SECRET` is missing in production, session tokens are signed with a publicly readable fallback string.
- **Expected Behaviour**: App fails startup if `JWT_SECRET` is missing.
- **Risk**: Total token forgery and session hijacking.
- **Recommended Fix**: Throw runtime error on startup if `process.env.JWT_SECRET` is missing.
- **Dependencies**: None.

### Finding: SEC-002 (P0) — Hardcoded Test Credentials in Login API
- **Evidence**: `src/app/api/auth/login/route.ts:50-115`
  ```typescript
  if (normalizedEmail === "maajolawasanjo@gmail.com" && password === "AdminPassword123!") { ... }
  else if (normalizedEmail === "admin@smarthubagro.com" && ...) { ... }
  ```
- **Affected Files**: `src/app/api/auth/login/route.ts`
- **Actual Behaviour**: Login endpoint auto-upserts users with predetermined passwords when database queries return null.
- **Expected Behaviour**: Authenticate exclusively against existing hashed passwords in PostgreSQL.
- **Risk**: Unauthorized credential exposure and account backdoors.
- **Recommended Fix**: Strip fallback upsert checks from POST handler.
- **Dependencies**: None.

### Finding: SEC-003 (P0) — Public Self-Assignment of Privilege
- **Evidence**: `src/app/api/auth/register/route.ts:66`
  ```typescript
  const targetRole = requestedRole === "FARMER" ? "FARMER" : requestedRole === "ADMIN" ? "ADMIN" : "BUYER";
  ```
- **Affected Files**: `src/app/api/auth/register/route.ts`
- **Actual Behaviour**: Any public POST request specifying `role: "ADMIN"` is created as an Administrator.
- **Expected Behaviour**: Public registration defaults strictly to `BUYER` or `FARMER`.
- **Risk**: Complete system administrative takeover.
- **Recommended Fix**: Ignore `role === "ADMIN"` in public registration handler.
- **Dependencies**: None.

---

## 4. Marketplace Audit

### Finding: MKT-001 (P1) — Unverified Farmer Listing Publication
- **Evidence**: `src/app/api/products/route.ts:72-85`
  ```typescript
  whereClause.isAvailable = true;
  // Does NOT check farmerProfile.verificationStatus === "APPROVED"
  ```
- **Affected Files**: `src/app/api/products/route.ts`
- **Actual Behaviour**: Unverified or rejected farmers can list produce on the public marketplace.
- **Expected Behaviour**: Marketplace queries include `farmerProfile: { verificationStatus: "APPROVED" }`.
- **Risk**: Fraudulent listings from unverified actors.
- **Recommended Fix**: Enforce `APPROVED` verification status on public GET queries.
- **Dependencies**: KYC module.

---

## 5. Inventory Audit

### Concurrency & Reservation Analysis
Inventory is stored in the `Inventory` model (`productId`, `availableQty`, `reservedQty`).
In `src/app/api/orders/route.ts:109-115`, stock is decremented inside `prisma.$transaction(async (tx) => ...)`.
However, standard Prisma interactive transactions operate under standard Read Committed isolation without explicit row locks. Under high concurrency, two parallel requests can read the same `availableQty` before either decrements it, causing negative inventory / overselling.

### Finding: INV-001 (P1) — Concurrency Inventory Race Condition
- **Evidence**: `src/app/api/orders/route.ts:89-115`
- **Affected Files**: `src/app/api/orders/route.ts`
- **Actual Behaviour**: Stock check and decrement occur without exclusive row locks.
- **Expected Behaviour**: Atomic conditional updates (`UPDATE "Inventory" SET "availableQty" = "availableQty" - X WHERE "productId" = Y AND "availableQty" >= X`).
- **Risk**: Overselling out-of-stock items.
- **Recommended Fix**: Enforce atomic conditional SQL updates or pessimistic locking.
- **Dependencies**: Orders API.

---

## 6. Orders Audit

### State Separation Check
The system properly defines separate status enums in Prisma:
- `Order.status`: `OrderStatus` (`PENDING`, `CONFIRMED`, `PROCESSING`, `READY_FOR_PICKUP`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`, `CANCELLED`)
- `Payment.paymentStatus`: `PaymentStatus` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`)
- `Delivery.deliveryStatus`: `DeliveryStatus` (`PENDING`, `PICKED_UP`, `IN_TRANSIT`, `DELIVERED`)
- `Dispute.status`: `DisputeStatus` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`)

However, there is no domain state-machine centralizer (`transitionOrder()`), allowing arbitrary API routes to mutate `order.status` directly.

---

## 7. Payments & Gateway Integration Audit

### Flutterwave Protocol Verification
- **API Version**: Flutterwave v3 API (`https://api.flutterwave.com/v3/`).
- **Webhook Endpoint**: `src/app/api/payments/flutterwave/webhook/route.ts`.
- **Header Verification**: Uses `verif-hash` header comparison against `process.env.FLUTTERWAVE_SECRET_HASH`. This follows Flutterwave v3 protocol.
- **Transaction Verification**: Performs secondary GET `https://api.flutterwave.com/v3/transactions/:id/verify`.
- **Disconnection Finding (PAY-004)**: When `charge.completed` succeeds, line 74 executes `WalletService.executeDeposit(userId, amount, txRef)` instead of updating a pending Order's status to `PAID` and locking escrow.

### Finding: PAY-001 (P0) — Weak Generic Webhook Signature Validation
- **Evidence**: `src/lib/settlement.ts:88`
  ```typescript
  export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
    if (!signatureHeader || !rawBody) return false;
    return signatureHeader.length > 10;
  }
  ```
- **Affected Files**: `src/lib/settlement.ts`
- **Actual Behaviour**: Signature check returns true for any header longer than 10 characters.
- **Expected Behaviour**: Cryptographic HMAC SHA-256 verification against secret key.
- **Risk**: Forged webhook injection.
- **Recommended Fix**: Implement `crypto.createHmac("sha256", secret)` signature matching.
- **Dependencies**: Payment webhooks.

### Finding: PAY-003 (P0) — Conflicting Platform Fee Logic
- **Evidence**: `src/lib/config.ts:22` (5%), `src/lib/settlement.ts:27` (2.5%), `src/services/wallet.service.ts:569` (reads `config.fees.platformFeeRate`).
- **Affected Files**: `src/lib/config.ts`, `src/lib/settlement.ts`, `src/services/wallet.service.ts`.
- **Actual Behaviour**: Fee rates vary between 2.5% and 5% depending on which module is invoked.
- **Expected Behaviour**: Unified single source of truth for platform commission.
- **Risk**: Financial calculation errors and settlement disputes.
- **Recommended Fix**: Centralize all fee logic to reference `config.fees.platformFeeRate`.
- **Dependencies**: Settlement & Wallet services.

---

## 8. Wallet Audit

### Important Accounting Check: Single-Entry vs Double-Entry
The system's financial architecture is **NOT a true double-entry ledger**. It does not maintain debit/credit posting pairs across separate nominal accounts (e.g. Asset Cash Account vs Liability Escrow Account).
Instead, it is a **single-entry transactional wallet ledger**:
- `Wallet` model stores cached scalar balances (`balance`, `escrow`, `pendingWithdrawal`, `frozen`).
- `WalletTransaction` logs atomic ledger events (`DEPOSIT`, `WITHDRAWAL`, `ESCROW_LOCK`, `ESCROW_RELEASE`, `REFUND`).
- Balance updates are executed atomically inside `prisma.$transaction`.

---

## 9. Escrow Audit

### Workflow Trace
- **Lock**: `WalletService.executeWalletPayment()` debits `balance` and increments `escrow` atomically, recording `ESCROW_LOCK`.
- **Release**: `WalletService.executeEscrowRelease()` decrements buyer `escrow`, credits farmer `balance` minus platform fee, sets order status to `COMPLETED`, recording `ESCROW_RELEASE`.
- **Break Point**: Webhook payments via Flutterwave direct checkout do not automatically trigger `executeWalletPayment()` or escrow locking for orders.

---

## 10. Withdrawals Audit

### Workflow Trace
- **State Machine**: `REQUESTED` → `VALIDATED` → `SUBMITTED_TO_FLUTTERWAVE` → `PROCESSING` → `SUCCESS` (or `REVERSED`).
- **Integration**: POST `https://api.flutterwave.com/v3/transfers`.
- **Webhook**: Handled by `WalletService.handleTransferWebhook()` via `transfer.completed` webhook event.
- **Safety**: Reverses funds (`pendingWithdrawal` decrement, `balance` increment) if transfer fails.

---

## 11. Delivery & Logistics Audit

### Finding: DEL-001 (P0) — Non-Persistent POD & Simulated GPS
- **Evidence**: `src/app/api/fulfillment/[orderId]/route.ts:45-80`
- **Affected Files**: `src/app/api/fulfillment/[orderId]/route.ts`
- **Actual Behaviour**: POD submission updates `deliveryStatus` to `DELIVERED`, but does not save driver photo, receiver signature, or GPS coordinates to the database. Defaults GPS to Lagos `6.5244, 3.3792` when omitted.
- **Expected Behaviour**: Persist evidence bundle to PostgreSQL and authorize driver identity.
- **Risk**: Lack of legally defensible delivery proof.
- **Recommended Fix**: Add POD evidence fields to `Delivery` model or persistent delivery evidence table.
- **Dependencies**: Prisma schema, Delivery service.

---

## 12. KYC & Verifications Audit

- **Database Model**: `Verification` (`farmerProfileId`, `documentType`, `documentUrl`, `reviewedById`, `remarks`).
- **State Flow**: `PENDING` → `APPROVED` / `REJECTED`.
- **Gap**: Verification document images are stored as raw URL strings without S3/Cloudinary object storage upload integration.

---

## 13. Notifications Audit

### Finding: NOT-001 (P0) — Mock Adapters & In-Memory Outbox
- **Evidence**: `src/lib/notifications/adapters.ts:38`, `src/lib/notifications/outbox.ts:15`
  ```typescript
  private queue: OutboxItem[] = []; // In-memory process array
  ```
- **Affected Files**: `src/lib/notifications/adapters.ts`, `src/lib/notifications/outbox.ts`
- **Actual Behaviour**: Email (Resend) and SMS (Termii) adapters log to `console.log` and return success. Outbox queue is lost on server restart.
- **Expected Behaviour**: Production HTTP dispatch to Resend/Termii and database-backed outbox queue.
- **Risk**: Undelivered notifications and message loss on restart.
- **Recommended Fix**: Implement DB outbox table and active provider HTTP calls.
- **Dependencies**: External notification credentials.

---

## 14. Admin Portal Audit

### Finding: ADM-001 (P1) — Prototype Admin Users Management
- **Evidence**: `src/app/admin/users/page.tsx:7`
  ```typescript
  const initialUsers = [...]; // Static array
  ```
- **Affected Files**: `src/app/admin/users/page.tsx`
- **Actual Behaviour**: User list falls back to `initialUsers`. Add/Suspend actions mutate local React state rather than persisting to PostgreSQL.
- **Expected Behaviour**: Connect UI directly to `/api/admin/users` endpoints.
- **Risk**: Admin operations do not affect real user database records.
- **Recommended Fix**: Wire React handlers to call backend admin endpoints.
- **Dependencies**: Admin API endpoints.

---

## 15. Audit Logging Audit

### Finding: AUD-001 (P1) — Synthesized Audit Log View
- **Evidence**: `src/app/api/admin/audit-logs/route.ts:25-60`
- **Affected Files**: `src/app/api/admin/audit-logs/route.ts`
- **Actual Behaviour**: Audit logs are generated on the fly by formatting recent `Verification`, `Dispute`, and `Order` rows into synthetic log strings (`AUD-KYC-...`, `AUD-DISP-...`).
- **Expected Behaviour**: Persistent, append-only `AuditLog` table capturing actor, action, target resource, timestamp, and metadata.
- **Risk**: Audit records can be altered or missing for non-entity actions.
- **Recommended Fix**: Add `AuditLog` Prisma model and audit logging middleware.
- **Dependencies**: Prisma schema.

---

## 16. Mock & Fallback Data Sweep

| Code Location | Category | Finding / Pattern | Risk Level |
|---|---|---|---|
| `src/app/api/auth/login/route.ts:50` | `PROTOTYPE MOCK` | Hardcoded email/pass credentials & upserts | **CRITICAL** |
| `src/lib/session.ts:4` | `PRODUCTION RISK` | Hardcoded JWT fallback secret | **CRITICAL** |
| `src/lib/notifications/adapters.ts:38` | `PROTOTYPE MOCK` | `mock-resend-key`, `mock-termii-key` | **HIGH** |
| `src/app/admin/users/page.tsx:7` | `UI PLACEHOLDER` | `initialUsers` array | **HIGH** |
| `src/app/admin/settings/page.tsx:22` | `UI PLACEHOLDER` | `initialAdmins` array | **MEDIUM** |
| `src/app/admin/notifications/page.tsx:19` | `UI PLACEHOLDER` | `initialNotifications` array | **MEDIUM** |
| `src/app/admin/content/page.tsx:7` | `UI PLACEHOLDER` | `initialArticles` array | **MEDIUM** |
| `src/app/api/orders/validate/route.ts:59` | `FALLBACK` | Mock fallback item if product missing in DB | **MEDIUM** |
| `prisma/seed.ts` | `SAFE DEVELOPMENT DATA` | Database seeder for dev environment | **NONE** |
| `__tests__/fixtures` | `TEST FIXTURE` | Unit test mock data | **NONE** |

---

## 17. Routing Audit

| Path | Required Role | Auth Enforcement | Role Enforcement | Ownership Check | Status |
|---|---|---|---|---|---|
| `/` | Public | None | None | N/A | `VERIFIED` |
| `/products` | Public | None | None | N/A | `VERIFIED` |
| `/login` | Public | None | None | N/A | `VERIFIED` |
| `/signup` | Public | None | None | N/A | `VERIFIED` |
| `/dashboard/*` | `BUYER` | Session Cookie | Role Middleware | Scoped by `buyerId` | `IMPLEMENTED` |
| `/farmer/*` | `FARMER` | Session Cookie | Role Middleware | Scoped by `farmerProfileId` | `IMPLEMENTED` |
| `/admin/*` | `ADMIN` | Session Cookie | Role Middleware | System-wide | `PARTIAL` (UI mocks) |
| `/api/auth/*` | Mixed | Endpoint-level | Endpoint-level | N/A | `PARTIAL` (SEC-002/003) |
| `/api/wallet/*` | Authenticated | `getSession()` | Role checks | Scoped by `session.userId` | `VERIFIED` |
| `/api/farmer/*` | `FARMER` | `getSession()` | Checks `FARMER` role | Scoped by `farmerProfileId` | `IMPLEMENTED` |
| `/api/admin/*` | `ADMIN` | `getSession()` | Checks `ADMIN` role | System-wide | `PARTIAL` |

---

## 18. Database Integrity Audit

| Prisma Model | Ownership Field | Unique Constraints | Financial / Ledger Role | Integrity Assessment |
|---|---|---|---|---|
| `User` | `id` | `email`, `phoneNumber` | Account Identity | Solid. Password hashed via bcrypt. |
| `FarmerProfile` | `userId` | `userId` | Seller Identity | Missing verification enforcement on products. |
| `BuyerProfile` | `userId` | `userId` | Buyer Identity | Clean relation. |
| `Verification` | `farmerProfileId` | `farmerProfileId` | Compliance | Missing document storage upload integration. |
| `Product` | `farmerProfileId` | `id` | Catalog | Clean indexes on `farmerProfileId`, `categoryId`. |
| `Inventory` | `productId` | `productId` | Stock Ledger | Needs atomic conditional updates for concurrency. |
| `Order` | `buyerId` | `orderNumber` | Commercial Contract | State machine clean; needs centralizer helper. |
| `OrderItem` | `orderId` | `id` | Line Items | Cascades on order deletion. |
| `Payment` | `orderId` | `orderId`, `transactionRef` | Gateway Record | Clean relation to Order. |
| `Delivery` | `orderId` | `orderId` | Logistics | Lacks persistent POD evidence fields. |
| `Wallet` | `userId` | `userId` | Balance Ledger | Transactional atomic operations verified. |
| `WalletTransaction` | `walletId` | `reference` | Ledger Log | Idempotent by `reference` unique constraint. |
| `BankAccount` | `userId` | `id` | Payout Target | Clean user index. |
| `Dispute` | `userId`, `orderId` | `id` | Arbitrations | Clean relations to User and Order. |

---

## 19. Security Findings Summary

1. **`SEC-001` (P0)**: Hardcoded JWT fallback secret in `src/lib/session.ts`.
2. **`SEC-002` (P0)**: Hardcoded test credentials & upsert logic in `/api/auth/login`.
3. **`SEC-003` (P0)**: Public registration self-assignment of `ADMIN` role in `/api/auth/register`.
4. **`PAY-001` (P0)**: Broken generic webhook signature validation in `src/lib/settlement.ts`.

---

## 20. Financial Integrity Findings Summary

1. **`PAY-003` (P0)**: Platform fee rate contradiction across `config.ts` (5%), `settlement.ts` (2.5%), and service functions.
2. **`PAY-004` (P0)**: Flutterwave `charge.completed` webhook defaults to generic wallet deposit rather than order payment confirmation and escrow hold.
3. **`INV-001` (P1)**: Inventory decrement race condition under high checkout concurrency.
4. **Accounting Classification**: System is a single-entry transactional wallet ledger, not a double-entry accounting engine.

---

## 21. Missing Capabilities

1. Persistent Proof of Delivery (POD) evidence bundle storage (photos, signatures, verified GPS).
2. Database-backed outbox queue for resilient notification delivery.
3. Immutable append-only `AuditLog` table in Prisma schema.
4. Production S3 / Cloudinary integration for KYC document and product image uploads.

---

## 22. Confirmed Issues

- `SEC-001`: JWT fallback secret present.
- `SEC-002`: Hardcoded test credentials present in login API.
- `SEC-003`: Public role assignment of `ADMIN` enabled.
- `PAY-001`: Generic webhook signature check uses length test (`> 10`).
- `PAY-003`: Conflicting platform fee definitions.
- `DEL-001`: POD evidence is not persisted in database.
- `NOT-001`: Notification adapters are console mocks; outbox is in-memory array.
- `ADM-001`: Admin users page uses hardcoded `initialUsers` state array.

---

## 23. False Positives (Items Proved Working)

1. **Vitest Unit & Integration Suite**: 41 out of 41 tests pass cleanly across 13 test files.
2. **Wallet Balance & DTO Engine**: `WalletService.getWalletPageData()` and atomic transaction execution (`prisma.$transaction`) operate correctly and pass integration tests.
3. **Flutterwave API Client**: Payment initialization and transfer calls genuinely interact with Flutterwave v3 API (`https://api.flutterwave.com/v3/`).
4. **Flutterwave Webhook Header Signature**: `src/app/api/payments/flutterwave/webhook/route.ts` correctly validates `verif-hash` against `FLUTTERWAVE_SECRET_HASH`.

---

## 24. Recommended Remediation Order

### Phase 1 — Security Hardening (P0)
1. **`SEC-001`**: Remove JWT fallback secret; fail-closed on startup if `JWT_SECRET` missing.
2. **`SEC-002`**: Remove hardcoded test credentials and fallback user upserts from `/api/auth/login`.
3. **`SEC-003`**: Remove `ADMIN` role assignment from public `/api/auth/register`.
4. **`PAY-001`**: Implement cryptographic HMAC SHA-256 webhook signature verification in `src/lib/settlement.ts`.

### Phase 2 — Financial & Payment Hardening (P0 / P1)
5. **`PAY-003`**: Single source of truth for platform fee rate across configuration and services.
6. **`PAY-004`**: Link Flutterwave checkout webhooks directly to Order payment confirmation and escrow lock.
7. **`INV-001`**: Implement atomic conditional updates for inventory decrement during checkout.

### Phase 3 — Operations & Data Persistence (P1)
8. **`DEL-001`**: Extend Prisma schema for persistent POD evidence (photos, signatures, verified GPS).
9. **`NOT-001`**: Wire real Resend & Termii HTTP clients and replace in-memory outbox queue.
10. **`ADM-001`**: Connect `/admin/users` UI directly to Prisma DB admin API endpoints.
11. **`AUD-001`**: Add persistent append-only `AuditLog` model and logging helper.
