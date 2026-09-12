# SMART HUB AGROCHAIN
## MASTER MARKETPLACE AUDIT — FARMER, BUYER & ADMIN

**Repository**: `smarthub-agronexus` (`smarthub-agrochain`)  
**Audit Date**: September 12, 2026  
**Audit Type**: Deep, Evidence-Based Forensic Engineering Audit (Read-Only)  
**Evaluator**: Antigravity Autonomous Systems & Forensic Engineering Architecture  
**Directive**: Independent verification across UI, Frontend Logic, API/Server Routes, Domain Services, Database Schema, Authentication/RBAC, and End-to-End Workflows.

---

# 1. EXECUTIVE SUMMARY

An exhaustive, evidence-based engineering audit was conducted across the **SmartHub AgroChain** platform. The system was audited not as three isolated dashboards, but as **one unified three-sided marketplace and financial system** serving three distinct operational surfaces: **Farmer (Merchant/Seller)**, **Buyer (Customer/Consumer)**, and **Admin (Governance & Control Plane)**.

### Verdict: **FRACTURED END-TO-END LIFECYCLE — NOT PRODUCTION READY**

While individual pages exhibit high visual fidelity and certain isolated modules (such as KYC verification and double-entry ledger calculations) contain robust database transactions, the **core marketplace lifecycle is broken across critical handoffs**:

$$\text{Farmer (Create)} \longrightarrow \text{Admin (Moderate)} \longrightarrow \text{Buyer (Discover/Buy)} \longrightarrow \text{Farmer (Fulfill)} \longrightarrow \text{Delivery} \longrightarrow \text{Settlement}$$

### Key Empirical Findings:
1. **Broken Product Moderation Lifecycle (P0)**: In [`prisma/schema.prisma`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/prisma/schema.prisma), `Product` has no moderation enum (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `SUSPENDED`). It only has a single boolean `isAvailable: Boolean`. A farmer can unilaterally set `isAvailable = true` via [`PATCH /api/farmer/produce/[id]/status`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/farmer/produce/%5Bid%5D/status/route.ts) or [`PATCH /api/products/[id]`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/products/%5Bid%5D/route.ts), completely bypassing admin approval and publishing directly to the buyer showroom.
2. **Unauthenticated Admin Product Approval (P0)**: [`PUT /api/admin/products/[id]/approve`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/admin/products/%5Bid%5D/approve/route.ts) has zero authentication checks and simply toggles `isAvailable`. Any unauthenticated actor on the internet can approve or reject products.
3. **Monolithic Order Architecture with Multi-Farmer Collision (P0)**: Cart items from multiple farmers are combined into a single monolithic `Order` record with a single `status` and single `delivery`. If Farmer A marks an order dispatched or delivered, Farmer B's produce and the entire master order status are mutated simultaneously. Seller-specific order units (Sub-Orders) are completely missing.
4. **Arbitrary Order Status and Payment State Manipulation (P0)**: [`PUT /api/orders/[id]`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/%5Bid%5D/route.ts) enforces transition rules but contains **zero actor authorization checks**. Any authenticated user can transition any order to `CONFIRMED`, which automatically executes `tx.payment.update({ data: { paymentStatus: "PAID" } })`, marking the order paid without any real funds moving.
5. **Admin Dispute Resolution is 100% Mocked (P0)**: [`src/app/admin/disputes/page.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/admin/disputes/page.tsx) modifies only local React state (`setDisputes`) when resolving disputes. There is **no backend API route** (`/api/admin/disputes/[id]`) to adjudicate disputes, refund buyers, or release escrow funds.
6. **Information Disclosure & Arbitrary Payment Freezing via Disputes (P0)**: [`GET /api/disputes`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/disputes/route.ts) is unauthenticated and exposes buyer names and emails. [`POST /api/disputes`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/disputes/route.ts) does not verify order ownership and resets `paymentStatus` to `PENDING` on any order ID passed in the payload.
7. **Client-Controlled Pricing & Hardcoded Checkout Data (P0)**: [`PaymentModal.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/components/cart/PaymentModal.tsx) hardcodes the shipping address as `"Lagos Port Terminal, Nigeria"` and passes client-computed totals to Flutterwave hosted checkout.
8. **Missing Public Product and Farmer Pages (P1)**: The public marketplace ([`/products`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/products/page.tsx)) displays hardcoded showcase products and redirects "View Product Details" to `/signup`. There is no public `/products/[id]` page (only an authenticated `/dashboard/products/[id]`), and there is **no public farmer storefront/profile** (`/farmers/[id]`) anywhere in the application.
9. **Conflicting Dual State Management (P1)**: The farmer produce flow maintains duplicate state in browser `localStorage` via [`ProduceContext.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/context/ProduceContext.tsx) while other pages query PostgreSQL via Prisma. [`/farmer/produce/[id]`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/farmer/produce/%5Bid%5D/page.tsx) prioritizes `localStorage` over the database.
10. **Orphaned Admin Navigation (P2)**: The Admin Sidebar ([`AdminSidebar.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/components/admin/AdminSidebar.tsx)) completely omits navigation links to **Disputes** (`/admin/disputes`) and **KYC Verifications** (`/admin/verifications`).

---

# 2. ARCHITECTURE OVERVIEW

### Application Stack
- **Framework**: Next.js 16.1.2 (App Router), React 19.2.3, TypeScript 5.
- **Styling & Motion**: Tailwind CSS 4, Framer Motion 12.
- **Database & ORM**: PostgreSQL hosted on Supabase, managed via Prisma ORM 6.19.3.
- **Authentication**: Custom JWT session stored in HTTP-only cookie (`smarthub_session`), signed with HMAC-SHA256 via `jose` and Web Crypto API.
- **Edge Middleware**: [`src/middleware.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts) with matcher strictly covering `/dashboard/:path*`, `/farmer/:path*`, and `/admin/:path*`. **Crucially, `/api/:path*` is omitted from the matcher.**

### High-Level Domain Relationships
```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           SMART HUB AGROCHAIN                           │
├───────────────────────────┬───────────────────────────┬─────────────────┤
│          FARMER           │           BUYER           │      ADMIN      │
│  (Merchant Operations)    │   (Discovery & Orders)    │  (Governance)   │
└─────────────┬─────────────┴─────────────┬─────────────┴────────┬────────┘
              │                           │                      │
              ▼                           ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES                                 │
│  /api/farmer/*            /api/products/*             /api/admin/*      │
│  /api/orders/*            /api/orders/*               /api/orders/*     │
│  /api/wallet/*            /api/wallet/*               /api/finance/*    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DOMAIN SERVICES                              │
│   WalletService   •   PaymentService   •   FulfillmentService          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRISMA ORM / POSTGRES                         │
│  User • FarmerProfile • BuyerProfile • Product • Inventory • Order      │
│  OrderItem • Payment • Delivery • Wallet • WalletTransaction • Dispute   │
│  Verification • Review • AuditEvent • NotificationOutbox               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 3. ROUTE INVENTORY

The repository contains **41 Page Routes** and **70 API Routes**. Below is the complete functional evaluation of every page route:

| Role | Route | Page Exists | Functional Status | Backend Connected | DB Connected | Auth Protected | Architectural Notes & Deficits |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| **Public** | `/` | ✅ Yes | Fully Implemented | Static / Client | N/A | Public | Landing page with 4-Step Trust Protocol. |
| **Public** | `/about` | ✅ Yes | Fully Implemented | Static | N/A | Public | About page with partner logos. |
| **Public** | `/contact` | ✅ Yes | Partially Implemented | Static | ❌ No | Public | Form submissions are cosmetic (no API POST). |
| **Public** | `/how-it-works` | ✅ Yes | Fully Implemented | Static | N/A | Public | Platform educational walkthrough. |
| **Public** | `/login` | ✅ Yes | Fully Implemented | `/api/auth/login` | ✅ Yes | Public | Authenticates credentials and sets `smarthub_session`. |
| **Public** | `/signup` | ✅ Yes | Fully Implemented | `/api/auth/register`| ✅ Yes | Public | Registers users with default role `BUYER`. |
| **Public** | `/products` | ✅ Yes | Partially Implemented | Static Data | ❌ No | Public | Uses `showcase-products.ts`. Redirects "View Details" to `/signup`. No DB link. |
| **Public** | `/products/[id]` | ❌ **MISSING** | Missing | N/A | N/A | N/A | **Critical Gap**: No public product detail page exists. |
| **Public** | `/farmers/[id]` | ❌ **MISSING** | Missing | N/A | N/A | N/A | **Critical Gap**: No public farmer storefront/profile page exists. |
| **Public** | `/cart` | ✅ Yes | Partially Implemented | `/api/orders/validate`| ✅ Yes | Public / Session | Validates cart, opens `PaymentModal`. Hardcodes shipping. |
| **Buyer** | `/dashboard` | ✅ Yes | Fully Implemented | `/api/dashboard` | ✅ Yes | Enforced (BUYER) | Buyer overview KPIs and recent orders. |
| **Buyer** | `/dashboard/products` | ✅ Yes | Fully Implemented | `/api/products` | ✅ Yes | Enforced (BUYER) | Authenticated marketplace with filtering and live DB queries. |
| **Buyer** | `/dashboard/products/[id]`| ✅ Yes | Fully Implemented | `/api/products/[id]`| ✅ Yes | Enforced (BUYER) | Authenticated product details view with "Add to Cart". |
| **Buyer** | `/dashboard/orders` | ✅ Yes | Fully Implemented | `/api/orders` | ✅ Yes | Enforced (BUYER) | Order list, cancel refund, and escrow release confirmation. |
| **Buyer** | `/dashboard/tracking` | ✅ Yes | Partially Implemented | `/api/fulfillment/*`| ✅ Yes | Enforced (BUYER) | Shipment timeline and driver tracking view. |
| **Buyer** | `/dashboard/wallet` | ✅ Yes | Fully Implemented | `/api/wallet` | ✅ Yes | Enforced (BUYER) | Buyer ledger, balance, deposit, bank accounts. |
| **Buyer** | `/dashboard/disputes` | ✅ Yes | Partially Implemented | `/api/disputes` | ✅ Yes | Enforced (BUYER) | Dispute list, but resolution relies on unverified APIs. |
| **Buyer** | `/dashboard/financing` | ✅ Yes | UI Only / Mock | ❌ No | ❌ No | Enforced (BUYER) | Trade financing promo page (no backend). |
| **Buyer** | `/dashboard/notifications`| ✅ Yes | Fully Implemented | `/api/notifications`| ✅ Yes | Enforced (BUYER) | Notification feed with mark-as-read. |
| **Buyer** | `/dashboard/settings` | ✅ Yes | Partially Implemented | `/api/user/*` | Partial | Enforced (BUYER) | Profile update works; notification preferences in ephemeral memory. |
| **Farmer**| `/farmer` | ✅ Yes | Fully Implemented | `/api/farmer/dashboard`| ✅ Yes | Enforced (FARMER)| Farmer command center KPIs and produce submissions. |
| **Farmer**| `/farmer/sell` | ✅ Yes | Partially Implemented | `/api/farmer/produce`| ✅ Yes | Enforced (FARMER)| Produce creation form. Dual-writes to `localStorage`. |
| **Farmer**| `/farmer/listings` | ✅ Yes | Partially Implemented | `/api/farmer/produce`| ✅ Yes | Enforced (FARMER)| Produce list, inline edit, delete. Bypasses admin approval. |
| **Farmer**| `/farmer/produce/[id]` | ✅ Yes | Inconsistent / Broken | Local / `/api/products`| Partial | Enforced (FARMER)| Reads from `ProduceContext` (localStorage) before DB. |
| **Farmer**| `/farmer/produce/detail`| ✅ Yes | Dead / Static Code | ❌ No | ❌ No | Enforced (FARMER)| Completely hardcoded "Abuja Yam" static page. |
| **Farmer**| `/farmer/orders` | ✅ Yes | Partially Implemented | `/api/orders` | ✅ Yes | Enforced (FARMER)| Order table with unvalidated `PUT /api/orders/[id]`. |
| **Farmer**| `/farmer/wallet` | ✅ Yes | Fully Implemented | `/api/wallet` | ✅ Yes | Enforced (FARMER)| Payouts, withdrawals, bank accounts, statements. |
| **Farmer**| `/farmer/customers` | ✅ Yes | Fully Implemented | `/api/farmer/customers`| ✅ Yes | Enforced (FARMER)| Buyer order aggregation table. |
| **Farmer**| `/farmer/reviews` | ✅ Yes | Partially Implemented | `/api/farmer/reviews`| ✅ Yes | Enforced (FARMER)| Farmer reviews view. Buyer cannot submit reviews. |
| **Farmer**| `/farmer/analytics` | ✅ Yes | Fully Implemented | `/api/farmer/analytics`| ✅ Yes | Enforced (FARMER)| Revenue and sales volume charts. |
| **Farmer**| `/farmer/kyc` | ✅ Yes | Partially Implemented | `/api/kyc/*` | ✅ Yes | Enforced (FARMER)| Document submission form. Uses hardcoded PDF URL. |
| **Farmer**| `/farmer/notifications`| ✅ Yes | Fully Implemented | `/api/notifications`| ✅ Yes | Enforced (FARMER)| Notification center. |
| **Farmer**| `/farmer/settings` | ✅ Yes | Partially Implemented | `/api/user/*` | Partial | Enforced (FARMER)| Farm info, banking, preferences in memory. |
| **Admin** | `/admin` | ✅ Yes | Redirect Route | N/A | N/A | Enforced (ADMIN) | Redirects to `/admin/overview`. |
| **Admin** | `/admin/login` | ✅ Yes | Fully Implemented | `/api/auth/login` | ✅ Yes | Public | Dedicated admin authentication screen. |
| **Admin** | `/admin/overview` | ✅ Yes | Fully Implemented | `/api/admin/overview`| ✅ Yes | Enforced (ADMIN) | GMV, users, orders, revenue, moderation queue. |
| **Admin** | `/admin/products` | ✅ Yes | Inconsistent / Broken | `/api/admin/products`| ✅ Yes | Enforced (ADMIN) | Displays products. "Add Crop" is fake. Unauthenticated approve API. |
| **Admin** | `/admin/orders` | ✅ Yes | Fully Implemented | `/api/orders` | ✅ Yes | Enforced (ADMIN) | Marketplace-wide orders console. |
| **Admin** | `/admin/users` | ✅ Yes | Partially Implemented | `/api/admin/users` | ✅ Yes | Enforced (ADMIN) | User list & freeze/activate works. "Add User" is fake. |
| **Admin** | `/admin/finance` | ✅ Yes | Fully Implemented | `/api/admin/finance` | ✅ Yes | Enforced (ADMIN) | Platform treasury, reconciliation, and ledger float. |
| **Admin** | `/admin/verifications` | ✅ Yes | Fully Implemented | `/api/admin/verifications`| ✅ Yes | Enforced (ADMIN) | **Orphan Page**: KYC review desk works, but missing from sidebar. |
| **Admin** | `/admin/disputes` | ✅ Yes | Broken / UI Only | `/api/disputes` | ❌ No | Enforced (ADMIN) | **Orphan Page**: Missing from sidebar. Resolve button is 100% mocked. |
| **Admin** | `/admin/analytics` | ✅ Yes | Fully Implemented | `/api/analytics` | ✅ Yes | Enforced (ADMIN) | Platform macro analytics. |
| **Admin** | `/admin/content` | ✅ Yes | UI Only / Placeholder | ❌ No | ❌ No | Enforced (ADMIN) | CMS mock page. |
| **Admin** | `/admin/notifications`| ✅ Yes | Fully Implemented | `/api/notifications`| ✅ Yes | Enforced (ADMIN) | Admin alert center. |
| **Admin** | `/admin/settings` | ✅ Yes | Partially Implemented | `/api/admin/config` | ✅ Yes | Enforced (ADMIN) | Commission fees and system flags. |

---

# 4. FARMER AUDIT

### Detailed Subsystems:
1. **Produce Creation (`/farmer/sell`)**:
   - Accepts name, variety, unit (`KG`, `BAG`, `TON`, `CRATE`, `PIECE`), price, quantity, location, harvest date.
   - Enforces KYC check: unverified farmers are blocked or subject to trust limits via `evaluateTrustPolicy()`.
   - **Flaw**: Saves to Prisma DB with `isAvailable: false`, but simultaneously calls `ProduceContext.addListing()` saving a duplicate copy in browser `localStorage`.
2. **Produce Listings (`/farmer/listings`)**:
   - Queries `GET /api/farmer/produce`. Displays stock, price, status badge.
   - **Flaw**: Toggling availability sends `PATCH /api/products/[id]` with `{ isAvailable: !currentStatus }`. This allows farmers to self-publish produce without admin approval.
3. **Produce Detail View (`/farmer/produce/[id]`)**:
   - **Flaw**: Checks `ProduceContext.getListingById(id)` from `localStorage` first. If present, it never fetches the database. If absent, it queries `GET /api/products/[id]` and synthesizes `status: data.isAvailable ? "Active" : "Pending"`.
4. **Orders Management (`/farmer/orders`)**:
   - Displays orders containing farmer items.
   - Status actions trigger `PUT /api/orders/${orderId}` with `{ status: nextStatus }`.
   - **Flaw**: Mutates the parent order directly, affecting all other farmers whose produce is part of the same cart checkout.
5. **Wallet (`/farmer/wallet`)**:
   - Displays real-time available balance vs escrow hold.
   - Linked bank accounts CRUD and withdrawal requests backed by PostgreSQL transactions.
   - Payout history and transaction ledger exports functional.

---

# 5. BUYER AUDIT

### Detailed Subsystems:
1. **Discovery (`/products` & `/dashboard/products`)**:
   - Public showroom (`/products`) is completely disconnected from Prisma database. It renders 8 hardcoded showcase items from `showcase-products.ts`. Clicking "View Product Details" redirects prospective buyers to `/signup`.
   - Authenticated marketplace (`/dashboard/products`) connects to live database with category, state, and price filters.
2. **Product Details (`/dashboard/products/[id]`)**:
   - Renders image gallery, specifications table, farmer bio, and related products.
   - "Add to Cart" updates `CartContext` (`localStorage`).
   - **Flaw**: There is no public counterpart (`/products/[id]`). Search engine indexing and social sharing are impossible.
3. **Cart & Checkout (`/cart` & `PaymentModal.tsx`)**:
   - `handleCheckout` validates inventory with `POST /api/orders/validate`.
   - Opens `PaymentModal`.
   - **Flaws**:
     - Shipping address is hardcoded to `"Lagos Port Terminal, Nigeria"` with incoterm `"FOB"`.
     - No input fields for delivery address, state, LGA, or delivery contact.
     - External card payment passes client-computed `totalAmount` to Flutterwave initialization without server recalculation.
4. **Order Tracking (`/dashboard/orders` & `/dashboard/tracking`)**:
   - Real-time order list with timeline generation.
   - Buyer can cancel unconfirmed orders (restoring stock and refunding wallet).
   - Buyer can confirm delivery via `POST /api/orders/[id]/release-escrow`, releasing funds to the farmer.
5. **Reviews & Ratings**:
   - **Flaw**: While `POST /api/reviews` exists with strict verification logic, there is no modal, form, or button in the Buyer UI to trigger review submission.

---

# 6. ADMIN AUDIT

### Detailed Subsystems:
1. **Governance Dashboard (`/admin/overview`)**:
   - Calculates GMV, revenue, active buyers, and active farmers via Prisma aggregations.
   - Moderation queue displays pending verifications and flagged items.
2. **Product Moderation Desk (`/admin/products`)**:
   - Fetches all products via `GET /api/admin/products`.
   - Maps `status: p.isAvailable ? "Approved" : "Pending"`.
   - "Approve" calls `PUT /api/admin/products/[id]/approve` with `{ isApproved: true }`.
   - **Flaws**:
     - `PUT /api/admin/products/[id]/approve` is completely unauthenticated.
     - "Add Crop" button generates a fake in-memory object and does not save to DB.
3. **User Governance (`/admin/users`)**:
   - Displays all registered users.
   - Toggle status calls `PATCH /api/admin/users` to freeze or activate accounts.
   - **Flaw**: "Add User" button generates a fake in-memory user and does not save to DB. Column header incorrectly says `"Order ID"`.
4. **Disputes Panel (`/admin/disputes`)**:
   - **Flaws**:
     - Omitted from `AdminSidebar.tsx`.
     - "Resolve" button only modifies local React state (`setDisputes`).
     - No backend API endpoint exists to adjudicate disputes, refund buyers, or release escrow funds.
5. **KYC Verification Queue (`/admin/verifications`)**:
   - Review desk displays farmer identity documents and compliance history.
   - Approval and rejection with mandatory remarks functional and persisted in DB.
   - **Flaw**: Omitted from `AdminSidebar.tsx`.

---

# 7. PRODUCT MODERATION LIFECYCLE AUDIT

### Lifecycle Trace Matrix
| Step | Action | Actor | Backend Endpoint | Database Mutation | Audit Event | Status |
|---|---|---|---|---|:---:|:---:|
| 1 | Create Produce | Farmer | `POST /api/farmer/produce` | `Product.create({ isAvailable: false })` | ❌ No | 🟢 Pass |
| 2 | Submit for Review | Farmer | ❌ None (Automatic) | Implicit upon creation | ❌ No | 🟡 Implicit |
| 3 | Retrieve Pending Queue | Admin | `GET /api/admin/products` | `Product.findMany()` | ❌ No | 🟢 Pass |
| 4 | Admin Inspection | Admin | UI Modal | None | ❌ No | 🟢 Pass |
| 5 | Admin Approval | Admin | `PUT /api/admin/products/[id]/approve` | `Product.update({ isAvailable: true })` | ❌ No | 🔴 **Broken (Unauthenticated)** |
| 6 | Admin Rejection | Admin | `PUT /api/admin/products/[id]/approve` | `Product.update({ isAvailable: false })` | ❌ No | 🔴 **Broken (No reason saved)** |
| 7 | Farmer Self-Publish | Farmer | `PATCH /api/farmer/produce/[id]/status` | `Product.update({ isAvailable: true })` | ❌ No | 🔴 **Security Bypass** |
| 8 | Buyer Discovery | Buyer | `GET /api/products` | `Product.findMany({ isAvailable: true })` | N/A | 🟡 Premature Visibility |

---

# 8. ORDER STATE MACHINE AUDIT

### Complete State Machine Comparison
| Order State | Valid Next States in Code | Actual Backend Enforcement | Who Can Trigger (Design) | Who Can Trigger (Current Code) |
|---|---|:---:|---|---|
| `PENDING` | `CONFIRMED`, `CANCELLED` | ✅ Enforced | Farmer (Accept), Buyer (Cancel), Admin | **ANY Authenticated User** |
| `CONFIRMED` | `PROCESSING`, `CANCELLED` | ✅ Enforced | Farmer (Prepare), Admin | **ANY Authenticated User** (Sets `PAID`!) |
| `PROCESSING` | `READY_FOR_PICKUP` | ✅ Enforced | Farmer (Package) | **ANY Authenticated User** |
| `READY_FOR_PICKUP` | `IN_TRANSIT` | ✅ Enforced | Farmer / Logistics Driver | **ANY Authenticated User** |
| `IN_TRANSIT` | `DELIVERED` | ✅ Enforced | Logistics Driver / Admin | **ANY Authenticated User** |
| `DELIVERED` | `COMPLETED` | ✅ Enforced | Buyer (Confirm Receipt), Admin | **ANY Authenticated User** |
| `COMPLETED` | *(Terminal)* | ✅ Enforced | None | None |
| `CANCELLED` | *(Terminal)* | ✅ Enforced | None | None |

---

# 9. VERIFICATION & TRUST AUDIT

```text
Farmer Profile (Pending)
       │
       ▼
Farmer uploads document (/farmer/kyc)
       │
       ▼
POST /api/kyc/upload
       │  (Saves Verification record; sets farmerProfile.verificationStatus = PENDING)
       ▼
Admin Queue (/admin/verifications)
       │
       ▼
PUT /api/admin/verifications/[id]
       │  (Transactionally updates Verification + FarmerProfile.verificationStatus)
       │  (Writes AuditEvent category: KYC)
       ▼
Farmer Profile (Approved)
       │
       ▼
Farmer produce now eligible for Buyer queries (MKT-001)
```

---

# 10. ACCOUNT MANAGEMENT AUDIT

| Field / Setting | User Profile | Farmer Profile | Buyer Profile | Persistence Mechanism |
|---|:---:|:---:|:---:|---|
| **Full Name** | `User.fullName` | — | — | PostgreSQL (`PATCH /api/user/profile`) |
| **Email** | `User.email` | — | — | PostgreSQL (`PATCH /api/user/profile`) |
| **Phone Number** | `User.phoneNumber` | — | — | PostgreSQL (`PATCH /api/user/profile`) |
| **Password** | `User.password` | — | — | PBKDF2 hash (`POST /api/user/password`) |
| **Avatar Image** | `User.profileImage` | — | — | Base64 string in DB |
| **Farm Name / Address** | — | `FarmerProfile` | — | PostgreSQL (`PATCH /api/user/profile`) |
| **State / LGA** | — | `FarmerProfile` | `BuyerProfile` | PostgreSQL (`PATCH /api/user/profile`) |
| **Notification Channels** | — | — | — | ❌ Ephemeral Node.js `Map` (Lost on restart) |

---

# 11. DATABASE AUDIT

```text
┌──────────────────┐       1:1       ┌──────────────────┐
│       User       ├─────────────────┤   BuyerProfile   │
└────────┬─────────┘                 └────────┬─────────┘
         │ 1:1                                │ 1:N
┌────────┴─────────┐                 ┌────────┴─────────┐
│  FarmerProfile   │                 │      Order       │
└────────┬─────────┘                 └────────┬─────────┘
         │ 1:N                                │ 1:N
┌────────┴─────────┐       1:N       ┌────────┴─────────┐
│     Product      ├─────────────────┤    OrderItem     │
└────────┬─────────┘                 └──────────────────┘
         │ 1:1
┌────────┴─────────┐
│    Inventory     │
└──────────────────┘
```

### Missing Entities Required for Full Functionality:
1. **`ProductStatus` Enum**: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`.
2. **`SellerOrder` (Sub-Order) Entity**: Required to split a multi-farmer cart into discrete fulfillment and escrow units.
3. **`ShippingAddress` Entity**: Required to save customer delivery addresses, state, LGA, and logistics notes.
4. **`UserNotificationPreferences` Table**: Required to persist notification settings across server restarts.

---

# 12. API AUDIT & SECURITY VULNERABILITIES

### P0 Vulnerabilities:
1. **Unprotected Product Approval**: `PUT /api/admin/products/[id]/approve` allows anyone to approve or reject commodities.
2. **Unchecked Order Advancement**: `PUT /api/orders/[id]` allows anyone to mark orders as `CONFIRMED` and `PAID`.
3. **Public Dispute Leak & Hijack**: `GET /api/disputes` is unauthenticated; `POST /api/disputes` resets order payment to `PENDING` without ownership verification.
4. **Admin Cancellation Theft**: `POST /api/orders/[id]/cancel` refunds `session.userId` (the admin) instead of `order.buyer.userId`.
5. **Simulated Deposit Backdoor**: `POST /api/wallet/deposit` contains `simulateWebhook: true` allowing arbitrary balance minting.

---

# 13. AUTHORIZATION & RBAC AUDIT

- **Edge Middleware Exclusion**: `src/middleware.ts:131` matchers only cover `/dashboard`, `/farmer`, and `/admin`. All `/api/*` routes are excluded and must manually verify sessions.
- **Missing Role Scopes**: All admins have global access. No distinction between Support, Operations, and Finance roles.

---

# 14. UI ↔ BACKEND ↔ DATABASE MISMATCH REPORT

| Feature | UI Implementation | Backend API | Database Model | Actual Status | Problem Summary |
|---|---|---|---|:---:|---|
| **Product Approval** | `/admin/products` has Approve/Reject buttons | `PUT /api/admin/products/[id]/approve` | `Product.isAvailable` | `BROKEN` | Conflates `isAvailable` with approval; endpoint has zero auth. |
| **Farmer Produce Detail** | `/farmer/produce/[id]` | `/api/products/[id]` | `Product` | `INCONSISTENT` | UI prioritizes `localStorage` over database queries. |
| **Dispute Resolution** | `/admin/disputes` has Resolve buttons | ❌ None | `Dispute` | `UI_ONLY` | Resolve button only modifies React state; no backend route exists. |
| **Admin Add Crop** | `/admin/products` has "Add Crop" modal | ❌ None | `Product` | `UI_ONLY` | Form creates local random ID; does not save to DB. |
| **Admin Add User** | `/admin/users` has "Add User" modal | ❌ None | `User` | `UI_ONLY` | Form creates temporary in-memory user; does not save to DB. |
| **Public Marketplace** | `/products` has commodity cards | ❌ None | `Product` | `PLACEHOLDER` | Public page uses hardcoded mock data; links to `/signup`. |
| **Product Reviews** | `/farmer/reviews` displays reviews | `POST /api/reviews` | `Review` | `BACKEND_ONLY` | Backend works, but Buyer UI has no review submission form. |
| **Checkout Address** | `PaymentModal` has payment buttons | `/api/orders` | `Delivery` | `INCONSISTENT` | Shipping address hardcoded to Lagos Port; no user inputs. |
| **Notification Settings**| Settings tabs have toggle switches | `/api/user/notification-preferences`| ❌ None | `PLACEHOLDER` | Settings stored in temporary Node.js memory map. |

---

# 15. END-TO-END WORKFLOW RESULTS

| Workflow | Farmer UI | Admin UI | Buyer UI | API | DB | Auth | Works E2E | Notes / Root Cause of Break |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Farmer Registration** | ✅ PASS | N/A | N/A | ✅ PASS | ✅ PASS | ✅ PASS | 🟢 **PASS** | Creates User + FarmerProfile. |
| **Farmer KYC Verification**| ✅ PASS | ✅ PASS | N/A | ✅ PASS | ✅ PASS | ✅ PASS | 🟢 **PASS** | Document submitted, reviewed, and approved transactionally. |
| **Product Creation** | ✅ PASS | N/A | N/A | ✅ PASS | ✅ PASS | ✅ PASS | 🟢 **PASS** | Product saved with `isAvailable: false`. |
| **Product Moderation** | N/A | ❌ FAIL | N/A | ❌ FAIL | ❌ FAIL | ❌ FAIL | 🔴 **FAIL** | No moderation status in DB; approve API is unprotected. |
| **Product Publication** | ⚠️ PARTIAL| N/A | N/A | ❌ FAIL | ❌ FAIL | ❌ FAIL | 🔴 **FAIL** | Farmer can self-publish by toggling availability. |
| **Product Discovery** | N/A | N/A | ⚠️ PARTIAL| ✅ PASS | ✅ PASS | ⚠️ PARTIAL| 🟡 **PARTIAL** | Authenticated buyer works; public marketplace is static. |
| **Multi-Farmer Cart** | N/A | N/A | ⚠️ PARTIAL| ❌ FAIL | ❌ FAIL | N/A | 🔴 **FAIL** | Cart allows multiple items, but orders cannot be split. |
| **Checkout & Payment** | N/A | N/A | ⚠️ PARTIAL| ❌ FAIL | ✅ PASS | ✅ PASS | 🟡 **PARTIAL** | Address hardcoded; client-supplied gateway price. |
| **Farmer Fulfillment** | ⚠️ PARTIAL| N/A | ⚠️ PARTIAL| ❌ FAIL | ✅ PASS | ❌ FAIL | 🔴 **FAIL** | Status update uses unauthenticated `PUT /api/orders/[id]`. |
| **Delivery Confirmation** | N/A | N/A | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | 🟢 **PASS** | `POST /api/orders/[id]/release-escrow` releases funds. |
| **Buyer Review** | N/A | N/A | ❌ MISSING| ✅ PASS | ✅ PASS | ✅ PASS | 🔴 **FAIL** | Buyer UI has no review form or modal. |
| **Dispute Resolution** | N/A | ❌ FAIL | ⚠️ PARTIAL| ❌ FAIL | ✅ PASS | ❌ FAIL | 🔴 **FAIL** | Admin resolution is 100% mocked in React state. |

---

# 16. MISSING PAGES & INTERFACES

### Required:
1. **Public Product Details (`/products/[id]`)**: Allows prospective buyers to view product details, certifications, and pricing before authenticating.
2. **Public Farmer Storefront (`/farmers/[id]`)**: Allows buyers to inspect a farmer's verified credentials, location, rating, and complete product catalog.
3. **Admin Dispute Adjudication Detail (`/admin/disputes/[id]`)**: Detailed view to inspect order evidence, buyer claim, farmer response, and execute financial resolutions.

### Recommended:
1. **Dedicated Checkout Page (`/checkout`)**: Replace the constrained `PaymentModal` with a standard checkout page featuring address selection, LGA shipping calculation, and order review.
2. **Buyer Reviews Management (`/dashboard/reviews`)**: View submitted reviews and see products awaiting review.

---

# 17. BROKEN PAGES

1. `src/app/admin/disputes/page.tsx`: Resolution buttons do not call any API; falls back to static dummy data.
2. `src/app/farmer/produce/[id]/page.tsx`: Reads from browser `localStorage` first, causing stale data when navigating from listings.
3. `src/app/products/page.tsx`: Displays hardcoded items and redirects product detail clicks to `/signup`.

---

# 18. DEAD & ORPHANED CODE

1. `src/app/farmer/produce/detail/page.tsx`: Completely static mock page ("Abuja Yam").
2. `src/components/farmer/SubmitFarmProduce.tsx`: Widget button has no click handler or link.
3. `src/app/api/admin/products/[id]/approve/route.ts`: Redundant and insecure product approval route.
4. `src/context/ProduceContext.tsx`: Redundant client-side `localStorage` cache conflicting with PostgreSQL.

---

# 19. PRIORITIZED REMEDIATION PLAN

```text
               Phase 0: Containment & API Security (P0)
               ├── Protect /api routes via Middleware
               ├── Close unauthenticated /api/disputes endpoints
               └── Secure /api/admin/products/[id]/approve
                                 │
                                 ▼
               Phase 1: Domain & Data Modeling (P0)
               ├── Add ProductStatus enum (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED)
               ├── Add SubOrder / SellerOrder entity for multi-farmer order splitting
               └── Add Dispute resolution models
                                 │
                                 ▼
               Phase 2: Product Moderation Lifecycle (P1)
               ├── Enforce farmer submission to PENDING_APPROVAL
               ├── Wire Admin Approval/Rejection with audit remarks
               └── Restrict Buyer discovery query strictly to APPROVED
                                 │
                                 ▼
               Phase 3: Multi-Farmer Order State Machine (P1)
               ├── Rewrite /api/orders to create parent Order + Seller Sub-Orders
               ├── Role-enforce state machine transitions in PUT /api/orders/[id]
               └── Connect Sub-Order delivery confirmation to per-farmer escrow release
                                 │
                                 ▼
               Phase 4: Public Commerce & Storefronts (P2)
               ├── Build public /products/[id] detail page
               ├── Build public /farmers/[id] storefront profile
               └── Implement structured checkout delivery address form
                                 │
                                 ▼
               Phase 5: Admin Governance Completion (P2)
               ├── Add Disputes and Verifications to AdminSidebar
               ├── Build backend dispute adjudication engine with financial split payouts
               └── Remove fake in-memory modals in Admin
```

---

# 20. TARGET ARCHITECTURE BLUEPRINT

- **Farmer Experience Target State**: Produce submitted in `DRAFT` $\to$ `PENDING_APPROVAL`. Cannot be activated by farmers until approved by Admin. Public storefront (`/farmers/[id]`) renders farm credentials and catalog. Orders split into isolated `SellerOrder` units.
- **Buyer Experience Target State**: Dynamic public showroom and product pages (`/products/[id]`). Checkout captures structured address and freight choice. Post-delivery review prompts enable ratings on completed orders.
- **Admin Experience Target State**: Granular RBAC (`SUPER_ADMIN`, `FINANCE_ADMIN`, `OPERATIONS_ADMIN`, `SUPPORT_ADMIN`). Moderation queue with reason logging. Real dispute adjudication engine executing escrow splits. Fully linked sidebar.

---

# 21. FINAL VERDICT

### Quantitative Marketplace Readiness

$$\text{Readiness} = \frac{\text{Fully Implemented Capabilities}}{\text{Required Capabilities}} \times 100$$

| Operational Surface | Evaluated Capabilities | Fully Working | Partial | Broken / Mocked / Missing | Surface Readiness |
|---|:---:|:---:|:---:|:---:|:---:|
| **Farmer Operations** | 18 | 7 | 6 | 5 | **38.9%** |
| **Buyer Operations** | 16 | 6 | 5 | 5 | **37.5%** |
| **Admin Governance** | 16 | 6 | 4 | 6 | **37.5%** |
| **Cross-Role Integration** | 12 | 2 | 3 | 7 | **16.7%** |
| **Overall Marketplace Readiness** | **62** | **21** | **18** | **23** | **33.9%** |

### Top 10 Blocking Issues (P0 / P1):
1. **Missing Product Moderation Lifecycle**: Products have no approval state in the DB; farmers self-publish directly.
2. **Unauthenticated Admin Approval Route**: `/api/admin/products/[id]/approve` is completely public.
3. **Monolithic Order Multi-Farmer Collision**: Simultaneous orders across multiple farmers mutate shared status.
4. **Unprotected Order Status Manipulation**: Anyone can advance an order to `CONFIRMED` and trigger fake `PAID` status.
5. **Mocked Admin Dispute Arbitration**: Admin dispute panel executes zero backend mutations or money transfers.
6. **Information Disclosure & Arbitrary Payment Freezing via Disputes**: Public `GET /api/disputes` and unverified `POST`.
7. **Client-Controlled Pricing in Hosted Checkout**: Gateway initialization does not recalculate totals server-side.
8. **Hardcoded Checkout Shipping Address**: Lagos Port Terminal hardcoded; no user address input.
9. **Missing Public Product & Farmer Pages**: No `/products/[id]` or `/farmers/[id]`; public marketplace is static.
10. **Orphaned Admin Navigation**: Admin sidebar lacks links to Disputes and Verifications.

### Recommended Implementation Order:
1. **Milestone 1 — Security & Containment**: Extend `middleware.ts` to guard `/api/:path*`, close dispute leaks, and require authentication on product approval.
2. **Milestone 2 — Schema Realignment**: Introduce `ProductStatus` enum and `SellerOrder` (Sub-Order) model in Prisma.
3. **Milestone 3 — Product Moderation Engine**: Implement the strict `Farmer Submit -> Admin Approve/Reject -> Buyer Discover` workflow.
4. **Milestone 4 — Multi-Seller Commerce & Checkout**: Refactor checkout to generate sub-orders and build the structured delivery address form.
5. **Milestone 5 — Public Discovery & Storefronts**: Build public `/products/[id]` and `/farmers/[id]`.
6. **Milestone 6 — Dispute Arbitration & Review Lifecycle**: Wire real backend dispute resolution and build the buyer review submission UI.
