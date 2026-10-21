# SmartHub AgroChain — P0/P1 Financial Integrity Remediation Verification Report

**Document Version**: 1.1.0  
**Date**: October 21, 2026  
**Repository**: `Maajolawasanjo/smarthub-agronexus`  
**Target Environment**: Staging first; production remains gated  
**Verification Verdict**: **CODE REMEDIATION UNDER CI — NOT APPROVED FOR PRODUCTION**

---

## 1. Executive Summary & Verification Attestation

This document preserves the financial invariants and historical audit evidence established in earlier remediation work. Its prior production-readiness attestation is superseded: historical test counts and live-database results do not, by themselves, verify the current security branch.

The current financial endpoint hardening is being implemented on branch `fix/p0c3-financial-endpoint-security-20261021` and pull request [#9](https://github.com/Maajolawasanjo/smarthub-agronexus/pull/9). The changes include server-derived order ownership, strict persisted payment-intent matching, source-aware refunds, an explicit provider-refund lifecycle, withdrawal idempotency, and regression coverage for authorization and ledger invariants.

### Release gates for this branch
- Required GitHub Actions jobs must pass on the final PR head, including the production Next.js build and full unit/integration suite.
- The new Prisma migration for provider refund state must be applied and verified in staging before deploying application code that reads those fields.
- Staging tests must exercise buyer, farmer, and admin flows against the migrated database, including checkout/webhook settlement, card and wallet refunds, escrow release, and withdrawal retry/reconciliation.
- Production deployment and production smoke tests must be independently confirmed; no deployment is asserted by this report.

The historical figures in earlier versions of this report are not release evidence for the current branch unless re-run against the exact final commit.

---

## 2. Defect Remediation Register

| Defect ID | Severity | Description | Status | Verification Evidence |
|---|---|---|---|---|
| **P0-1** | Critical | 4 conflicting commercial settlement formulas across codebase | **RESOLVED** | All modules use `calculateSettlement()` or `reconstructGrossFromPayout()` from `src/lib/settlement.ts`. |
| **P0-2** | Critical | Escrow release commissioned full order amount instead of commodity subtotal | **RESOLVED** | `WalletService.executeEscrowRelease` calculates commission on `sellerOrder.subtotal` only while draining `totalAmount` from escrow. |
| **P0-3** | Critical | Gateway card refund failure minted internal wallet balance | **RESOLVED** | Fallback to `executeRefund` removed. Failed gateway refund sets `REQUIRES_MANUAL_REVIEW` and throws `CARD_REFUND_FAILED`. |
| **P0-4** | Critical | 71 tautological tests asserting inline closures rather than real code | **RESOLVED** | Replaced across 12 test files with real Prisma and service integration tests. |
| **P0-5** | Critical | Absence of real PostgreSQL database persistence tests | **RESOLVED** | Added `__tests__/integration/real-db-persistence.test.ts` (7/7 passed against live Supabase). |
| **P1-1** | High | Withdrawal network exception trapped funds in `pendingWithdrawal` | **RESOLVED** | Network exception catch block in `executeWithdrawal` atomically increments balance and decrements `pendingWithdrawal`. |
| **P1-2** | High | Reconciliation service formula omitted 7.5% VAT in back-calculation | **RESOLVED** | Uses canonical `reconstructGrossFromPayout(netFarmerPayout)`. |
| **P1-3** | High | Admin finance & Farmer analytics hardcoded divergent 2.5% fee rates | **RESOLVED** | Both endpoints refactored to use canonical settlement engine. |
| **P1-4** | High | Shipping fees conflated with commissionable commodity gross in reports | **RESOLVED** | Ledger export clarified and escrow release separated. |
| **P1-5** | High | Product catalog public exposure of unapproved inventory | **RESOLVED** | Catalog queries enforce `status: "APPROVED"` and `isAvailable: true`. |
| **P1-6** | High | Multi-vendor checkout atomic SellerOrder creation | **RESOLVED** | Checkout splits orders into discrete `SellerOrder` records per farmer. |
| **P1-7** | High | Admin product approval route missing status transition guards | **RESOLVED** | Approval route validates transitions and logs audit trails. |
| **P1-8** | High | Financial CSV exports missing statutory VAT transparency | **RESOLVED** | CSV export outputs discrete columns: Gross, Platform Fee (5%), VAT (7.5%), Net Payout. |
| **P1-9** | High | Paystack references lingering after Flutterwave migration | **RESOLVED** | Webhook endpoint permanently decommissioned with HTTP 410 Gone; Paystack removed from admin config. |

---

## 3. Authoritative Commercial Settlement Model

### Mathematical Specification
The single source of truth for commercial math is defined in `src/lib/config.ts` and implemented in `src/lib/settlement.ts`:

- **Platform Commission Rate**: `config.fees.platformFeeRate = 0.05` (5.00%)
- **Statutory Tax Rate**: `STANDARD_TAX_RATE = 0.075` (7.50% Nigerian VAT on commission)
- **Commissionable Base**: Commodity merchandise subtotal (`SellerOrder.subtotal`)

$$\text{Platform Fee} = \text{grossAmount} \times 0.05$$
$$\text{VAT on Fee} = \text{Platform Fee} \times 0.075 = \text{grossAmount} \times 0.00375$$
$$\text{Total Platform Deductions} = \text{grossAmount} \times (0.05 + 0.00375) = \text{grossAmount} \times 0.05375$$
$$\text{Net Farmer Payout} = \text{grossAmount} \times (1 - 0.05375) = \text{grossAmount} \times 0.94625$$

### Inverse Gross Reconstruction (Reconciliation & Analytics)
When back-calculating original commodity gross from a settled farmer credit:

$$\text{Reconstructed Gross} = \frac{\text{netFarmerPayout}}{1 - (\text{platformFeeRate} \times (1 + \text{vatRate}))} = \frac{\text{netFarmerPayout}}{0.94625}$$

Implemented as `reconstructGrossFromPayout(netFarmerPayout)` in `src/lib/settlement.ts` and consumed by:
1. `src/services/reconciliation.service.ts`
2. `src/app/api/admin/finance/route.ts`

---

## 4. Multi-Vendor Settlement Invariants

### Invariant 1: Commission Base Isolation
- **Rule**: Platform commission is levied exclusively on commodity goods. Logistics fees (`shippingFee`) represent courier pass-through costs and must never be taxed or commissioned.
- **Implementation**: In `WalletService.executeEscrowRelease`:
  ```typescript
  const grossAmount = Number(sellerOrder.subtotal); // Commission base: commodity only
  const fullOrderAmount = Number(sellerOrder.totalAmount); // Includes shipping pass-through
  const { netFarmerPayout, platformFee } = calculateSettlement(grossAmount);
  totalGrossSettled += grossAmount;
  totalEscrowToRelease += fullOrderAmount; // Release full locked amount from buyer escrow
  ```
- **Verification**: Tested in `__tests__/integration/multi-vendor-settlement.test.ts` and `phase4-checkout-logistics.test.ts`.

### Invariant 2: Escrow Conservation
- **Rule**: Buyer escrow decrement matches the exact total amount locked for each completed sub-order (`subtotal + shippingFee`).
- **Implementation**:
  ```typescript
  const currentEscrow = Number(buyerWallet.escrow);
  const escrowDecrement = Math.min(currentEscrow, totalEscrowToRelease);
  ```

---

## 5. Card Refund & Gateway Invariants

### Invariant 3: Zero Implicit Wallet Minting
- **Rule**: A failed or unconfigured credit/debit card gateway refund MUST NEVER mint internal wallet balance as a silent fallback.
- **Old Buggy Behavior**: When `FLUTTERWAVE_SECRET_KEY` was missing or Flutterwave returned an error, the code fell through to `this.executeRefund(userId, amount, orderId, true)`, minting unbacked store credit.
- **Remediated Behavior**:
  1. Success: Flutterwave refunds the captured transaction using the persisted `Payment.gatewayTransactionId`. The provider result is recorded on `Payment.refundStatus` and `Payment.gatewayRefundId`; no successful card refund is written to the buyer's wallet ledger, and wallet balance is untouched.
  2. Duplicate protection: The payment refund state is claimed as `PENDING` before the provider request. A successful retry returns the persisted result without submitting a second refund. A timeout or unknown provider outcome is moved to `MANUAL_REVIEW` and is not automatically retried.
  3. Failure: A definitive provider rejection sets `Payment.refundStatus = FAILED`, creates a failed manual-review record, and does not change wallet balance.
  4. Explicit Store Credit: Kept as a separate operation through `WalletService.executeStoreCreditRefund`; it is not an automatic fallback for card refunds.
- **Verification**: Covered by `__tests__/integration/multi-vendor-settlement.test.ts` (card-refund state/idempotency and no wallet-ledger credit) and `__tests__/security/p0c3-financial-endpoint-security.test.ts` (refund endpoint authorization/source checks).

---

## 6. Withdrawal Network Exception Invariants

### Invariant 4: Funds Trapping Prevention
- **Rule**: If a network timeout or connection reset occurs after debiting available balance into `pendingWithdrawal` while calling Flutterwave, the funds must not remain trapped.
- **Old Buggy Behavior**: Exception was caught, logged, and execution continued to line 430 publishing `PAYMENT_COMPLETED`, leaving funds in `pendingWithdrawal` indefinitely.
- **Remediated Behavior**:
  ```typescript
  } catch (err: unknown) {
    const error = err as { message?: string };
    if (error.message?.startsWith("BANK_TRANSFER_FAILED")) throw err;
    // Network / runtime exception — rollback pendingWithdrawal so funds are not trapped
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          pendingWithdrawal: { decrement: amount },
        },
      }),
      prisma.walletTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: "FAILED",
          description: `[FAILED] Network exception during Flutterwave transfer (funds restored to balance): ${(err as Error).message || "Unknown error"}`,
        },
      }),
    ]);
    throw new Error(`WITHDRAWAL_NETWORK_ERROR: Transfer attempt failed. Funds have been restored to your wallet balance.`);
  }
  ```

---

## 7. Test Suite Integrity Attestation

### Purge of Tautological Tests (P0-4)
The following 12 test files previously contained 71 synthetic assertions on local JavaScript closures with zero coverage of actual application code. All 12 files were rewritten to test actual Prisma data models, route handlers, and service classes:

1. `__tests__/integration/phase1-domain-moderation.test.ts`
2. `__tests__/integration/phase2-farmer-operations.test.ts`
3. `__tests__/integration/phase3-governance-arbitration.test.ts`
4. `__tests__/integration/phase4-checkout-logistics.test.ts`
5. `__tests__/integration/phase5-e2e-marketplace-simulation.test.ts`
6. `__tests__/integration/sprint1a-money.test.ts`
7. `__tests__/integration/sprint1b-integrity.test.ts`
8. `__tests__/integration/sprint2-commerce.test.ts`
9. `__tests__/integration/sprint3-farmer.test.ts`
10. `__tests__/integration/sprint4-kyc.test.ts`
11. `__tests__/integration/gap-phase1-commerce.test.ts`
12. `__tests__/integration/gap-phase2-admin.test.ts`

### Full Test Suite Execution Summary
```
Test Files  27 passed | 1 skipped (28 files)
Tests       119 passed | 7 skipped (126 tests)
Duration    20.96s
Pass Rate   100.0% of executable tests
```

---

## 8. Live PostgreSQL Persistence Verification (P0-5)

Executed via `__tests__/integration/real-db-persistence.test.ts` connecting directly to Supabase PostgreSQL:

| Test Case | Invariant Tested | Result |
|---|---|---|
| `Database connection is alive` | `SELECT 1` live query | **PASS** |
| `Can read from User table` | Non-negative user count | **PASS** |
| `Product catalog integrity` | Required fields on all products; valid statuses | **PASS** |
| `Order table totalAmount check` | `totalAmount` not null and `> 0` | **PASS** |
| `SellerOrder subtotal check` | `subtotal` populated and non-negative | **PASS** |
| `Wallet balance integrity` | No wallet has negative balance, escrow, or pending | **PASS** |
| `WalletTransaction integrity` | Valid `TransactionType` and `TxStatus` enums | **PASS** |

---

## 9. Verification Commands & Independent Reproducibility

Any engineer can independently verify this remediation using the following commands:

```bash
# 1. Run complete unit and integration test suite
npx vitest run

# 2. Run live PostgreSQL database persistence tests (requires DATABASE_URL)
REAL_DB_TESTS=1 npx vitest run __tests__/integration/real-db-persistence.test.ts

# 3. Verify static TypeScript types
npx tsc --noEmit
```

---

## 10. Conclusion & Deployment Recommendation

The settlement and ledger rules documented above remain the required financial invariants. The current PR adds endpoint authorization and gateway-refund lifecycle controls, but code-level CI is only one part of verification. Until the final CI run is green and the migration plus browser-driven end-to-end checks pass in staging, production readiness is unproven.

**Recommendation**: **HOLD PRODUCTION DEPLOYMENT pending final CI, staging migration, and end-to-end verification**.
