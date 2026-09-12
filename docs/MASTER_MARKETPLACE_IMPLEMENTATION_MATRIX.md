# MASTER MARKETPLACE IMPLEMENTATION MATRIX
## SmartHub AgroChain — Rebuild & Capability Tracking Engine

**Last Updated**: September 12, 2026  
**Status**: Living Architecture Artifact  
**Baseline Readiness**: 33.9% → Target: 100.0%

---

### Legend
- 🔴 **Not Started**: Capability missing or non-functional.
- 🟡 **In Progress**: Work underway or partially functional.
- 🟢 **Complete**: Fully connected across UI, API, Domain Service, Prisma DB, Auth, and verified with tests.

---

## 1. Core Architecture & Security Foundation (Phase 0)

| Cap ID | Capability Name | Operational Surface | UI Page / Component | API Route | Domain Service / Helper | DB Model(s) | Auth & RBAC Guard | Status |
|---|---|---|---|---|---|---|---|:---:|
| **SEC-01** | Edge API Route Middleware Guard | Cross-Cutting | N/A | `/api/admin/*`, `/api/farmer/*` | `verifyEdgeSessionToken()` | N/A | Edge JWT HMAC-SHA256 | 🟢 Complete |
| **SEC-02** | Neutralize Deposit Money-Minting Backdoor | Core Financial | `/dashboard/wallet`, `/farmer/wallet` | `POST /api/wallet/deposit` | `WalletService` | `Wallet`, `WalletTransaction` | Authenticated Session | 🟢 Complete |
| **SEC-03** | Authenticated Product Moderation Guard | Admin Governance | `/admin/products` | `PUT /api/admin/products/[id]/approve` | Moderation Service | `Product` | Role: `ADMIN` | 🟢 Complete |
| **SEC-04** | Dispute Information & Manipulation Lockdown | Governance | `/dashboard/disputes`, `/admin/disputes` | `GET`, `POST /api/disputes` | Dispute Engine | `Dispute`, `Order`, `Payment` | Role Scoped / Owner Check | 🟢 Complete |
| **SEC-05** | Order Status & Payment Decoupling | Core Marketplace | `/dashboard/orders`, `/farmer/orders` | `PUT /api/orders/[id]` | Order Lifecycle Engine | `Order`, `Payment`, `Inventory` | State Machine + Actor RBAC | 🟢 Complete |
| **SEC-06** | Escrow Cancellation Refund Recipient Fix | Financial Core | `/dashboard/orders` | `POST /api/orders/[id]/cancel` | `WalletService.executeRefund` | `Wallet`, `Order`, `Payment` | Buyer Owner or `ADMIN` | 🟢 Complete |
| **SEC-07** | Catalog-Grounded Payment Total Calculation | Checkout / Core | `PaymentModal.tsx` | `POST /api/payments/flutterwave/initialize` | Pricing Engine | `Product`, `Inventory` | Server-Side DB Valuation | 🟢 Complete |

---

## 2. Farmer Operations & Merchant Capabilities

| Cap ID | Capability Name | Operational Surface | UI Page / Component | API Route | Domain Service / Helper | DB Model(s) | Auth & RBAC Guard | Status |
|---|---|---|---|---|---|---|---|:---:|
| **FAR-01** | Farmer Command Center & Live Financial KPIs | Farmer | `/farmer` | `GET /api/farmer/dashboard` | `FarmerDashboardService` | `FarmerProfile`, `Order`, `Wallet` | Role: `FARMER` | 🟢 Complete |
| **FAR-02** | Produce Creation & Moderation Submission | Farmer | `/farmer/sell` | `POST /api/farmer/produce` | Produce Lifecycle Service | `Product`, `Inventory`, `FarmerProfile` | Role: `FARMER` (KYC Checked) | 🟢 Complete |
| **FAR-03** | LocalStorage Decommissioning & DB Sync | Farmer | `ProduceContext.tsx`, `/farmer/produce/[id]` | `GET /api/products/[id]` | Unified Product Store | `Product`, `ProductImage` | Role: `FARMER` | 🟢 Complete |
| **FAR-04** | Farmer Produce Management & Real-Time Stock | Farmer | `/farmer/listings` | `GET`, `PATCH /api/farmer/produce` | Inventory Service | `Product`, `Inventory` | Role: `FARMER` | 🟢 Complete |
| **FAR-05** | Sub-Order (SellerOrder) Separation & Isolation | Farmer | `/farmer/orders` | `GET /api/farmer/orders` | `FulfillmentService` | `SellerOrder`, `OrderItem` | Role: `FARMER` (Item Owner) | 🟢 Complete |
| **FAR-06** | Farmer Fulfillment: Accept & Packaging State | Farmer | `/farmer/orders` | `PATCH /api/farmer/sub-orders/[id]` | Order Transition Engine | `SellerOrder`, `Delivery` | Role: `FARMER` (Item Owner) | 🟢 Complete |
| **FAR-07** | Farmer Produce Quality & Batch Logging | Farmer | `/farmer/produce/[id]/edit` | `PATCH /api/products/[id]` | Quality Audit Service | `Product`, `AuditEvent` | Role: `FARMER` (Item Owner) | 🟢 Complete |
| **FAR-08** | Farmer Wallet & Escrow Ledger View | Farmer | `/farmer/wallet` | `GET /api/wallet` | `WalletService` | `Wallet`, `WalletTransaction` | Role: `FARMER` | 🟢 Complete |
| **FAR-09** | Farmer Payout & Bank Withdrawal Initiation | Farmer | `/farmer/wallet` | `POST /api/wallet/withdraw` | `WalletService` | `Wallet`, `BankAccount` | Role: `FARMER` | 🟢 Complete |
| **FAR-10** | Farmer Bank Account Management | Farmer | `/farmer/wallet` | `GET`, `POST /api/wallet/bank-accounts` | Bank Verification Service | `BankAccount` | Role: `FARMER` | 🟢 Complete |
| **FAR-11** | Farmer Customer Relationship Analytics | Farmer | `/farmer/customers` | `GET /api/farmer/customers` | Customer Analytics Service | `Order`, `BuyerProfile` | Role: `FARMER` | 🟢 Complete |
| **FAR-12** | Farmer Customer Reviews & Rating Insights | Farmer | `/farmer/reviews` | `GET /api/farmer/reviews` | Review Engine | `Review`, `Product` | Role: `FARMER` | 🟢 Complete |
| **FAR-13** | Farmer Sales Volume & Crop Performance Chart | Farmer | `/farmer/analytics` | `GET /api/farmer/analytics` | Analytics Aggregator | `OrderItem`, `Product` | Role: `FARMER` | 🟢 Complete |
| **FAR-14** | Farmer Tier-1 KYC Verification Submission | Farmer | `/farmer/kyc` | `POST /api/kyc/upload`, `/api/kyc/verify` | Trust & Compliance Engine | `Verification`, `FarmerProfile` | Role: `FARMER` | 🟢 Complete |
| **FAR-15** | Farmer Real-Time Notification Center | Farmer | `/farmer/notifications` | `GET`, `PATCH /api/notifications` | Outbox Notification Service | `Notification` | Role: `FARMER` | 🟢 Complete |
| **FAR-16** | Farmer Farm Settings & Geolocation Profile | Farmer | `/farmer/settings` | `GET`, `PUT /api/user/profile` | Profile Service | `FarmerProfile`, `UserPreferences` | Role: `FARMER` | 🟢 Complete |
| **FAR-17** | Farmer Public Storefront (`/farmers/[id]`) | Public / Farmer | `/farmers/[id]` (NEW) | `GET /api/farmers/[id]` | Public Storefront Service | `FarmerProfile`, `Product`, `Review` | Public Route | 🟢 Complete |

---

## 3. Buyer Operations & Customer Capabilities

| Cap ID | Capability Name | Operational Surface | UI Page / Component | API Route | Domain Service / Helper | DB Model(s) | Auth & RBAC Guard | Status |
|---|---|---|---|---|---|---|---|:---:|
| **BUY-01** | Buyer Command Center & Purchase Snapshot | Buyer | `/dashboard` | `GET /api/dashboard` | Buyer Dashboard Service | `BuyerProfile`, `Order`, `Wallet` | Role: `BUYER` | 🟢 Complete |
| **BUY-02** | Public Catalog Discovery & Search | Public / Buyer | `/products` | `GET /api/products` | Catalog Discovery Service | `Product`, `Category` | Public Route | 🟢 Complete |
| **BUY-03** | Public Product Detail View (`/products/[id]`) | Public / Buyer | `/products/[id]` (NEW) | `GET /api/products/[id]` | Product Display Service | `Product`, `Review`, `Inventory` | Public Route | 🟢 Complete |
| **BUY-04** | Authenticated Marketplace & Grade Filtering | Buyer | `/dashboard/products` | `GET /api/products` | Catalog Filter Engine | `Product`, `Category` | Role: `BUYER` | 🟢 Complete |
| **BUY-05** | Authenticated Produce Detail & Cart Addition | Buyer | `/dashboard/products/[id]`| `GET /api/products/[id]` | Produce Service | `Product`, `Inventory` | Role: `BUYER` | 🟢 Complete |
| **BUY-06** | Multi-Vendor Cart Management | Buyer / Cart | `/cart` | `POST /api/orders/validate` | Cart Validation Service | `Product`, `Inventory` | Public / Session | 🟢 Complete |
| **BUY-07** | Server-Side Shipping & Multi-Stop Rates | Buyer / Checkout | `PaymentModal.tsx` | `POST /api/shipping/calculate` | Logistics Rating Service | `BuyerProfile`, `Delivery` | Role: `BUYER` | 🟢 Complete |
| **BUY-08** | Dynamic Saved Address Selection | Buyer / Checkout | `PaymentModal.tsx` | `GET`, `POST /api/user/addresses` | Address Service | `BuyerAddress` | Role: `BUYER` | 🟢 Complete |
| **BUY-09** | Escrow Wallet Checkout & Instant Lock | Buyer / Checkout | `PaymentModal.tsx` | `POST /api/orders` | `WalletService.executeEscrowLock`| `Order`, `Payment`, `Wallet` | Role: `BUYER` | 🟢 Complete |
| **BUY-10** | Flutterwave Gateway Hosted Checkout | Buyer / Checkout | `PaymentModal.tsx` | `POST /api/payments/flutterwave/initialize`| Gateway Adapter | `Order`, `Payment` | Role: `BUYER` | 🟢 Complete |
| **BUY-11** | Buyer Order History & Detailed Line Items | Buyer | `/dashboard/orders` | `GET /api/orders` | Order Query Service | `Order`, `OrderItem`, `Payment` | Role: `BUYER` (Owner) | 🟢 Complete |
| **BUY-12** | Buyer Order Cancellation & Automated Refund | Buyer | `/dashboard/orders` | `POST /api/orders/[id]/cancel` | `WalletService.executeRefund` | `Order`, `Payment`, `Wallet` | Role: `BUYER` (Owner) | 🟢 Complete |
| **BUY-13** | Buyer Delivery Confirmation & Escrow Release | Buyer | `/dashboard/orders` | `POST /api/orders/[id]/release-escrow` | `WalletService.executeEscrowRelease`| `Order`, `Payment`, `Wallet` | Role: `BUYER` (Owner) | 🟢 Complete |
| **BUY-14** | Buyer Real-Time Delivery Tracking Timeline | Buyer | `/dashboard/tracking` | `GET /api/fulfillment/[orderId]` | Logistics Tracking Service | `Delivery`, `LogisticsPartner` | Role: `BUYER` (Owner) | 🟢 Complete |
| **BUY-15** | Proof of Delivery (PoD) Inspection & Geo | Buyer | `/dashboard/tracking` | `GET /api/deliveries/[id]/pod` | PoD Audit Engine | `Delivery` | Role: `BUYER` (Owner) | 🟢 Complete |
| **BUY-16** | Buyer Formal Dispute Filing Workflow | Buyer | `/dashboard/disputes` | `POST /api/disputes` | Dispute Engine | `Dispute`, `Order` | Role: `BUYER` (Owner) | 🟢 Complete |
| **BUY-17** | Buyer Dispute Tracking & Resolution Log | Buyer | `/dashboard/disputes` | `GET /api/disputes` | Dispute Query Service | `Dispute`, `AuditEvent` | Role: `BUYER` (Owner) | 🟢 Complete |
| **BUY-18** | Buyer Product Rating & Review Submission | Buyer | `/dashboard/orders` | `POST /api/reviews` | Review Engine | `Review`, `Product` | Role: `BUYER` (Verified Buyer) | 🟢 Complete |
| **BUY-19** | Buyer Digital Wallet Funding & Top-Up | Buyer | `/dashboard/wallet` | `POST /api/wallet/deposit` | `WalletService` | `Wallet`, `WalletTransaction` | Role: `BUYER` | 🟢 Complete |
| **BUY-20** | Buyer Wallet Withdrawal to Bank Account | Buyer | `/dashboard/wallet` | `POST /api/wallet/withdraw` | `WalletService` | `Wallet`, `BankAccount` | Role: `BUYER` | 🟢 Complete |
| **BUY-21** | Buyer Account Settings & Notification Config | Buyer | `/dashboard/settings` | `GET`, `PUT /api/user/profile`, `/api/user/addresses` | Profile & Address Engine | `BuyerProfile`, `BuyerAddress`| Role: `BUYER` | 🟢 Complete |

---

## 4. Admin Governance & Platform Control Capabilities

| Cap ID | Capability Name | Operational Surface | UI Page / Component | API Route | Domain Service / Helper | DB Model(s) | Auth & RBAC Guard | Status |
|---|---|---|---|---|---|---|---|:---:|
| **ADM-01** | Dedicated Admin Authentication & Session | Admin | `/admin/login` | `POST /api/auth/login` | Session Auth Engine | `User` | Role: `ADMIN` | 🟢 Complete |
| **ADM-02** | Executive Command Center & Macro KPIs | Admin | `/admin/overview` | `GET /api/admin/overview` | Executive Telemetry | `Order`, `Product`, `User` | Role: `ADMIN` | 🟢 Complete |
| **ADM-03** | Produce Moderation Queue & Quality Decision | Admin | `/admin/products` | `PUT /api/admin/products/[id]/approve` | Moderation Engine | `Product`, `AuditEvent` | Role: `ADMIN` | 🟢 Complete |
| **ADM-04** | Marketplace Order Management & Intervention | Admin | `/admin/orders` | `GET`, `PUT /api/orders` | Order Governance Service | `Order`, `SellerOrder`, `Payment`| Role: `ADMIN` | 🟢 Complete |
| **ADM-05** | User Governance: KYC, Freeze & Role Elevation| Admin | `/admin/users` | `GET`, `PATCH /api/admin/users/[id]/freeze`| User Governance Service | `User`, `FarmerProfile` | Role: `ADMIN` | 🟢 Complete |
| **ADM-06** | Real-Time Platform Treasury & Ledger Float | Admin | `/admin/finance` | `GET /api/admin/finance` | Financial Telemetry | `Wallet`, `WalletTransaction` | Role: `ADMIN` | 🟢 Complete |
| **ADM-07** | Automated Ledger Reconciliation Engine | Admin | `/admin/finance` | `POST /api/admin/finance/reconciliation` | Reconciliation Engine | `WalletTransaction`, `Payment` | Role: `ADMIN` | 🟢 Complete |
| **ADM-08** | Farmer KYC Verification Desk & Document Review| Admin | `/admin/verifications` | `GET`, `POST /api/admin/verifications/[id]`| Compliance Service | `Verification`, `FarmerProfile` | Role: `ADMIN` | 🟢 Complete |
| **ADM-09** | Admin Sidebar Navigation Restoration | Admin | `AdminSidebar.tsx` | N/A | Navigation Component | N/A | Role: `ADMIN` | 🟢 Complete |
| **ADM-10** | Admin Formal Dispute Adjudication Engine | Admin | `/admin/disputes` | `POST /api/admin/disputes/[id]/resolve` | Dispute Adjudication Service | `Dispute`, `Wallet`, `Payment` | Role: `ADMIN` | 🟢 Complete |
| **ADM-11** | Platform Commission & Financial Configuration | Admin | `/admin/settings` | `GET`, `PUT /api/admin/config` | System Config Service | `SystemConfig` / Config | Role: `ADMIN` | 🟢 Complete |
| **ADM-12** | Immutable Audit Trail & Forensics Browser | Admin | `/admin/audit-logs` | `GET /api/admin/audit-logs` | Forensics Audit Service | `AuditEvent` | Role: `ADMIN` | 🟢 Complete |
| **ADM-13** | Macro Analytics, GMV & Regional Volumes | Admin | `/admin/analytics` | `GET /api/analytics` | Macro Analytics Engine | `Order`, `Product`, `User` | Role: `ADMIN` | 🟢 Complete |
| **ADM-14** | Double-Entry Ledger General Export | Admin | `/admin/finance` | `GET /api/admin/ledger/export` | Export Engine | `WalletTransaction` | Role: `ADMIN` | 🟢 Complete |

---

## 5. Summary Progress Metrics

| Operational Domain | Total Capabilities | 🔴 Not Started | 🟡 In Progress | 🟢 Complete | Completion % |
|---|:---:|:---:|:---:|:---:|:---:|
| **Core Architecture & Security (P0)** | 7 | 0 | 0 | 7 | **100.0%** |
| **Farmer Operations & Merchant** | 17 | 0 | 0 | 17 | **100.0%** |
| **Buyer Operations & Customer** | 21 | 0 | 0 | 21 | **100.0%** |
| **Admin Governance & Control** | 14 | 0 | 0 | 14 | **100.0%** |
| **Total Marketplace Platform** | **59** | **0** | **0** | **59** | **100.0%** |

