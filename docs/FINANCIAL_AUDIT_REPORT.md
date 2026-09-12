# SmartHub AgroChain
## Wallet, Payment, Financial Security & Transactional Email Forensic Audit

**Audit Date**: September 11, 2026  
**Repository**: `smarthub-agronexus` (`smarthub-agrochain`)  
**Commit Inspected**: `baa807d`  
**Audit Scope**: Forensic Architecture & Security Analysis of Wallet, Payment, Ledger, Orders, Escrow, Refunds, Payouts, Disputes, Webhooks, Idempotency, Concurrency, Financial Authorization, Audit Logging, and Transactional Email Infrastructure.  
**Auditor**: Antigravity Forensic Security Engine  

---

## 1. Executive Summary

A comprehensive, read-only forensic security audit of the **SmartHub AgroChain** platform was conducted across the database schema, API routes, service layer, domain events, background jobs, client-side interfaces, and test suites.

### Overall Status: **CRITICAL SECURITY AND FINANCIAL DEFICITS IDENTIFIED**
The application in its current state is **NOT SAFE FOR PRODUCTION**. While the codebase contains well-intentioned architectural patterns (such as Prisma database transactions, a unified Wallet DTO, and an abstract NotificationOutbox model), the underlying financial and payment implementations contain **critical vulnerabilities (P0)** that permit:
1. **Unrestricted Money Minting**: A live simulated deposit backdoor in `/api/wallet/deposit` allowing any authenticated user to credit unlimited funds to their wallet balance.
2. **Double-Spend & Overdraft via Race Conditions**: Concurrency vulnerabilities in withdrawal (`/api/wallet/withdraw`) and checkout (`/api/orders`) allowing users to drive balances deeply negative and extract unbacked cash via Flutterwave.
3. **Arbitrary Order Status and Payment State Manipulation**: Completely unprotected `PUT /api/orders/[id]` endpoint allowing any authenticated user to mark any order as `CONFIRMED` and `PAID` without spending a kobo.
4. **BOLA/IDOR on Escrow Release**: Unauthenticated/unverified escrow release endpoint (`/api/wallet/escrow`) enabling users to repeatedly trigger payouts to farmers on behalf of other buyers' orders.
5. **Client-Supplied Payment Amounts**: Client-side total pricing passed directly to Flutterwave hosted checkout in `/api/payments/flutterwave/initialize`.
6. **Admin Cancellation Wallet Theft**: Admin-initiated cancellations credit the admin's personal wallet rather than the buyer's wallet.
7. **Complete Transactional Email Absence**: Zero emails are delivered for registration, password resets, payment receipts, withdrawals, deposits, or disputes. Resend is referenced in an adapter but not installed in `package.json`, and no outbox processor exists.

---

## 2. Current Architecture Map

```text
                               ┌────────────────────────┐
                               │  Client Frontend (UI)  │
                               │ Next.js 16 App Router  │
                               └───────────┬────────────┘
                                           │
                         (Bypasses Next.js Middleware!
                          matcher: only /dashboard,
                          /farmer, /admin; /api omitted)
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │     API Route Layer    │
                               │  src/app/api/**        │
                               └───────────┬────────────┘
                                           │
                               ┌───────────┴────────────┐
                               │   Session Auth Check   │
                               │   (lib/session.ts)     │
                               │   JWT 'smarthub_session│
                               └───────────┬────────────┘
                                           │
             ┌─────────────────────────────┼─────────────────────────────┐
             ▼                             ▼                             ▼
   ┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
   │   WalletService   │         │  PaymentService   │         │    Order Flow     │
   │ wallet.service.ts │         │ payment.service.ts│         │  api/orders/route │
   └─────────┬─────────┘         └─────────┬─────────┘         └─────────┬─────────┘
             │                             │                             │
             └─────────────────────────────┼─────────────────────────────┘
                                           │
                                           ▼
                               ┌────────────────────────┐
                               │  Prisma / PostgreSQL   │
                               │     Supabase Pooler    │
                               └───────────┬────────────┘
                                           │
            ┌──────────────────────────────┼──────────────────────────────┐
            ▼                              ▼                              ▼
  ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐
  │  Payment Gateway  │          │  AgroEvents Bus   │          │NotificationOutbox │
  │    Flutterwave    │          │  (In-Memory Array)│          │ (Database Table)  │
  │ api.flutterwave   │          │ lib/events.ts     │          │ lib/notifications │
  └─────────┬─────────┘          └─────────┬─────────┘          └─────────┬─────────┘
            │                              │                              │
            ▼                              ▼                              ▼
  ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐
  │ Webhook Endpoint  │          │prisma.notification│          │  Resend (Unused / │
  │ flutterwave/webhk │          │  (In-App DB Table)│          │  No Background    │
  │ payments/webhook  │          └───────────────────┘          │  Worker / Cron)   │
  └───────────────────┘                                         └───────────────────┘
```

---

## 3. Financial Model Inventory

| Model | Purpose | Money-Related? | Owner | Status in Code | Identified Structural Risks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Wallet`** | Stores account balances | **YES** | User (`userId` 1:1) | IMPLEMENTED | Direct mutable balance columns (`balance`, `escrow`, `pendingWithdrawal`, `frozen`). **No currency column**. No PostgreSQL `CHECK (balance >= 0)`. |
| **`WalletTransaction`** | Transaction history record | **YES** | Wallet (`walletId` N:1) | IMPLEMENTED | Acts as history log, not authoritative double-entry ledger. **No currency column**. Single reference uniqueness constraint. |
| **`Payment`** | Records checkout payment status | **YES** | Order (`orderId` 1:1) | IMPLEMENTED | Holds `amount`, `paymentMethod`, `paymentStatus`. **No currency column**. Mutable status. |
| **`Order`** | Marketplace order | **YES** | BuyerProfile (`buyerId` N:1) | IMPLEMENTED | Holds `totalAmount` (`Decimal(10,2)`). **No currency column**. |
| **`OrderItem`** | Line item in order | **YES** | Order (`orderId` N:1) | IMPLEMENTED | Holds `quantity`, `unitPrice`, `subtotal`. **No currency column**. |
| **`Product`** | Marketplace produce listing | **YES** | FarmerProfile (`farmerProfileId` N:1) | IMPLEMENTED | Holds `price` (`Decimal(10,2)`). **No currency column**. |
| **`Inventory`** | Stock tracking | Indirect | Product (`productId` 1:1) | IMPLEMENTED | Uses conditional atomic reservation `UPDATE "Inventory" ... WHERE "availableQty" >= requested`. |
| **`BankAccount`** | Payout destination account | **YES** | User (`userId` N:1) | IMPLEMENTED | Holds `accountNumber`, `bankCode`. Defaults `isVerified: true` without verification gateway. |
| **`Coupon`** | Discount vouchers | **YES** | System | IMPLEMENTED | Holds `discountPct`, `minSpend`. |
| **`Dispute`** | Order disputes | **YES** | Order + User | PARTIALLY IMPLEMENTED | Dispute model exists, but **zero resolution endpoints or automated fund freezing logic exist**. |
| **`AuditEvent`** | Security and audit logging | Indirect | Actor / System | PARTIALLY IMPLEMENTED | Model exists, but financial actions (deposits, withdrawals, refunds) **never call `recordAuditEvent`**. |
| **`NotificationOutbox`** | Outbox message queue | Indirect | Recipient | PARTIALLY IMPLEMENTED | Model exists, but only called in delivery POD route; **no background worker processes the queue**. |
| **`UserPreferences`** | Regional currency/locale | Indirect | User (`userId` 1:1) | IMPLEMENTED | Holds `currencyCode` (default `NGN`). Decoupled from all transactional models. |
| **`Ledger`** | Double-entry journal | **YES** | Platform | **NOT IMPLEMENTED** | Absent. The platform relies on single-sided `increment`/`decrement` updates on `Wallet`. |
| **`Escrow`** | Escrow holding contract | **YES** | Order/Buyer/Farmer | **NOT IMPLEMENTED** | Absent as a table. Escrow is simply a balance column on `Wallet`. |
| **`Refund`** | Dedicated refund record | **YES** | Order / Payment | **NOT IMPLEMENTED** | Absent as a table. Handled via status mutations and generic transactions. |
| **`Payout`** | Bank transfer settlement | **YES** | Farmer | **NOT IMPLEMENTED** | Handled solely via `WalletTransaction` with type `WITHDRAWAL`. |

---

## 4. Wallet Architecture

### Flow: UI to Database
1. **Frontend**:
   - Buyer Wallet: [`src/app/dashboard/wallet/page.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/dashboard/wallet/page.tsx)
   - Farmer Wallet: [`src/app/farmer/wallet/page.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/farmer/wallet/page.tsx)
   - Modal Checkout: [`src/components/cart/PaymentModal.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/components/cart/PaymentModal.tsx)
2. **API Layer**:
   - `GET /api/wallet` -> calls `WalletService.getWalletPageData(session.userId)`
   - `POST /api/wallet/deposit` -> calls `WalletService.executeDeposit(...)`
   - `POST /api/wallet/withdraw` -> calls `WalletService.executeWithdrawal(...)`
   - `POST /api/wallet/escrow` -> calls `WalletService.executeEscrowRelease(...)`
3. **Service Layer**:
   - [`src/services/wallet.service.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/services/wallet.service.ts) encapsulates all core wallet mutations (`executeDeposit`, `executeWalletPayment`, `executeWithdrawal`, `handleTransferWebhook`, `executeRefund`, `executeEscrowRelease`).
4. **Database Representation**:
   - Balances are stored directly on the `Wallet` table:
     - `balance`: Available funds for spending or withdrawal.
     - `escrow`: Funds locked in active order escrow.
     - `pendingWithdrawal`: Funds reserved while Flutterwave payout is in-flight.
     - `frozen`: Funds locked due to account suspension or disputes (unused in practice).

---

## 5. Wallet Balance Integrity

| Question | Assessment | Code Evidence & Details |
| :--- | :--- | :--- |
| **1. Is balance stored directly?** | **YES** | `Wallet.balance` is stored as a direct `Decimal` column on `Wallet` table. |
| **2. Is balance derived from ledger?** | **NO** | `WalletService.getWalletPageData` (line 73) directly reads `wallet.balance`. |
| **3. Both balance and ledger?** | **NO** | No true double-entry ledger exists. `WalletTransaction` is merely an append-only transaction history log. |
| **4. Which is authoritative?** | **Stored balance** | The balance column is authoritative for all spending checks. |
| **5. Can balance be updated directly?** | **YES** | Prisma `wallet.update({ data: { balance: { increment / decrement } } })` is used throughout `WalletService`. |
| **6. Can users submit their own balance?** | **NO** | Users cannot submit balance directly in a payload. |
| **7. Can frontend amounts affect balance?** | **YES (P0)** | In `/api/wallet/deposit`, `body.amount` is directly credited when `simulateWebhook: true`. In `/api/payments/flutterwave/initialize`, `body.totalAmount` dictates payment. |
| **8. Are balance mutations atomic?** | **PARTIALLY** | Balance mutations occur inside `prisma.$transaction`, but without row locks or conditional updates. |
| **9. Are concurrent requests safe?** | **NO (CONFIRMED VULNERABLE)** | Two concurrent requests can overdraft the wallet below 0. |
| **10. Are negative balances possible?** | **YES** | Decrements do not check if balance remains >= 0 in the database. |
| **11. Are overdrafts possible?** | **YES** | Stolen value can be withdrawn before negative balance is detected. |
| **12. Are currency mismatches possible?** | **YES** | Wallet has no currency field; frontend supports 36 currencies. |
| **13. Are fees included?** | **YES** | Platform fee (5% in settlement engine, 2.5% in admin views) is deducted upon escrow release. |
| **14. Pending amounts separated?** | **YES** | In withdrawal, balance is shifted to `pendingWithdrawal`. |
| **15. Held/escrow funds separated?** | **YES** | In checkout, balance is shifted to `escrow`. |
| **16. Is there a transaction history?** | **YES** | `WalletTransaction` records entries. |
| **17. Is every balance change traceable?** | **MOSTLY** | Most service methods create a `WalletTransaction`, but `orders/[id]/route.ts` PUT status updates can mutate payments without wallet transactions. |
| **18. Can admin manually adjust balances?** | **NO** | No manual admin balance adjustment endpoint exists. |
| **19. If yes, is adjustment audited?** | **N/A** | Feature not implemented. |
| **20. Can adjustments be reversed?** | **YES** | Failed Flutterwave transfers execute `handleTransferWebhook(..., false)` which restores funds to balance. |

---

## 6. Double-Spend & Concurrency Analysis

| Operation Pair | Classification | Vulnerability Detail & Evidence |
| :--- | :--- | :--- |
| **Withdrawal + Withdrawal** | **CONFIRMED VULNERABLE (P0)** | In [`WalletService.executeWithdrawal`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/services/wallet.service.ts#L295-L332), balance check `if (amount > currentBalance)` runs outside the transaction. Inside `$transaction`, `balance: { decrement: amount }` runs unconditionally. Concurrent withdrawals of ₦40k on a ₦50k balance will both succeed, debiting ₦80k and creating negative balance (-₦30k). |
| **Payment + Payment** | **CONFIRMED VULNERABLE (P0)** | In [`src/app/api/orders/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/route.ts#L128-L151), `tx.wallet.findUnique` reads balance without row locking. Concurrent checkouts overdraft the wallet. |
| **Withdrawal + Payment** | **CONFIRMED VULNERABLE (P0)** | A user can simultaneously initiate a withdrawal and an order checkout. Both check available balance concurrently, both pass, debiting twice the available funds. |
| **Deposit + Withdrawal** | **POTENTIALLY UNSAFE** | While deposit increments balance, withdrawal race can interleave with uncommitted deposit callbacks, potentially withdrawing unverified funds. |
| **Escrow Release + Refund** | **CONFIRMED VULNERABLE (P0)** | `/api/wallet/escrow` does not check order status or locks. Escrow can be released while an order cancellation/refund is executing, leading to double-payout. |

---

## 7. Deposit Audit

### Complete Flow
1. User requests deposit via UI or `POST /api/wallet/deposit`.
2. **Backdoor Check**: If `simulateWebhook: true` in payload, the endpoint calls `WalletService.executeDeposit` immediately and credits the user's wallet with zero payment!
3. If normal deposit: Returns funding instructions with checkout URL `/api/payments/flutterwave/initialize?userId=...`.
4. Webhook callback hits `/api/payments/flutterwave/webhook`.
5. Webhook checks signature using `verifyWebhookSignature` (using `FLUTTERWAVE_SECRET_HASH` or `FLUTTERWAVE_SECRET_KEY`).
6. If event is `charge.completed`, calls Flutterwave v3 API `GET /transactions/:id/verify`.
7. Performs idempotency check against `WalletTransaction.reference`.
8. Credits user wallet with `increment: amount`.

### Critical Vulnerability
> **Can an attacker cause SmartHub to credit their wallet without a legitimate payment?**
> **YES (CONFIRMED P0 EXPLOIT)**.  
> In [`src/app/api/wallet/deposit/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/deposit/route.ts#L32-L47):
> ```typescript
> if (simulateWebhook) {
>   const txRef = `DEP-SIM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
>   const result = await WalletService.executeDeposit(session.userId, numAmount, txRef);
>   return NextResponse.json(createSuccessResponse({ ... }));
> }
> ```
> Any authenticated user can POST `{ "amount": 5000000, "simulateWebhook": true }` and receive ₦5,000,000 in spendable, withdrawable wallet balance immediately.

---

## 8. Withdrawal Audit

### Critical Questions Answered
1. **Can a user withdraw from another user's wallet?**  
   **NO**. In [`src/app/api/wallet/withdraw/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/withdraw/route.ts#L33), it passes `session.userId`.
2. **Can a user withdraw more than their available balance?**  
   **YES (via race condition)**.
3. **Can two simultaneous withdrawals overspend the wallet?**  
   **YES (CONFIRMED P0)**. Both transactions execute `decrement: amount` without row locks.
4. **Can a completed withdrawal be processed again?**  
   **NO**. Once `tx.status === "SUCCESS"`, `handleTransferWebhook` skips it (line 432).
5. **Can a client manipulate the withdrawal status?**  
   **NO**. Status transitions are server-controlled in `WalletService`.
6. **Can a client manipulate the destination account?**  
   **NO direct cross-user manipulation**, because `bankAccount` is queried with `{ id: bankAccountId, userId }`. However, any user can add an unverified bank account with arbitrary details.
7. **Can a failed withdrawal leave the wallet incorrectly debited?**  
   **YES, if webhook fails to arrive**. If the bank transfer fails at the clearing level and Flutterwave never delivers `transfer.completed`, or the webhook handler fails, funds remain trapped in `pendingWithdrawal` indefinitely until manual admin reconciliation.

---

## 9. Transfer Audit

### Assessment: **NOT IMPLEMENTED**
There is **zero wallet-to-wallet transfer functionality** in the codebase.
- No `type: "TRANSFER"` in `TransactionType` enum.
- No transfer endpoint in `/api/wallet`.
- No transfer method in `WalletService`.

---

## 10. Order / Payment / Escrow Lifecycle

```text
[BUYER] Places Order via POST /api/orders
   │
   ├─► PaymentMethod: "WALLET"
   │     ├─► Decrements buyer wallet.balance
   │     ├─► Increments buyer wallet.escrow
   │     ├─► Creates WalletTransaction (ESCROW_LOCK)
   │     ├─► Payment.paymentStatus = "PAID"
   │     └─► Order.status = "PENDING"
   │
   └─► PaymentMethod: "CARD" / "FLUTTERWAVE"
         ├─► Payment.paymentStatus = "PENDING"
         ├─► Order.status = "PENDING"
         └─► (DISCONNECTED: Hosted checkout does not create Order in DB!)
                 │
[FARMER/ADMIN/DISPATCH] Updates Order Status
   │
   ├─► Order.status -> "CONFIRMED" -> "PROCESSING" -> "READY_FOR_PICKUP" -> "IN_TRANSIT"
   │
   ├─► Delivery confirmed -> "DELIVERED"
   │     └─► Proof of Delivery submitted (/api/deliveries/[id]/pod)
   │
   └─► Delivery confirmed by Buyer -> "COMPLETED"
         ├─► Decrements buyer wallet.escrow
         ├─► Calculates platform fee (5% commission + 7.5% VAT on fee)
         ├─► Increments farmer wallet.balance (Net payout)
         └─► Creates WalletTransaction (ESCROW_RELEASE) on Farmer Wallet
```

### Critical Flaws in Escrow Lifecycle
1. **Hosted Checkout Disconnection**: As documented in Section 2, `/api/payments/flutterwave/initialize` does not link to a pre-created Order or Payment. When the webhook arrives, it credits the user's wallet as a deposit instead of settling the order into escrow.
2. **Auto-Completion Escrow Trap**: In [`src/jobs/index.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/jobs/index.ts#L30-L55), the auto-completion job sets `order.status = "COMPLETED"` but **never executes `WalletService.executeEscrowRelease`**. Funds remain locked in the buyer's escrow column forever while the order is closed.

---

## 11. Payment Provider & Webhook Security

| Provider | Endpoint | Signature Verification | Replay Protection | Idempotency | Authoritative Status Check | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Flutterwave** | `/api/payments/flutterwave/webhook` | `verif-hash` header or HMAC-SHA256 | Weak (in-memory txRef check) | `findUnique({ reference: txRef })` | Queries `GET /v3/transactions/:id/verify` | **MEDIUM-HIGH** |
| **Generic / Paystack** | `/api/payments/webhook` | HMAC-SHA256 (Bypassed if `NODE_ENV !== "production"`) | None | Checks `existingPayment.paymentStatus === "PAID"` | None (Trusts webhook payload) | **CRITICAL (P0)** |

### Fake Webhook Vulnerability on `/api/payments/webhook`
In [`src/services/payment.service.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/services/payment.service.ts#L50):
```typescript
if (process.env.NODE_ENV === "production" && !verifyWebhookSignature(rawBody, signature, process.env.PAYMENT_WEBHOOK_SECRET || "")) {
  throw new Error("Invalid payment gateway signature.");
}
```
In any staging, QA, preview, or development deployment, anyone can POST `{ "orderId": "..." }` and the payment is marked `PAID` with order status set to `CONFIRMED`.

---

## 12. Financial State Machine Audit

### Status Enums in `schema.prisma`
- **`OrderStatus`**: `PENDING`, `CONFIRMED`, `PROCESSING`, `READY_FOR_PICKUP`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`, `CANCELLED`
- **`PaymentStatus`**: `PENDING`, `PAID`, `FAILED`, `REFUNDED`
- **`TxStatus`**: `REQUESTED`, `VALIDATED`, `SUBMITTED_TO_FLUTTERWAVE`, `PROCESSING`, `SUCCESS`, `FAILED`, `REVERSED`, `PENDING`
- **`DisputeStatus`**: `OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`

### Illegal State Transitions & Flaws
1. **Arbitrary Transition via `PUT /api/orders/[id]`**: An order can be moved from `PENDING` directly to `CANCELLED`, setting `payment.paymentStatus = "REFUNDED"` even if the payment was never made!
2. **Cancellation State Collision**: In `orders/[id]/cancel/route.ts`, cancellation sets `paymentStatus = "FAILED"`, while in `orders/[id]/route.ts` PUT, cancellation sets `paymentStatus = "REFUNDED"`.
3. **Dispute Resets Paid Orders**: In `POST /api/disputes`, opening a dispute unconditionally updates all payments for that order to `paymentStatus = "PENDING"`, reverting settled transactions.

---

## 13. BOLA / IDOR Financial Audit

| Endpoint | Resource | Ownership Check? | Role Check? | Vulnerability & Impact |
| :--- | :--- | :--- | :--- | :--- |
| `PUT /api/orders/[id]` | `Order` / `Payment` | **NO** | **NO** | **P0 CRITICAL**: Any authenticated user can transition any order to `CONFIRMED` (marking payment as `PAID`) or `CANCELLED`. |
| `POST /api/wallet/escrow` | `Order` / `Wallet` | **NO** | **NO** | **P0 CRITICAL**: Any authenticated user can pass any `dbOrderId` and release funds to a farmer. |
| `GET /api/payments/settlement/[orderId]` | `SettlementDTO` | **NO** | **NO** | **P1 HIGH**: Any user can view financial settlement breakdowns, commissions, and buyer details for any order. |
| `POST /api/payments/settlement/[orderId]` | `Refund` | **NO** | Partial (`BUYER` or `ADMIN`) | **P1 HIGH**: Any buyer can trigger a refund/cancellation on any other user's order. |
| `GET /api/disputes` | `Dispute` list | **NO** | **NO (UNAUTHENTICATED)** | **P1 HIGH**: Unauthenticated endpoint leaks all platform disputes, customer names, emails, and dispute reasons. |
| `POST /api/disputes` | `Dispute` | **NO** | **NO** | **P1 HIGH**: Any user can file a dispute against any order, reverting payment status to `PENDING`. |
| `POST /api/orders/[id]/cancel` | `Order` | YES | YES | **P0 CRITICAL (Admin Bug)**: When admin cancels an order, refund is sent to admin's wallet (`session.userId`). |

---

## 14. Financial Authorization Matrix

| Operation | Buyer | Farmer | Admin | Unauthenticated | Notes & Code Reality |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **View own wallet** | ALLOWED | ALLOWED | ALLOWED | DENIED | `/api/wallet` checks `session.userId`. |
| **View another wallet** | DENIED | DENIED | ALLOWED | DENIED | Admin views aggregated overview in `/api/admin/finance`. |
| **Deposit to own wallet** | ALLOWED | ALLOWED | ALLOWED | DENIED | `/api/wallet/deposit` (Contains simulation backdoor). |
| **Deposit to another wallet** | DENIED | DENIED | DENIED | DENIED | Deposit is bound to `session.userId`. |
| **Withdraw own wallet** | ALLOWED | ALLOWED | ALLOWED | DENIED | `/api/wallet/withdraw` (Vulnerable to concurrent overdraft). |
| **Withdraw another wallet** | DENIED | DENIED | DENIED | DENIED | Bound to `session.userId`. |
| **View own transactions** | ALLOWED | ALLOWED | ALLOWED | DENIED | Returned in `/api/wallet`. |
| **View all transactions** | DENIED | DENIED | ALLOWED | DENIED | `/api/admin/finance` returns recent 30 transactions. |
| **Release escrow** | **ALLOWED (BOLA)**| **ALLOWED (BOLA)**| ALLOWED | DENIED | `/api/wallet/escrow` has NO ownership validation! |
| **Cancel & Refund order** | **ALLOWED (BOLA)**| DENIED | ALLOWED | DENIED | `/api/payments/settlement/:id` allows any buyer to refund any order. |
| **Lodge dispute** | **ALLOWED (BOLA)**| **ALLOWED (BOLA)**| ALLOWED | DENIED | `/api/disputes` allows creating disputes against any order. |
| **View all disputes** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED (P1)** | `/api/disputes` GET has NO authentication. |
| **Mutate order/payment status**| **ALLOWED (BOLA)**| **ALLOWED (BOLA)**| ALLOWED | DENIED | `PUT /api/orders/:id` has NO role or ownership checks. |

---

## 15. Money Precision & Currency Audit

### Precision Analysis
- **Database Schema**: Amounts are defined as `@db.Decimal(10, 2)`.
- **Runtime Application Code**:
  - Almost every calculation immediately casts Prisma Decimals to JavaScript `Number`:
    - `Number(wallet.balance)`
    - `parseFloat(amount)`
    - `Number((grossAmount * platformFeeRate).toFixed(2))`
  - **Risk**: JavaScript floating point representation (IEEE 754) is subject to precision drift, rounding discrepancies, and accumulated representation errors over large transaction volumes.
  - No integer minor-unit (kobo / cents) architecture exists.

### Currency Analysis
- **Supported Currencies in Frontend**: 36 currencies defined in `src/lib/i18n/currencies.ts` (NGN, USD, EUR, GBP, CAD, etc.).
- **Database Reality**:
  - `Wallet`: **NO currency column** (implicitly assumes NGN).
  - `WalletTransaction`: **NO currency column**.
  - `Order`: **NO currency column**.
  - `Payment`: **NO currency column**.
- **Critical Risk**: If an international buyer selects USD or EUR, orders and wallet records store raw numbers without currency tags or exchange rate snapshots. A ₦100,000 transaction can be misinterpreted as $100,000 or vice versa.

---

## 16. Transactional Email & Notification Audit

### Resend Assessment: **NOT IMPLEMENTED IN PRODUCTION**
1. **Package Check**: `@react-email` and `resend` are **NOT listed in `package.json`**.
2. **Adapter Check**: In [`src/lib/notifications/adapters.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/lib/notifications/adapters.ts#L34-L100), a raw `fetch("https://api.resend.com/emails", ...)` implementation exists inside `ResendEmailAdapter`.
3. **Template Check**: **NO HTML email templates exist**. It simply sends:
   `html: <p>${payload.subject}</p><pre>${JSON.stringify(payload.data || {}, null, 2)}</pre>`
4. **Trigger Check**: In the entire application, `enqueueEmail` is called in **exactly ONE place**:
   [`src/app/api/deliveries/[id]/pod/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/deliveries/%5Bid%5D/pod/route.ts#L160) for `ORDER_DELIVERED`.
5. **No Outbox Worker**: There is **no cron job, queue consumer, or daemon** that processes the `NotificationOutbox` table. Unless a user triggers a POD submission, outbox items remain unread.
6. **Zero Email Security**: No emails are sent for password resets, email verifications, suspicious logins, withdrawals, deposits, or order confirmations.

---

## 17. Complete Email Event Inventory

| Event | Should Email? | Currently Sends? | Trigger Location | Financial / Security? | Identified Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Registration** | YES | **NO** | `POST /api/auth/register` | Security | No email verification; unverified emails register freely. |
| **Email Verification** | YES | **NO** | N/A (Feature absent) | Security | Account takeover risk. |
| **Password Reset Request**| YES | **NO** | N/A (Feature absent) | Security | No self-service account recovery. |
| **Password Changed** | YES | **NO** | `POST /api/user/password` | Security | User not alerted if password compromised. |
| **Account Frozen / Suspended**| YES | **NO** | `PATCH /api/admin/users/:id/freeze` | Security | User unaware of regulatory or compliance action. |
| **Deposit Initiated** | YES | **NO** | `POST /api/wallet/deposit` | Financial | Missing audit trail for buyer. |
| **Deposit Successful** | YES | **NO** | `WalletService.executeDeposit` | Financial | Buyer receives no financial receipt. |
| **Withdrawal Requested** | YES | **NO** | `POST /api/wallet/withdraw` | Financial | No verification of withdrawal intent. |
| **Withdrawal Settled** | YES | **NO** | `WalletService.handleTransferWebhook` | Financial | Farmer unaware funds arrived in bank. |
| **Withdrawal Failed / Reversed**| YES | **NO** | `WalletService.handleTransferWebhook` | Financial | Farmer unaware why withdrawal bounced. |
| **Order Placed & Escrow Locked**| YES | **NO** | `POST /api/orders` | Financial | No formal order confirmation / invoice email. |
| **Order Delivered** | YES | **YES (Attempted)** | `/api/deliveries/:id/pod` | Operations | Enqueues to DB; sends raw JSON string if key exists. |
| **Escrow Released to Farmer**| YES | **NO** | `WalletService.executeEscrowRelease`| Financial | Farmer receives no settlement advice. |
| **Order Cancelled / Refunded**| YES | **NO** | `/api/orders/:id/cancel` | Financial | Buyer receives no credit confirmation. |
| **Dispute Opened** | YES | **NO** | `POST /api/disputes` | Financial | Neither party notified of active legal hold on funds. |

---

## 18. Audit Logging Analysis

### Status: **GRAVELY INCOMPLETE**
While the `AuditEvent` Prisma model is well-designed with fields for `category`, `severity`, `actorId`, `ipAddress`, and `userAgent`, it is **only invoked in 5 places**:
- `POST /api/admin/users`
- `POST /api/admin/verifications/:id`
- `POST /api/kyc/verify`
- `POST /api/orders` (`ORDER_CREATED`)
- `POST /api/orders/:id/release-escrow` (`ESCROW_RELEASED`)
- `POST /api/orders/:id/dispute` (`DISPUTE_OPENED`)
- `POST /api/deliveries/:id/pod` (`POD_SUBMITTED`)

### Financial Mutations with ZERO Audit Logging:
- `executeDeposit` (Zero audit log)
- `executeWithdrawal` (Zero audit log)
- `executeWalletPayment` (Zero audit log)
- `executeRefund` (Zero audit log)
- `handleTransferWebhook` (Zero audit log)
- `POST /api/payments/flutterwave/webhook` (Zero audit log)
- `POST /api/payments/webhook` (Zero audit log)
- `POST /api/wallet/bank-accounts` (Zero audit log)

---

## 19. Attack Scenarios (Detailed Technical Tracing)

### Attack Scenario 1: The "Simulate Webhook" Infinite Balance Exploit
- **Vulnerable File**: [`src/app/api/wallet/deposit/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/deposit/route.ts#L32-L47)
- **Mechanism**: Attacker registers an account, logs in, and issues:
  ```http
  POST /api/wallet/deposit
  Content-Type: application/json

  {
    "amount": 25000000,
    "simulateWebhook": true
  }
  ```
- **Outcome**: Server returns `200 OK` and executes `WalletService.executeDeposit`. `wallet.balance` is credited with ₦25,000,000.
- **Severity**: **P0 CRITICAL**

### Attack Scenario 2: Concurrent Double-Withdrawal Overdraft
- **Vulnerable File**: [`src/services/wallet.service.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/services/wallet.service.ts#L295-L332)
- **Mechanism**: Attacker has ₦100,000 in balance. Uses a concurrent HTTP runner to fire two requests at the exact same millisecond:
  - Request A: `POST /api/wallet/withdraw` (Amount: ₦90,000)
  - Request B: `POST /api/wallet/withdraw` (Amount: ₦90,000)
- **Outcome**: Both requests pass line 298 (`90,000 <= 100,000`). Both execute line 318 (`balance: { decrement: 90000 }`). Final balance is -₦80,000. Flutterwave transfers ₦180,000 to the attacker's bank account.
- **Severity**: **P0 CRITICAL**

### Attack Scenario 3: Free Goods via Client-Controlled Flutterwave Checkout Amount
- **Vulnerable File**: [`src/app/api/payments/flutterwave/initialize/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/payments/flutterwave/initialize/route.ts#L8-L40)
- **Mechanism**: Attacker adds 10 tons of cashew nuts worth ₦15,000,000 to cart. Intercepts checkout call and sends:
  ```json
  {
    "items": [{ "productId": "cashew-1", "quantity": 10 }],
    "totalAmount": 10
  }
  ```
- **Outcome**: The server creates a Flutterwave hosted checkout link for ₦10 instead of ₦15,000,000.
- **Severity**: **P0 CRITICAL**

### Attack Scenario 4: Unauthorized Order Confirmation via PUT /api/orders/[id]
- **Vulnerable File**: [`src/app/api/orders/[id]/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/%5Bid%5D/route.ts#L305-L382)
- **Mechanism**: Attacker places order with payment method `CARD`, leaving payment in `PENDING`. Attacker immediately issues:
  ```http
  PUT /api/orders/<order-id>
  Content-Type: application/json

  {
    "status": "CONFIRMED"
  }
  ```
- **Outcome**: The endpoint has no ownership or role checks. Line 378 executes:
  `tx.payment.update({ data: { paymentStatus: "PAID", paidAt: new Date() } })`.
  The order is confirmed and marked fully paid without any payment being made.
- **Severity**: **P0 CRITICAL**

### Attack Scenario 5: BOLA Escrow Release & Farmer Balance Drain
- **Vulnerable File**: [`src/app/api/wallet/escrow/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/escrow/route.ts#L25-L51)
- **Mechanism**: Attacker discovers a valid `orderId`. Attacker logs in and calls `POST /api/wallet/escrow` with `{ "dbOrderId": orderId }`.
- **Outcome**: No verification that attacker is the buyer. Payout is released to farmer, order is marked `COMPLETED`. Can be called multiple times.
- **Severity**: **P0 CRITICAL**

### Attack Scenario 6: Admin Order Cancellation Steals Buyer Funds
- **Vulnerable File**: [`src/app/api/orders/[id]/cancel/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/%5Bid%5D/cancel/route.ts#L95)
- **Mechanism**: Buyer pays ₦500,000 for an order. Admin inspects and cancels the order on behalf of the buyer.
- **Outcome**: The route calls `WalletService.executeRefund(session.userId, totalAmount, order.id)`. Since `session.userId` belongs to the Admin, ₦500,000 is credited to the Admin's personal wallet, while the buyer receives nothing.
- **Severity**: **P0 CRITICAL**

---

## 20. Critical Findings Matrix

### P0 — Critical (Immediate Financial Loss & Exploitation)
1. **P0-1**: Simulated Webhook Money Minting Backdoor in `/api/wallet/deposit` ([`src/app/api/wallet/deposit/route.ts:33`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/deposit/route.ts#L33)).
2. **P0-2**: Concurrency Double-Spend & Negative Balance Vulnerability in Withdrawals ([`src/services/wallet.service.ts:298`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/services/wallet.service.ts#L298)).
3. **P0-3**: Concurrency Double-Spend in Wallet Order Checkout ([`src/app/api/orders/route.ts:139`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/route.ts#L139)).
4. **P0-4**: Complete Authorization Bypass & Status Manipulation on `PUT /api/orders/[id]` ([`src/app/api/orders/[id]/route.ts:305`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/%5Bid%5D/route.ts#L305)).
5. **P0-5**: BOLA / IDOR on Escrow Release Endpoint ([`src/app/api/wallet/escrow/route.ts:25`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/escrow/route.ts#L25)).
6. **P0-6**: Client-Controlled Price in Flutterwave Hosted Checkout ([`src/app/api/payments/flutterwave/initialize/route.ts:39`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/payments/flutterwave/initialize/route.ts#L39)).
7. **P0-7**: Hosted Checkout Disconnect Diverting Payments to General Wallet Deposits ([`src/app/api/payments/flutterwave/webhook/route.ts:90`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/payments/flutterwave/webhook/route.ts#L90)).
8. **P0-8**: Admin Cancellation Misdirects Buyer Refund to Admin's Wallet ([`src/app/api/orders/[id]/cancel/route.ts:95`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/%5Bid%5D/cancel/route.ts#L95)).

### P1 — High (Severe Data Exposure, Logic Breakdown & Gaps)
1. **P1-1**: Unauthenticated PII & Dispute Leak on `GET /api/disputes` ([`src/app/api/disputes/route.ts:57`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/disputes/route.ts#L57)).
2. **P1-2**: Arbitrary Dispute Filing Reverts Payment to `PENDING` ([`src/app/api/disputes/route.ts:36`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/disputes/route.ts#L36)).
3. **P1-3**: BOLA on Payment Settlement Refund Endpoint ([`src/app/api/payments/settlement/[orderId]/route.ts:35`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/payments/settlement/%5BorderId%5D/route.ts#L35)).
4. **P1-4**: Order Auto-Completion Job Leaves Farmer Escrow Locked Forever ([`src/jobs/index.ts:30`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/jobs/index.ts#L30)).
5. **P1-5**: Platform Commission Calculation Divergence between Settlement Engine (5%) and Admin Finance (2.5%) ([`src/app/api/admin/finance/route.ts:47`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/admin/finance/route.ts#L47)).
6. **P1-6**: Zero Transactional Emails for Authentication, Security, or Financial Receipts.
7. **P1-7**: Next.js Edge Middleware Excludes All API Routes ([`src/middleware.ts:131`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts#L131)).

### P2 — Medium (Operational Inconsistencies & Fragility)
1. **P2-1**: Unverified Bank Accounts Marked `isVerified: true` by Default ([`src/app/api/wallet/bank-accounts/route.ts:64`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/bank-accounts/route.ts#L64)).
2. **P2-2**: Idempotency Key Ignored on Withdrawal Requests ([`src/app/api/wallet/withdraw/route.ts:20`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/withdraw/route.ts#L20)).
3. **P2-3**: Notification Preferences Stored in Ephemeral In-Memory Map ([`src/app/api/user/notification-preferences/route.ts:24`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/user/notification-preferences/route.ts#L24)).
4. **P2-4**: Weak Password Change Endpoint Using PBKDF2 with Hardcoded Salt and Spoofable Cookie ([`src/app/api/user/password/route.ts:9`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/user/password/route.ts#L9)).
5. **P2-5**: Zero Financial Mutations Recorded in Audit Event Log.

---

## 21. Recommended Target Architecture (Conceptual Design)

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                      Authentication Layer                   │
 │       Enforce JWT on ALL /api routes via Middleware         │
 └──────────────────────────────┬──────────────────────────────┘
                                │
 ┌──────────────────────────────▼──────────────────────────────┐
 │                Strict Authorization Gate                    │
 │    Check ownership (resource.userId === session.userId)     │
 │            or require elevated RBAC permissions             │
 └──────────────────────────────┬──────────────────────────────┘
                                │
 ┌──────────────────────────────▼──────────────────────────────┐
 │               Idempotency Enforcement Engine                │
 │    Verify & lock idempotencyKey in IdempotencyKey table     │
 └──────────────────────────────┬──────────────────────────────┘
                                │
 ┌──────────────────────────────▼──────────────────────────────┐
 │                Atomic Database Transaction                  │
 │                                                             │
 │   1. Acquire Row Lock:                                      │
 │      SELECT * FROM "Wallet" WHERE "id" = $1 FOR UPDATE      │
 │                                                             │
 │   2. Enforce Invariant:                                     │
 │      ASSERT balance - debitAmount >= 0                      │
 │                                                             │
 │   3. Mutate Double-Entry Ledger:                            │
 │      INSERT INTO "LedgerEntry" (Debit/Credit, Amount, Ref)  │
 │                                                             │
 │   4. Atomically Enqueue Outbox Event:                       │
 │      INSERT INTO "NotificationOutbox" (Channel, Payload)    │
 └──────────────────────────────┬──────────────────────────────┘
                                │
 ┌──────────────────────────────▼──────────────────────────────┐
 │            Background Worker (Durable & Decoupled)          │
 │                                                             │
 │   Cron / Worker polls NotificationOutbox with backoff       │
 │   Sends via Resend SDK -> Updates Outbox item to SENT       │
 └─────────────────────────────────────────────────────────────┘
```

---

## 22. Implementation Roadmap

### Phase 0: Containment (Immediate Action)
- Permanently excise `simulateWebhook` from [`src/app/api/wallet/deposit/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/deposit/route.ts).
- Add `/api/:path*` to `src/middleware.ts` matcher to ensure API requests are guarded.
- Block unauthenticated access to `GET /api/disputes`.

### Phase 1: P0 Financial Vulnerabilities Closure
- Implement PostgreSQL row-locking (`SELECT ... FOR UPDATE`) or raw conditional updates (`WHERE balance >= amount`) across all debit operations in `WalletService` and `api/orders`.
- Patch `PUT /api/orders/[id]` to strictly permit status advancement only to authorized actors (Buyer delivery confirmation, Farmer packaging/dispatch, Admin arbitration).
- Secure `POST /api/wallet/escrow` with strict buyer ownership validation and status checking.
- Fix `POST /api/orders/[id]/cancel` to refund `order.buyer.userId` instead of `session.userId`.
- Fix Flutterwave checkout initialization to pre-create the Order and Payment records with server-computed prices.

### Phase 2: Transactional Email Infrastructure
- Install `@react-email` and `resend` packages.
- Design branded transactional email templates for:
  - Welcome & Email Verification
  - Password Reset Request & Confirmation
  - Wallet Deposit Receipt
  - Withdrawal Confirmation & Settlement
  - Order Invoice & Escrow Lock Notification
  - Proof of Delivery & Escrow Release
- Implement a durable background queue processor for `NotificationOutbox` using scheduled Cron jobs.

### Phase 3: Financial Integrity, Idempotency & Audit
- Enforce mandatory `Idempotency-Key` headers on all financial mutations backed by database storage.
- Connect `recordAuditEvent` to every deposit, withdrawal, refund, dispute, and webhook callback.
- Align platform commission rate across all files to `config.fees.platformFeeRate` (5.0%).

---

## 23. Exact Files Requiring Immediate Remediation

1. [`src/app/api/wallet/deposit/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/deposit/route.ts) — Remove simulated deposit backdoor (P0).
2. [`src/services/wallet.service.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/services/wallet.service.ts) — Implement atomic balance guards, row locks, and fix BOLA in escrow release (P0).
3. [`src/app/api/orders/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/route.ts) — Implement row locks on wallet balance during checkout (P0).
4. [`src/app/api/orders/[id]/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/%5Bid%5D/route.ts) — Enforce authorization on PUT status updates (P0).
5. [`src/app/api/wallet/escrow/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/wallet/escrow/route.ts) — Enforce buyer ownership and status verification (P0).
6. [`src/app/api/orders/[id]/cancel/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/%5Bid%5D/cancel/route.ts) — Refund `order.buyer.userId`, not `session.userId` (P0).
7. [`src/app/api/payments/flutterwave/initialize/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/payments/flutterwave/initialize/route.ts) — Calculate total from database prices and pre-bind order (P0).
8. [`src/app/api/payments/flutterwave/webhook/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/payments/flutterwave/webhook/route.ts) — Fix checkout settlement vs deposit mismatch (P0).
9. [`src/app/api/disputes/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/disputes/route.ts) — Add authentication to GET, ownership check to POST (P1).
10. [`src/app/api/payments/settlement/[orderId]/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/payments/settlement/%5BorderId%5D/route.ts) — Add ownership authorization on refund and view (P1).
11. [`src/jobs/index.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/jobs/index.ts) — Trigger escrow release in auto-complete job (P1).
12. [`src/middleware.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts) — Extend matcher to protect `/api/:path*` (P1).
13. [`src/lib/notifications/outbox.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/lib/notifications/outbox.ts) — Fix Prisma field comparison bug and build background worker (P1).

---

## CURRENT VERDICT

# **NOT SAFE FOR PRODUCTION**

The SmartHub AgroChain codebase has severe architectural and financial security vulnerabilities that allow unauthorized money creation, concurrent double-spending, arbitrary order and payment state falsification, and cross-user escrow manipulation. These issues must be systematically remediated following the Phase 0 and Phase 1 roadmap before production traffic or real financial capital is introduced.
