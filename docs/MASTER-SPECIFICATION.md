# SmartHub AgroChain — Master Specification (Source of Truth)

## Executive Overview

SmartHub AgroChain (AgroNexus) is a financial transactional agricultural marketplace connecting verified farmers, commercial buyers, and logistics providers in Nigeria. The platform enforces end-to-end database-authoritative operations across identity, catalog, order placement, escrow payments, fulfillment, dispute resolution, and bank settlement.

---

## Strict Implementation Guarantees

1. **Zero Mock Fallbacks**: No page, API route, service, or component may use fallback mock datasets (`const products = [...]`, `wallet?.balance ?? 50000`) to mask database or API failures.
2. **Server-Authoritative Computations**: Prices, totals, platform fees, taxes, escrow amounts, and inventory updates are calculated exclusively on the server from PostgreSQL database records.
3. **Single-Entry Transactional Wallet Ledger**: Every balance modification (deposits, payments, escrow locks, escrow releases, refunds, withdrawals) must be recorded in an atomic database transaction with a unique transaction reference (`WalletTransaction`).
4. **Role-Based Access & Resource Ownership**: Public self-assignment of privileged roles (e.g. `ADMIN`) is prohibited. Every modification endpoint must verify that the caller owns the targeted resource (`user.id === resource.userId`).
5. **Fail-Closed Security**: Missing environment variables (e.g. `JWT_SECRET`, gateway keys) must cause the application to fail startup or reject requests rather than fallback to hardcoded secrets or simulated success.

---

## Architectural Subsystems

### 1. Identity & Auth (`AUTH-RBAC`)
- **Authentication**: JWT HTTP-only session cookies via `jose` / custom HMAC SHA-256 tokens.
- **Roles**: `BUYER`, `FARMER`, `ADMIN` (Prisma schema source of truth).
- **KYC Requirement**: Farmers must complete document verification (`verificationStatus === "APPROVED"`) before publishing products to the public marketplace.

### 2. Marketplace & Inventory (`INVENTORY`, `MARKETPLACE`)
- **Catalog**: Category-indexed produce with units (`KG`, `BAG`, `TON`, `CRATE`, `PIECE`).
- **Concurrency-Safe Inventory Reservation**: Invariant: Two concurrent checkouts must never be able to successfully reserve more inventory than exists. Enforced via atomic conditional database updates.
- **Verification Enforcement**: Only products from `APPROVED` farmers are active on the public marketplace.

### 3. State Domain Separation & Order Lifecycle (`ORDERS`)
Status fields are explicitly separated by domain and maintained independently:
- **Order Status (`Order.status`)**: `PENDING` → `CONFIRMED` → `PROCESSING` → `READY_FOR_PICKUP` → `IN_TRANSIT` → `DELIVERED` → `COMPLETED` (or `CANCELLED`).
- **Payment Status (`Payment.paymentStatus`)**: `PENDING` → `PAID` → `FAILED` → `REFUNDED`.
- **Escrow Status (`Escrow.status` / Ledger Event)**: `LOCKED` → `RELEASED` (or `REFUNDED`).
- **Delivery Status (`Delivery.deliveryStatus`)**: `PENDING` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`.
- **Dispute Status (`Dispute.status`)**: `OPEN` → `UNDER_REVIEW` → `RESOLVED` (or `REJECTED`).

Transitions are strictly validated through a central domain state machine (`transitionOrder()`).

### 4. Wallet & Escrow Ledger (`WALLET-ESCROW`)
- **Balances**: `balance`, `escrow`, `pendingWithdrawal`, `frozen`.
- **Escrow Flow**: Funds locked on buyer payment → Held in escrow during fulfillment → Released to farmer wallet upon buyer/admin delivery confirmation minus platform commission.

### 5. Payments & Gateways (`PAYMENTS`)
- **Provider**: Live Flutterwave checkout & bank transfer payouts.
- **Webhook Authenticity Protocol**: Implement Flutterwave's documented `verif-hash` header verification and independent server-side transaction verification (`GET /v3/transactions/:id/verify`) before settlement.
- **Idempotency**: Webhooks process each transaction reference exactly once based on database uniqueness constraints.

### 6. Logistics & Proof of Delivery (`DELIVERY`)
- **Tracking**: Real-time delivery status updates and courier linkage.
- **POD Evidence**: Persistent database storage of receiver signatures, physical photos, and verified GPS coordinates.

### 7. Governance & Audit (`ADMIN`)
- **Metrics**: Real-time database aggregations for trade volume, active users, escrow liabilities, and disputes.
- **Immutable Audit Trail**: Append-only `AuditLog` table for all security and administrative actions.
