# SmartHub AgroChain — Production Capability Matrix (Version 1.0)

> **Document Type:** Master Capability Inventory, Gap Analysis & Re-ordered Execution Plan  
> **Directive:** Freeze feature-based sprint planning. Audit every single user journey and platform capability across UI, API, DB Persistence, Business Rules, and Automated Tests.  
> **Security & Authorization Audit:** See [`docs/security-authorization-audit.md`](file:///home/exploitx/Documents/MA'AJO/smarthub-agronexus/docs/security-authorization-audit.md) for RBAC matrix, tenant isolation, and audit trail verification.  
> **Target File:** `docs/production-capability-matrix.md`

---

## 1. EXECUTIVE SUMMARY & RE-PRIORITIZED ROADMAP

This document represents the single source of truth for **SmartHub AgroChain's** launch readiness. Capabilities are classified by operational status:
- **WORKING**: 100% connected from UI to PostgreSQL with enforced business rules and test coverage.
- **PARTIAL**: Interface or API exists, but missing persistence, state machine handlers, or business rules.
- **MOCK**: Page or API renders simulated mock data without real database hydration.
- **MISSING**: Interface or backend functionality does not exist.

### **Revised Launch Priority Tiers**

```text
 ┌───────────────────────────┐
 │ Priority A: Revenue       │ ──► Wallet, Withdrawals, Escrow, Settlement, Refunds, Shipping
 └───────────────────────────┘
               │
 ┌───────────────────────────┐
 │ Priority B: Commerce      │ ──► Search, Disputes, Invoices, Receipts, Reviews, Reorder
 └───────────────────────────┘
               │
 ┌───────────────────────────┐
 │ Priority C: Operations    │ ──► Admin Portal, KPI Metrics, Audit Logs, Export Reports
 └───────────────────────────┘
               │
 ┌───────────────────────────┐
 │ Priority D: Experience    │ ──► Email/SMS Adapters, Live Driver Dispatch, POD Signatures
 └───────────────────────────┘
```

---

## 2. BUYER CAPABILITIES MATRIX

| Capability | UI | API | DB | Rules | Tests | Status | Codebase Evidence / Handler |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **User Registration** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/signup/page.tsx` & `/api/auth/register` |
| **Authentication / Login** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/login/page.tsx` & `/api/auth/login` |
| **Password Reset / Update** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/dashboard/settings/page.tsx` & `/api/user/password` |
| **Profile & Address Update** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/user/profile` |
| **Browse Produce Catalog** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/products/page.tsx` & `/api/products` |
| **Category & State Filtering** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/products/page.tsx` |
| **Produce Text Search** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/products/page.tsx` |
| **Cart Quantity Adjustments** | ✅ | — | — | ✅ | ✅ | `WORKING` | `src/context/CartContext.tsx` |
| **Save Produce for Later** | ❌ | ❌ | ❌ | ❌ | ❌ | `MISSING` | Wishlist model not implemented |
| **Checkout & Shipping Estimator**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/orders` & `/api/shipping/calculate` |
| **Coupon Code Application** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/coupons/validate` |
| **Escrow Payment Execution** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/lib/escrow.ts` & `src/app/api/orders` |
| **Order Cancellation & Refund** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/components/dashboard/orders/OrdersList.tsx` & `/api/orders/[id]/cancel` |
| **Dispute Escalation Ticket** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/orders/[id]/dispute` |
| **PDF Invoice & Receipt Download**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/orders/[id]/invoice`, `/receipt` & `/print` |
| **Product Rating & Review** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/reviews` & `/api/products/[id]/reviews` |
| **One-Click Reorder** | ❌ | ❌ | — | — | ❌ | `MISSING` | Reorder endpoint missing |

---

## 3. FARMER CAPABILITIES MATRIX

| Capability | UI | API | DB | Rules | Tests | Status | Codebase Evidence / Handler |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Farmer Registration & Setup** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/signup/page.tsx` & `FarmerProfile` schema |
| **KYC Document Submission** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/farmer/kyc/page.tsx` & `/api/kyc/upload` |
| **Tier 1 Listing Limit Control** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/lib/trust.ts` (3 items cap for unverified) |
| **Produce Listing Creation** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/farmer/sell/page.tsx` & `/api/farmer/produce` |
| **Produce Detail & Batch Code** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/farmer/produce/[id]/page.tsx` |
| **Incoming Orders Management** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/app/farmer/listings/page.tsx` |
| **Order Fulfillment State Dispatch**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/fulfillment/[orderId]` & `FulfillmentService` |
| **Linked Bank Accounts CRUD** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/wallet/bank-accounts` |
| **Payout Withdrawal Processing**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/wallet/withdraw` |
| **Pause / Archive Listing** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `PATCH /api/farmer/produce/[id]/status` |
| **Transactional Email Adapter Integration**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `ResendEmailAdapter` in `src/lib/notifications/adapters.ts` |
| **Transactional SMS Adapter Integration**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `TermiiSMSAdapter` in `src/lib/notifications/adapters.ts` |
| **Outbox & Exponential Backoff Retry System**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `OutboxManager` in `src/lib/notifications/outbox.ts` |
| **Multi-Channel Notification Preferences**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `GET` & `PATCH /api/user/notification-preferences` |
| **Driver POD & Evidence Package API**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `POST /api/deliveries/[id]/pod` |

---

## 4. ADMIN CAPABILITIES MATRIX

| Capability | UI | API | DB | Rules | Tests | Status | Codebase Evidence / Handler |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Admin KYC Verification Review**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `POST /api/kyc/verify` |
| **Order Dispute Arbitration** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `/api/orders/[id]/dispute` |
| **Health Check & Telemetry** | ✅ | ✅ | — | ✅ | ✅ | `WORKING` | `/api/health` & `/api/metrics` |
| **Admin User Account Freeze/Suspension**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `PATCH /api/admin/users/[id]/freeze` |
| **Platform Fee & VAT Rate Config** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `GET` & `PATCH /api/admin/config/fees` |
| **Audit Log Portal View** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `GET /api/admin/audit-logs` |
| **Ledger CSV Exporter** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `GET /api/admin/ledger/export` |

---

## 5. LOGISTICS CAPABILITIES MATRIX

| Capability | UI | API | DB | Rules | Tests | Status | Codebase Evidence / Handler |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Fulfillment State Machine** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/services/fulfillment.service.ts` |
| **Shipping Fee Calculator** | ✅ | ✅ | — | ✅ | ✅ | `WORKING` | `/api/shipping/calculate` |
| **Live Driver Assignment** | 🟡 | ✅ | ✅ | 🟡 | ❌ | `PARTIAL` | Driver state machine present, real driver dispatch UI missing |
| **Proof of Delivery (POD) Signature**| ❌ | ❌ | ❌ | ❌ | ❌ | `MISSING` | Photo & signature upload missing |

---

## 6. PLATFORM OPERATIONS CAPABILITIES MATRIX

| Capability | UI | API | DB | Rules | Tests | Status | Codebase Evidence / Handler |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Authentication & Cookie Expiry**| ✅ | ✅ | ✅ | ✅ | ✅ | `WORKING` | `src/lib/session.ts` |
| **Event Bus & Domain Events** | — | ✅ | — | ✅ | ✅ | `WORKING` | `src/lib/events.ts` |
| **Structured Error Envelope** | — | ✅ | — | ✅ | ✅ | `WORKING` | `src/lib/api-response.ts` |
| **Distributed Tracing Header** | — | ✅ | — | ✅ | ✅ | `WORKING` | `src/lib/tracing.ts` |
| **Prometheus Telemetry Metrics**| — | ✅ | — | ✅ | ✅ | `WORKING` | `/api/metrics` |
| **External Email & SMS Adapters**| — | 🟡 | — | 🟡 | ❌ | `MOCK` | Logs notifications to console fallback |

---

## 7. TARGETED GAP CLOSURE BACKLOG (RE-ORDERED BY BUSINESS VALUE)

### **Gap Closure Phase 1 (Priority B — High Value Commerce Gaps)**
1. **Product Reviews & Ratings**: Build `POST /api/reviews` & connected review form on `/products/[id]`.
2. **PDF Invoice & Receipt Exporter**: Implement `GET /api/orders/[id]/invoice` (HTML-to-PDF / formatted printable receipt view).
3. **Produce Listing Status Toggle (Pause / Archive)**: Implement `PATCH /api/farmer/produce/[id]` for availability status updates.

### **Gap Closure Phase 2 (Priority C — Operations & Admin Gaps)**
4. **Admin User Suspension & Management**: Implement `PATCH /api/admin/users/[id]/status`.
5. **Ledger CSV Export**: Implement `GET /api/admin/exports/ledger` for CSV transaction dumps.

### **Gap Closure Phase 3 (Priority D — Experience & Delivery Gaps)**
6. **Notification Email/SMS Adapters**: Integrate SendGrid / Resend / Twilio adapters in `src/lib/notifications.ts`.
7. **Driver Delivery Signature / POD Upload**: Wire proof-of-delivery photos on dropoff.
