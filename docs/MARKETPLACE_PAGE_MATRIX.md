# MARKETPLACE PAGE MATRIX
## SmartHub AgroChain — Operational Surface & Page Registry

**Last Updated**: September 12, 2026  
**Status**: Living Architecture Artifact  
**Total Pages Tracked**: 44 (41 Existing + 3 High-Priority Additions)

---

### Legend
- 🟢 **Functional**: Operational, connected to database/API, authenticated.
- 🟡 **Partial / Flawed**: Page renders, but contains architectural flaws (e.g., localStorage leakage, client-side pricing, mock endpoints).
- 🔴 **Missing / Broken**: Route does not exist, or page is completely non-functional/dead code.

---

## 1. Public Marketplace Surface

| Route | Page File | Purpose | Render Type | Backend / DB Connection | Auth Enforcement | Status |
|---|---|---|---|---|---|:---:|
| `/` | `src/app/page.tsx` | Landing page, 4-step trust protocol, hero | Static / Client | None (Marketing) | Public | 🟢 Functional |
| `/about` | `src/app/about/page.tsx` | Platform mission, governance, partners | Static | None (Marketing) | Public | 🟢 Functional |
| `/contact` | `src/app/contact/page.tsx` | Support & partner contact inquiry form | Client Form | None (Cosmetic form) | Public | 🟡 Partial |
| `/how-it-works` | `src/app/how-it-works/page.tsx` | Educational guide for Farmers & Buyers | Static | None (Marketing) | Public | 🟢 Functional |
| `/login` | `src/app/login/page.tsx` | Universal authentication portal | Client Form | `POST /api/auth/login` | Public | 🟢 Functional |
| `/signup` | `src/app/signup/page.tsx` | Universal registration (Buyer default) | Client Form | `POST /api/auth/register` | Public | 🟢 Functional |
| `/products` | `src/app/products/page.tsx` | Public showroom / catalog discovery | Client Component | Static array (`showcase-products.ts`) | Public | 🟡 Partial |
| `/products/[id]` | `src/app/products/[id]/page.tsx` | **NEW**: Public produce detail & specifications | Dynamic Server Component | `GET /api/products/[id]` | Public | 🔴 Missing |
| `/farmers/[id]` | `src/app/farmers/[id]/page.tsx` | **NEW**: Public farmer storefront & trust badge | Dynamic Server Component | `GET /api/farmers/[id]` | Public | 🔴 Missing |
| `/cart` | `src/app/cart/page.tsx` | Multi-vendor cart review & checkout launch | Client Component | `POST /api/orders/validate` | Public / Session | 🟡 Partial |

---

## 2. Farmer Operational Surface (Merchant / Seller)

| Route | Page File | Purpose | Render Type | Backend / DB Connection | Auth Enforcement | Status |
|---|---|---|---|---|---|:---:|
| `/farmer` | `src/app/farmer/page.tsx` | Farmer Command Center & Financial Overview | Client Component | `GET /api/farmer/dashboard` | Role: `FARMER` | 🟢 Functional |
| `/farmer/sell` | `src/app/farmer/sell/page.tsx` | Produce creation & KYC compliance gate | Client Component | `POST /api/farmer/produce` + `localStorage` | Role: `FARMER` | 🟡 Partial |
| `/farmer/listings` | `src/app/farmer/listings/page.tsx` | Produce inventory, pricing & status toggles | Client Component | `GET`, `PATCH /api/farmer/produce` | Role: `FARMER` | 🟡 Partial |
| `/farmer/produce/[id]` | `src/app/farmer/produce/[id]/page.tsx` | Detailed produce view & batch details | Client Component | `localStorage` first, fallback `/api/products/[id]` | Role: `FARMER` | 🔴 Flawed |
| `/farmer/produce/detail`| `src/app/farmer/produce/detail/page.tsx`| Static produce mockup ("Abuja Yam") | Static Client | None (Hardcoded static) | Role: `FARMER` | 🔴 Dead Code |
| `/farmer/orders` | `src/app/farmer/orders/page.tsx` | Incoming purchase orders & fulfillment | Client Component | `GET /api/orders`, `PUT /api/orders/[id]` | Role: `FARMER` | 🟡 Partial |
| `/farmer/wallet` | `src/app/farmer/wallet/page.tsx` | Escrow payouts, withdrawals, bank accounts | Client Component | `GET /api/wallet`, `/api/wallet/withdraw` | Role: `FARMER` | 🟢 Functional |
| `/farmer/customers` | `src/app/farmer/customers/page.tsx` | Repeat buyer analytics & order aggregations | Client Component | `GET /api/farmer/customers` | Role: `FARMER` | 🟢 Functional |
| `/farmer/reviews` | `src/app/farmer/reviews/page.tsx` | Customer feedback & rating metrics | Client Component | `GET /api/farmer/reviews` | Role: `FARMER` | 🟡 Partial |
| `/farmer/analytics` | `src/app/farmer/analytics/page.tsx` | Revenue trends, crop performance charts | Client Component | `GET /api/farmer/analytics` | Role: `FARMER` | 🟢 Functional |
| `/farmer/kyc` | `src/app/farmer/kyc/page.tsx` | Identity, CAC & farm verification upload | Client Component | `POST /api/kyc/upload`, `/api/kyc/verify` | Role: `FARMER` | 🟡 Partial |
| `/farmer/notifications`| `src/app/farmer/notifications/page.tsx`| Real-time operational alerts & updates | Client Component | `GET`, `PATCH /api/notifications` | Role: `FARMER` | 🟢 Functional |
| `/farmer/settings` | `src/app/farmer/settings/page.tsx` | Farm profile, coordinates, notification prefs| Client Component | `GET`, `PUT /api/user/profile` | Role: `FARMER` | 🟡 Partial |

---

## 3. Buyer Operational Surface (Customer / Procurement)

| Route | Page File | Purpose | Render Type | Backend / DB Connection | Auth Enforcement | Status |
|---|---|---|---|---|---|:---:|
| `/dashboard` | `src/app/dashboard/page.tsx` | Buyer Command Center, active orders, spending | Client Component | `GET /api/dashboard` | Role: `BUYER` | 🟢 Functional |
| `/dashboard/products` | `src/app/dashboard/products/page.tsx` | Authenticated live agricultural showroom | Client Component | `GET /api/products` (Prisma DB) | Role: `BUYER` | 🟢 Functional |
| `/dashboard/products/[id]`| `src/app/dashboard/products/[id]/page.tsx`| Product detail, stock check, "Add to Cart" | Client Component | `GET /api/products/[id]` | Role: `BUYER` | 🟢 Functional |
| `/dashboard/orders` | `src/app/dashboard/orders/page.tsx` | Order history, cancellation, escrow release | Client Component | `GET /api/orders`, `/api/orders/[id]/*` | Role: `BUYER` | 🟢 Functional |
| `/dashboard/tracking` | `src/app/dashboard/tracking/page.tsx` | Real-time shipment tracking, driver status | Client Component | `GET /api/fulfillment/*`, `/deliveries/pod` | Role: `BUYER` | 🟡 Partial |
| `/dashboard/wallet` | `src/app/dashboard/wallet/page.tsx` | Buyer balance, bank transfer instructions | Client Component | `GET /api/wallet`, `POST /api/wallet/deposit` | Role: `BUYER` | 🟡 Partial |
| `/dashboard/disputes` | `src/app/dashboard/disputes/page.tsx` | File disputes on delivered orders, dispute log | Client Component | `GET`, `POST /api/disputes` | Role: `BUYER` | 🟡 Partial |
| `/dashboard/financing` | `src/app/dashboard/financing/page.tsx`| Working capital & trade financing brochure | Static Client | None (Informational brochure) | Role: `BUYER` | 🟡 Partial |
| `/dashboard/notifications`| `src/app/dashboard/notifications/page.tsx`| Order state notifications & alerts | Client Component | `GET`, `PATCH /api/notifications` | Role: `BUYER` | 🟢 Functional |
| `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | Shipping addresses, password, preferences | Client Component | `GET`, `PUT /api/user/profile` | Role: `BUYER` | 🟡 Partial |

---

## 4. Admin Governance Operational Surface (Control Plane)

| Route | Page File | Purpose | Render Type | Backend / DB Connection | Auth Enforcement | Status |
|---|---|---|---|---|---|:---:|
| `/admin` | `src/app/admin/page.tsx` | Entry redirect to `/admin/overview` | Server Component | Redirect | Role: `ADMIN` | 🟢 Functional |
| `/admin/login` | `src/app/admin/login/page.tsx` | Secure administrative authentication screen | Client Component | `POST /api/auth/login` | Public | 🟢 Functional |
| `/admin/overview` | `src/app/admin/overview/page.tsx` | Platform KPIs, GMV, moderation queue | Client Component | `GET /api/admin/overview` | Role: `ADMIN` | 🟢 Functional |
| `/admin/products` | `src/app/admin/products/page.tsx` | Moderation queue, approve/reject produce | Client Component | `GET`, `PUT /api/admin/products/*` | Role: `ADMIN` | 🟡 Partial |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | Marketplace-wide orders console | Client Component | `GET /api/orders` | Role: `ADMIN` | 🟢 Functional |
| `/admin/users` | `src/app/admin/users/page.tsx` | User management, role elevation, freeze | Client Component | `GET`, `PATCH /api/admin/users/*` | Role: `ADMIN` | 🟢 Functional |
| `/admin/finance` | `src/app/admin/finance/page.tsx` | Platform treasury, escrow reconciliation | Client Component | `GET`, `POST /api/admin/finance/*` | Role: `ADMIN` | 🟢 Functional |
| `/admin/verifications` | `src/app/admin/verifications/page.tsx`| KYC desk: review farmer documents | Client Component | `GET`, `POST /api/admin/verifications/*` | Role: `ADMIN` (Orphaned) | 🟡 Partial |
| `/admin/disputes` | `src/app/admin/disputes/page.tsx` | Dispute adjudication desk | Client Component | In-memory React state (Mocked backend) | Role: `ADMIN` (Orphaned) | 🔴 Flawed |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Macro platform telemetry & GMV reports | Client Component | `GET /api/analytics` | Role: `ADMIN` | 🟢 Functional |
| `/admin/content` | `src/app/admin/content/page.tsx` | CMS & marketing content management | Static Client | None (UI mockup) | Role: `ADMIN` | 🟡 Partial |
| `/admin/notifications`| `src/app/admin/notifications/page.tsx`| Platform-wide broadcast & system alerts | Client Component | `GET`, `PATCH /api/notifications` | Role: `ADMIN` | 🟢 Functional |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | Platform fee configuration (commission %) | Client Component | `GET`, `PUT /api/admin/config` | Role: `ADMIN` | 🟢 Functional |

---

## 5. Architectural Hygiene Action Items

1. **Delete Dead Code**: Remove `src/app/farmer/produce/detail/page.tsx` (unreachable hardcoded mock).
2. **Restore Orphaned Admin Navigation**: Wire `/admin/disputes` and `/admin/verifications` into `src/components/admin/AdminSidebar.tsx`.
3. **Build Public Detail Routes**: Introduce `/products/[id]` and `/farmers/[id]` to allow external linkability and unauthenticated browsing before checkout.
4. **Decommission LocalStorage in Seller Flows**: Migrate `/farmer/sell` and `/farmer/produce/[id]` to rely exclusively on PostgreSQL via Prisma.
