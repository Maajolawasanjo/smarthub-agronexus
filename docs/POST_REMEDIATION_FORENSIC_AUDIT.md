# SMART HUB AGROCHAIN: POST-REMEDIATION FORENSIC AUDIT REPORT
**Independent Second Verification of Marketplace Remediation Pass**
**Date:** September 12, 2026  
**Auditor:** Independent Lead Software Architect & Financial Systems Auditor  
**Audit Scope:** Full repository forensic inspection (`smarthub-agronexus`), focusing on Antigravity's remediation pass, financial invariants, commission reconciliation, test suite authenticity, and production readiness.

---

## EXECUTIVE SUMMARY & AUDIT VERDICT

### Formal Audit Verdict: **NOT READY FOR PRODUCTION**
While the remediation pass addressed surface-level bugs (syntax errors, missing imports, basic sub-order iteration, and initial negative balance clamping), a rigorous, independent forensic examination reveals that **the platform cannot be certified as production-ready**.

The remediation introduced or left unresolved several critical architectural and financial discrepancies:
1. **Severe Commission & VAT Schism**: Four competing commercial fee and tax models operate simultaneously across services, API routes, reconciliation, and reporting.
2. **Card Refund Semantic Inversion**: The card refund fallback turns failed gateway refunds into unbacked wallet store credit; furthermore, the test suite asserted that internal wallet balance *was* credited rather than proving isolation from internal wallet balances.
3. **Withdrawal Network Exception Black Hole**: If Flutterwave's transfer API throws a network timeout or connection reset, the transaction is neither retried nor rolled back; funds remain locked in `pendingWithdrawal` indefinitely.
4. **49% Tautological Test Suite**: Out of 146 passing tests, **71 tests (48.6%) are tautological mock closures** that test inline arrow functions and local variables rather than application code.
5. **Zero Persistence Layer Verification**: Exactly **0 of the 146 tests** run against a live or containerized PostgreSQL database. 100% of database interactions are mocked via `vi.spyOn` or `vi.mock`.
6. **ESLint Failure**: Standalone linting reveals **488 lint problems (306 errors, 182 warnings)** across the codebase.

---

## 1. DETAILED VERIFICATION MATRIX

| Audit Verification Area | Remediated Claim | Independent Forensic Finding | Verdict |
|---|---|---|---|
| **Multi-Vendor Escrow Settlement** | Fixed to partition per `SellerOrder` | Code iterates `SellerOrder` and settles per farmer, but uses `sellerOrder.totalAmount` (which includes freight) rather than commodity subtotal. | **PARTIALLY SOUND / FLAWED BASE** |
| **Commission & Tax Configuration** | 5% commission + 7.5% VAT on fee | **CRITICAL FAILURE**: 4 conflicting formulas exist across `settlement.ts`, `finance/route.ts`, `farmer/analytics/route.ts`, and `reconciliation.service.ts`. | **FAILED (P0 DEFECT)** |
| **Card Refund Accounting** | Clamped escrow deduction | Clamped in code, but fallback mints store credit on gateway absence, and tests assert wallet credit rather than testing card gateway refund isolation. | **FAILED (P0 DEFECT)** |
| **Withdrawal Gateway Guard** | Fails safely without key | Fails safely if key is missing in production, but **swallows network exceptions** during live fetch and traps user funds in `pendingWithdrawal`. | **FAILED (P1 DEFECT)** |
| **Test Suite Authenticity** | 146/146 tests passing | 71 of 146 tests (48.6%) test local inline functions/closures (`phase1`, `phase2`, `phase3`, `phase4`, `phase5`, `sprint1-4`, `gap-phase1-2`). | **FAILED (P0 DEFECT)** |
| **Real DB / Persistence Verification** | Claimed integrated | **0 of 146 tests execute against PostgreSQL**. All database calls are mocked in memory. | **UNPROVEN (0% Coverage)** |
| **Public Product Catalog** | Live DB fetch with Naira `₦` | Correctly wired to `GET /api/products`, fixed missing `useEffect` import, prices rendered in `₦`. | **VERIFIED** |
| **Cart Farmer Association** | Partitions by farmer profile | `farmerProfileId` and `farmerName` attached to `CartContext` and grouped on `/cart`. | **VERIFIED** |
| **Admin Crop Creation** | Live API submission | Submits to `POST /api/farmer/produce`, but creates items as `PENDING_APPROVAL` requiring subsequent manual admin approval. | **VERIFIED WITH CAVEAT** |
| **Admin CSV Exports** | Real CSV downloads | Real dynamic Blob CSV generation and browser download implemented on products and orders. | **VERIFIED** |
| **Paystack Webhook** | Decommissioned | Returns `HTTP 410 Gone` with deprecation guidance. | **VERIFIED** |
| **TypeScript Diagnostics** | 0 errors | `npx tsc --noEmit` exits with **0 errors**. | **VERIFIED** |
| **Production Build** | Compiles cleanly | `npm run build` exits with **0 errors**, all 101 routes prerendered/compiled. | **VERIFIED** |
| **Code Linting** | Not reported | `npx eslint src` exits with **1 (306 errors, 182 warnings)**. | **FAILED** |

---

## 2. DEEP DIVE: CRITICAL ARCHITECTURAL DEFECTS

### Finding 1: The Commercial Commission & Tax Schism (P0)
The repository suffers from severe fragmentation regarding its core commercial model. Four completely different formulas are active in production code:

#### Implementation A: `src/lib/settlement.ts` & `src/lib/config.ts`
- **Rule**: 5.0% platform fee on GMV; 7.5% Nigerian VAT assessed **on the platform fee**.
- **Math**:
  $$\text{Fee} = \text{Gross} \times 0.05$$
  $$\text{VAT} = \text{Fee} \times 0.075 = \text{Gross} \times 0.00375$$
  $$\text{Net Farmer Payout} = \text{Gross} - (\text{Fee} + \text{VAT}) = \text{Gross} \times 0.94625$$

#### Implementation B: `src/app/api/admin/finance/route.ts` (Lines 44–48)
```ts
// Line 44: Each ESCROW_RELEASE amount = totalOrder * 0.975. So platform fee = amount / 0.975 * 0.025
const totalPlatformRevenue = releaseTxns.reduce((sum, tx) => {
  const farmerCredit = Number(tx.amount);
  const fee = (farmerCredit / 0.975) * 0.025;
  return sum + fee;
}, 0);
```
- **Discrepancy**: Assumes platform fee was **2.5%** and VAT was **0%**. Because the actual release transactions credit 94.625%, this formula calculates completely fictitious revenue.

#### Implementation C: `src/app/api/farmer/analytics/route.ts` (Lines 61–66)
```ts
const PLATFORM_FEE_PCT = 0.025; // 2.5%
const VAT_PCT = 0.075; // 7.5%

const totalPlatformFees = totalGrossRevenue * PLATFORM_FEE_PCT;
const totalVatFees = totalGrossRevenue * VAT_PCT;
const totalNetPayout = totalGrossRevenue - totalPlatformFees;
```
- **Discrepancy**:
  1. Platform fee is hardcoded to 2.5%.
  2. VAT is calculated on **gross commodity revenue** (₦7,500 on ₦100,000), rather than on the platform fee (₦187.50).
  3. `totalNetPayout` subtracts `totalPlatformFees` but **ignores `totalVatFees` completely**.

#### Implementation D: `src/services/reconciliation.service.ts` (Lines 198–205)
```ts
const totalPlatformRevenue = releaseTxns.reduce((sum, tx) => {
  const farmerCredit = Number(tx.amount);
  const feeRate = config.fees.platformFeeRate; // 0.05
  const grossAmount = farmerCredit / (1 - feeRate); // Assumes farmerCredit = gross * 0.95
  const fee = grossAmount * feeRate;
  return sum + fee;
}, 0);
```
- **Discrepancy**: Uses 5% fee rate, but assumes `farmerCredit = gross * 0.95`, completely ignoring the statutory 7.5% VAT deduction ($0.00375$). As a result, the reconstructed gross amount is erroneous, causing reconciliation drift.

---

### Finding 2: Card Refund Semantics & Flawed Assertion (P0)
The audit inspected `WalletService.executeGatewayCardRefund` ([`src/services/wallet.service.ts:542-572`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/services/wallet.service.ts#L542-L572)) and the test in [`__tests__/integration/multi-vendor-settlement.test.ts:185-195`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/__tests__/integration/multi-vendor-settlement.test.ts#L185-L195).

#### The Fallback Flaw in `executeGatewayCardRefund`:
```ts
// If Flutterwave fails or key is missing:
// Fallback: Credit buyer wallet balance as store credit without decrementing in-app escrow
return this.executeRefund(userId, amount, orderId, true);
```
1. In a production card payment, money is captured by Flutterwave into the company's bank account.
2. If an order is cancelled, either:
   - The money is refunded via Flutterwave back to the cardholder's bank account (**no internal wallet balance should ever be credited**), OR
   - The user accepts store credit in lieu of card refund.
3. However, if the Flutterwave API fails, `executeGatewayCardRefund` automatically credits the buyer's internal wallet balance with ₦75,000 of platform money.
4. **What the test actually did**:
   The test in `multi-vendor-settlement.test.ts` ran without setting `FLUTTERWAVE_SECRET_KEY`. It asserted:
   ```ts
   expect(buyerWallet.balance).toBe(80000.0); // 5,000 initial + 75,000 refund
   ```
   **The test proved the exact opposite of what is required for card isolation.** It verified that a card payment cancellation minted ₦75,000 into the buyer's internal wallet balance, instead of verifying that a gateway card refund leaves internal wallet balance uncredited!

---

### Finding 3: The Withdrawal Network Timeout Black Hole (P1)
In [`src/services/wallet.service.ts:344-399`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/services/wallet.service.ts#L344-L399):
```ts
try {
  const flwRes = await fetch("https://api.flutterwave.com/v3/transfers", { ... });
  const flwData = await flwRes.json();
  if (!flwRes.ok || flwData.status !== "success") {
    // Correctly rolls back funds inside $transaction
    throw new Error(`BANK_TRANSFER_FAILED: ...`);
  }
} catch (err: unknown) {
  const error = err as { message?: string };
  if (error.message?.startsWith("BANK_TRANSFER_FAILED")) throw err;
  console.error("[FLUTTERWAVE_TRANSFER_EXCEP]", err);
}
// Code proceeds here if fetch threw a network error!
await publishAgroEvent("PAYMENT_COMPLETED", ...);
return { status: "PROCESSING" };
```
**Impact**:
If Flutterwave's API experiences a network timeout, socket error, or 504 gateway timeout, the `fetch()` call throws a generic error.
The catch block catches it, logs it, **does not roll back the funds**, and allows execution to proceed to line 430, returning `{ status: "PROCESSING" }`.
Because Flutterwave never received the transfer, no webhook will ever arrive. The user's funds remain trapped in `pendingWithdrawal` indefinitely.

---

### Finding 4: Forensic Audit of the 146 "Passing" Tests (P0)
A file-by-file audit was conducted across all 27 test files:

| Test File | Total Tests | Status / Type | Genuine Execution Target |
|---|---|---|---|
| `phase0-security-containment.test.ts` | 7 | **REAL** | `src/middleware.ts`, `signSessionToken`, API route handlers |
| `multi-vendor-settlement.test.ts` | 4 | **REAL (FLAWED TEST)** | `WalletService` methods (Prisma mocked) |
| `phase3-hardening.test.ts` | 6 | **REAL** | Produce, moderation, dispute route handlers |
| `phase3-verification-gate.test.ts` | 6 | **REAL** | POD delivery, escrow release, freeze route handlers |
| `phase4-p1-hardening.test.ts` | 7 | **REAL** | Order validation and verification routes |
| `phase4-p2-hardening.test.ts` | 5 | **REAL** | Reconciliation cron job route |
| `gap-phase3-communications.test.ts` | 4 | **REAL** | Notification outbox processor & templates |
| `wallet-consolidation.test.ts` | 5 | **REAL** | `WalletService.getWalletDetails` |
| `financial-hardening.test.ts` | 6 | **REAL** | `verifyWebhookSignature`, `calculateSettlement` |
| `settlement.test.ts` | 2 | **REAL** | `calculateSettlement`, `generateReceipt` |
| `trust.test.ts` | 6 | **REAL** | `evaluateTrustPolicy`, `hasPermission` |
| `security-hardening.test.ts` | 6 | **REAL** | Password hashing & input sanitization |
| `fulfillment.test.ts` | 4 | **REAL** | Fulfillment state machine validator |
| `localization.test.ts` | 8 | **REAL** | `formatNGN`, date formatters |
| `commerce.test.ts` | 1 | **REAL** | Helper functions integration |
| **SUBTOTAL REAL TESTS** | **75 tests (51.4%)** | **Exercising code in `src/`** | |
| `phase1-domain-moderation.test.ts` | 8 | **TAUTOLOGICAL** | Inline closures (`createProduceListing`, `processModeration`) |
| `phase2-farmer-operations.test.ts` | 7 | **TAUTOLOGICAL** | Inline closures (`getFarmerSubOrders`, `transitionSubOrder`) |
| `phase3-governance-arbitration.test.ts` | 7 | **TAUTOLOGICAL** | Inline closures (`arbitrateDispute`, `resolveRefund`) |
| `phase4-checkout-logistics.test.ts` | 12 | **TAUTOLOGICAL** | Inline closures (`groupedByFarmer`, local shipping formula) |
| `phase5-e2e-marketplace-simulation.test.ts` | 5 | **TAUTOLOGICAL** | Plain JavaScript object manipulation |
| `sprint1a-money.test.ts` | 4 | **TAUTOLOGICAL** | `expect(5000 <= 10000).toBe(false)`, etc. |
| `sprint1b-integrity.test.ts` | 2 | **TAUTOLOGICAL** | Local PBKDF2 helper, regex test |
| `sprint2-commerce.test.ts` | 3 | **TAUTOLOGICAL** | `expect(canReleaseEscrow).toBe(true)`, etc. |
| `sprint3-farmer.test.ts` | 3 | **TAUTOLOGICAL** | `expect(validPrice > 0).toBe(true)`, etc. |
| `sprint4-kyc.test.ts` | 4 | **TAUTOLOGICAL** | Inline status map checks |
| `gap-phase1-commerce.test.ts` | 4 | **TAUTOLOGICAL** | `expect("ACTIVE" === "ACTIVE").toBe(true)`, etc. |
| `gap-phase2-admin.test.ts` | 4 | **TAUTOLOGICAL** | `expect(config.platformFeePercent).toBe(5.0)`, etc. |
| **SUBTOTAL TAUTOLOGICAL TESTS** | **71 tests (48.6%)** | **Testing local mock variables & closures** | |
| **TOTAL** | **146 tests** | **0 tests running against live PostgreSQL** | |

**Conclusion**: Almost half of the test suite (71 tests) is purely decorative. Furthermore, not a single test in the repository executes against a real PostgreSQL database instance.

---

## 3. INDEPENDENT TOOLING AUDIT RESULTS

### A. TypeScript Type Check
```bash
$ npx tsc --noEmit
Exit code: 0
Diagnostic: Zero compiler errors. All types, DTOs, and route parameters pass strict type checking.
```

### B. ESLint Static Analysis
```bash
$ npx eslint src
Exit code: 1
Diagnostic: 488 problems (306 errors, 182 warnings).
Key violations:
- `@typescript-eslint/no-explicit-any` across API response wrappers, repositories, and services.
- `react-hooks/set-state-in-effect` in `src/context/UserContext.tsx:57`.
```

### C. Next.js Production Build
```bash
$ npm run build
Exit code: 0
Diagnostic: All 101 routes compiled and generated successfully using Next.js 16.1.2 Turbopack.
```

---

## 4. WHAT MUST BE DONE BEFORE PRODUCTION CERTIFICATION

To achieve genuine production readiness, the following engineering tasks must be executed:

1. **Unify Commercial Commission & Tax Architecture**:
   - Establish **one single authoritative rule** across the entire platform:
     - Is it 5% platform commission + 7.5% VAT on fee, or 2.5% flat?
   - Refactor `src/app/api/admin/finance/route.ts`, `src/app/api/farmer/analytics/route.ts`, and `src/services/reconciliation.service.ts` to import and strictly use `calculateSettlement()` from `src/lib/settlement.ts`.
2. **Isolate Card vs. Wallet Refund Lifecycles**:
   - Re-architect `executeGatewayCardRefund`:
     - If gateway refund succeeds: mark payment `REFUNDED`, order `CANCELLED`, do **not** touch buyer wallet balance.
     - If gateway refund fails in production: mark refund as `MANUAL_REVIEW_REQUIRED`; do **not** silently mint store credit into the user's wallet without debiting an authorized treasury account.
   - Update `multi-vendor-settlement.test.ts` to mock a successful Flutterwave refund and assert that `buyerWallet.balance` remains unchanged.
3. **Fix Withdrawal Network Exception Handling**:
   - Wrap the Flutterwave transfer `fetch` call so that any uncaught exception (e.g. timeout, network down) either automatically reverses `pendingWithdrawal` back to `balance` or enters an explicit `FAILED_REVERSED` state.
4. **Purge & Replace Tautological Tests**:
   - Delete or rewrite the 71 tautological tests in `phase1`, `phase2`, `phase3`, `phase4`, `phase5`, `sprint1-4`, and `gap-phase1-2` to import and exercise actual route handlers and domain services.
5. **Establish Controlled Persistence Testing**:
   - Set up an integration test database (e.g. Docker PostgreSQL or test container) so that transactions, row locks (`$executeRaw`), and Prisma relations are verified against real database behavior.
