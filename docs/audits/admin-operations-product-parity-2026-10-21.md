# SmartHub AgroChain — Admin Operations & Product Listing Parity Audit

**Date:** 21 October 2026  
**Scope:** Admin UI, buyer marketplace, farmer produce flows, corresponding Next.js APIs, Prisma models, production Supabase schema/data, Vercel variable inventory, and selected tests.  
**Type:** Read-only forensic audit; **no code deployment or production mutation performed**.  
**Status:** **FAIL — the admin console does not yet satisfy full persistence or product-listing parity.**

## Evidence and limits

- Inspected 14 admin feature pages plus their supporting API routes, the farmer listing form/API, public marketplace API, underlying Prisma models, and relevant services/tests in GitHub `main`.
- Read-only Supabase snapshot: 1 active ADMIN; 2 active admin sessions; 0 FarmerProfile, Product, Category, Order, Verification and AuditEvent rows at audit time.
- Vercel Production has `DATABASE_URL` but **does not have `NEXT_PUBLIC_APP_URL`**. This matters because several admin mutation endpoints compare the browser's Origin/Referer against `process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"`.
- No privileged live create/approve/purchase/payout tests were executed. Code findings are not an end-to-end production test; no finance operations should be tested with real funds.

## Critical findings

### P0-01 — Admin product form is not equivalent to farmer form

**Files**: `src/app/admin/products/page.tsx` (modal ~904–1029), `src/app/farmer/sell/page.tsx` (form state ~99–123 and POST ~460–494).

Admin captures only: commodity name, free-text farmer name, price, moisture, and free-text origin. It sends just `name`, `farmerName`, `price`, `unit: "KG"`, `stockQuantity: 100`, `description` to `POST /api/farmer/produce`.

- `cropMoisture` input is never submitted or stored.
- `cropOrigin` is only interpolated into a description, not stored in `farmState`, `farmLga`, or `farmCommunity`.
- Hardcoded quantity 100 and unit KG misrepresent stock and price units.
- No explicit `farmerProfileId`; no genuine farmer selection.
- No produce type, variety, grade, quality notes, condition, accurate quantity, unit, packaging, package size, MOQ, pricing notes, availability type/date, harvest date, location components, storage conditions/notes, images, draft/submit choices.
- The farmer form requires some of these fields for submission; admin bypasses the UI's validation.
- The product API creates `PENDING_APPROVAL` + `isAvailable:false` rather than a published listing; the admin modal does not explain the approval sequence.

**Accept:** The admin creation/editing experience uses a shared validated listing schema and the same fields as the farmer form. Admin must choose an existing, authorized farmer profile by immutable ID; no arbitrary fallback. Stock and unit must be explicitly entered. Persist all supported fields/images/inventory and verify refresh/relogin parity. Explicitly define whether admin direct-publish is allowed; if allowed enforce seller verification, stock, dates, and audit trail.

### P0-02 — Product creation binds an arbitrary farmer when selection fails

**File**: `src/app/api/farmer/produce/route.ts` (~64–86).

Admin route may match free-text `farmerName` using case-insensitive `contains`. If none matches, it silently chooses the first APPROVED farmer (`findFirst`). If zero farmers, it fails with 403. Production currently has zero farmer profiles.

**Accept:** Require an explicit valid `farmerProfileId` for admin-created listings. Reject missing/inactive/ineligible farmer with informative 400/403; never silently assign another seller. Do not auto-create fake farmers.

### P0-03 — Missing Vercel production origin variable prevents admin writes

**Files**: `src/app/api/admin/users/route.ts`, `src/app/api/admin/orders/[id]/route.ts`, `src/app/api/admin/config/route.ts`, `src/app/api/admin/config/fees/route.ts` and other mutation routes that validate Origin.

With `NEXT_PUBLIC_APP_URL` absent in Vercel, expectedOrigin falls back to `http://localhost:3000`. Browser POST/PATCH/PUT requests from production will be rejected if they include their real Origin/Referer.

**Accept:** Configure canonical public origin and use a trusted, centrally implemented CSRF origin validator with accepted production hostname(s). Prove same-origin mutations pass, cross-origin attempts fail. Avoid weakening authorization.

### P0-04 — Admin order buttons submit unsupported backend actions

**Files**: `src/app/admin/orders/page.tsx` (~73–80, ~338–398), `src/app/api/admin/orders/[id]/route.ts` (~66–79), `src/services/admin-order.service.ts`.

Frontend sends `{status:newStatus, action:newStatus}`; server only maps status to domain action when `action` is missing, then service accepts `CANCEL`, `REFUND_ESCROW`, `RELEASE_ESCROW`, `MARK_PROCESSING`, `MARK_READY_FOR_PICKUP`, `MARK_IN_TRANSIT`, `MARK_DELIVERED`. Values like `"PROCESSING"`, `"CANCELLED"`, `"DELIVERED"`, `"COMPLETED"` from UI are unsupported as actions. `CONFIRMED` lacks a corresponding supported action.

**Accept:** Build an explicit UI-to-service action mapping, enforce state transitions, reject invalid transitions, show proper result and persist through refresh. Exercise unpaid and paid flows in isolated test mode, preserving escrow invariants.

### P0-05 — Admin product approval can signal live without meeting marketplace eligibility

**Files**: `src/app/api/admin/products/[id]/approve/route.ts`, `src/app/api/products/route.ts`.

Moderation endpoint sets `status:APPROVED` and `isAvailable:true` without checking farmer verification/active status, inventory >0, or availability window. The public marketplace requires approved farmer + active user. Result: admin can receive 'published live' despite listing being filtered out publicly or having zero inventory.

**Accept:** Centralize eligibility rules and reuse in moderation and market querying. Only claim publication after re-reading authoritative marketplace eligibility. Separate approval from stock availability if business rules require.

### P0-06 — Farmer availability toggle request mismatches API contract

**Files**: `src/app/farmer/listings/page.tsx` (~99–118); `src/app/api/farmer/produce/[id]/status/route.ts` (~24–36).

UI sends `{isAvailable:boolean}`; endpoint requires `{status:"ACTIVE"|"PAUSED"|"ARCHIVED"|"OUT_OF_STOCK"|"DRAFT"}`. It returns 400 for the current UI request.

**Accept:** Align shared request DTO and API, enforce moderation, reload page and confirm buyer marketplace responds correctly.

### P0-07 — Admin-generated users may not be able to log in

**Files**: `src/app/admin/users/page.tsx`, `src/app/api/admin/users/route.ts`, `src/services/admin-user.service.ts`.

UI does not provide or deliver a password; service creates a random one when absent and returns only sanitized user metadata. There is no shown user invitation/password-setup delivery. UI also invents a random Nigerian phone number if blank. Combined with P0-03, the create endpoint is currently subject to origin rejection.

**Accept:** Capture valid phone or define an actual nullable schema policy; no invented contact details. Use secure invitation/password-setup flow for users. Admin role creation must follow privileged provisioning policy, never public registration.

## High/medium findings

### P1-01 — Admin Settings page displays success without persistence

`src/app/admin/settings/page.tsx` handles 'Save' by refreshing context or showing a toast; it makes no network request. Changing commissions, escrow, certifications, profile, or general settings therefore does not save to the database.

### P1-02 — Config endpoints use serverless process memory, not durable storage

`src/app/api/admin/config/route.ts` and `src/app/api/admin/config/fees/route.ts` mutate module-level `let` objects. Values may differ between function instances or reset across deployments. Do not connect these mutable ephemeral values to money without financial architecture review. The fee defaults across modules must be reconciled with authoritative settlement rules.

### P1-03 — Content CMS is deliberately a mock

`src/app/admin/content/page.tsx` has `initialArticles` static content and local `setArticles` operations. The page explicitly says modifications are not persisted to a database.

### P1-04 — Notification operations are local-only

`src/app/admin/notifications/page.tsx` fetches notifications but mark-read, delete, and clear methods only call `setNotifications`; they do not use the persistent notification mutation API. The synthetic moderation queue is not persisted notification state.

### P1-05 — Admin analytics shows invented fallback data

`src/app/api/admin/overview/route.ts` supplies non-database category percentages and a fabricated 'System Audit Synchronized' event when actual records are absent. Use real empty states, not demo data indistinguishable from production metrics.

### P1-06 — Product moderation audit / notifications are non-atomic

`src/app/api/admin/products/[id]/approve/route.ts` persists status, then separately awaits audit and farmer notification. If either subsequent call fails, a 500 response can conceal a completed moderation update. Use transactional audit/outbox or resilient post-commit delivery semantics; never retry mutations blindly.

### P1-07 — Public catalog includes fallback products that are not real inventory

`src/app/products/page.tsx` shows `SHOWCASE_PRODUCTS` when no live results exist. Those appear as verified, available merchandise despite the actual product count being zero. Explicitly label demo content or separate demonstration catalog from checkout.

### P1-08 — Incomplete product editing lifecycle

`src/app/admin/products/page.tsx` provides creation and moderation but no comprehensive admin edit form for all canonical farmer listing fields. `src/app/api/products/[id]/route.ts` accepts only selected edits through a different endpoint; semantics and audit trails differ.

### P1-09 — Inventory quantity precision disagreement

Farmer form accepts positive numeric quantity (including decimals), API uses `parseInt(stockQuantity)`, Prisma `Inventory.availableQty` is `Int`. Fractional kilograms are truncated or rejected. Decide inventory base units before changing schema/order math.

### P2 — audit/history fallbacks and financial lifecycle need controlled verification

`/api/admin/audit-logs` derives synthetic event summaries from other tables when no AuditEvent exists; clearly distinguish reconstructed history from immutable ledger events. Finance/withdrawals/dispute actions are connected to services/DB but not safe to declare production-verified without transaction, idempotency, external gateway, and ledger reconciliation testing.

## Admin page readiness matrix

| Area | Code path | Audit verdict |
|---|---|---|
| Overview | PostgreSQL API | Reads live data; fake category/activity fallbacks |
| Products | PostgreSQL GET + moderation; farmer POST for creation | **Creation broken; parity missing; approval rules inconsistent** |
| Farmers | PostgreSQL GET/PATCH | Persistent workflow exists; requires live farmer/KYC test |
| Verifications | PostgreSQL GET/PUT | Atomic farmer/verification status updates; live tests needed |
| Users | PostgreSQL GET/PATCH/POST | Status changes persist; creation origin/password/phone issues |
| Orders | Domain service-backed API | **UI action payload contract broken; origin issue** |
| Disputes | Role-scoped database GET, admin resolution POST | Persistence implemented; escrow side effects unverified |
| Finance | Ledger/wallet service-backed | Real aggregation; live gateway/payout safety unverified |
| Analytics | Admin overview API | Data-backed but misleading fallbacks |
| Audit Logs | AuditEvent API | Data-backed; reconstructed fallback not immutable |
| Notifications | GET + in-memory interactions | **Read/delete/clear not persisted** |
| Content | Client-local seed | **Not persisted** |
| Settings | UI state only | **Not persisted** |
| Admin Login | Prisma + database-backed realm sessions | Active admin and sessions exist; not end-to-end browser-tested in this audit |

## Required product field-parity contract

**Identity:** explicit `farmerProfileId` (admin only), `name`, `categoryId` / controlled selection, `produceType`, `variety`, `description`.  
**Quality:** `grade`, `condition`, `qualityNotes`, optional structured moisture measure only if the data model explicitly supports it.  
**Commercial:** `price`, `unit`, `stockQuantity`, `moq`, `pricingNotes`.  
**Packaging/logistics:** `packaging`, `packageSize`, `storageCondition`, `storageNotes`.  
**Availability/harvest:** `availabilityStatus`, `availableFrom`, `harvestDate`.  
**Origin:** `farmState`, `farmLga`, `farmCommunity`.  
**Media:** `images` with safe validation and storage.  
**Workflow:** `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`; `isAvailable` distinct from moderation status.  
**Audit:** creation/modification actor, ownership, status changes, timestamps, related notifications/outbox events.

Share a server-side validator and a reusable field definition across admin and farmer UIs; privilege, seller binding, and publication path differ by actor rather than schema.

## Required remediation order

1. **P0 foundational:** canonical origin/config, centralized authorization and role-bound session rules. Do not loosen CSRF to make writes work.
2. **P0 product parity:** shared input validator, admin explicit farmer selection, canonical admin product create/update, actual inventory/asset data, safe moderation publication. Fix farmer toggle contract at same time.
3. **P0 order buttons:** change client payloads to real domain actions, add missing transitions only after domain/escrow review, and test with mock payment gateway.
4. **P0 user provisioning:** invitation/activation flow; no unknown generated password or fictitious phone numbers.
5. **P1 persistence:** settings/config in persistent authoritative schema; notifications mutation API; either build persisted CMS or disable mock actions.
6. **P1 operational truth:** remove or label demo catalog and fake admin metrics; make audit/outbox resilient.
7. **Verification:** repeat after deployment with isolated buyer, farmer, admin actors and known fixture products. Test create->draft->submit->approve->publish->pause->edit->archive, UI/API/DB assertions, authorization failures, reload and second session visibility, order lifecycle test without real money.

## Test coverage note

Repository includes `__tests__/admin-foundation.test.ts` and multiple integration test files. Several mock sessions and services. Presence of tests does **not** constitute deployed-route, browser, DB-write, or live finance verification. `__tests__/integration/real-db-persistence.test.ts` is opt-in behind `REAL_DB_TESTS=1`. Add contract tests for the exact UI payloads and end-to-end browser tests.

## Governance and non-goals

- No public administrator registration.
- No phantom seller or fallback-to-first-farmer linkage.
- No invented stock, verified claims, or account phone numbers.
- No changes to real balances, escrow releases, payouts, migration bookkeeping, or gateway configuration without separate finance verification and approval.
- No production writes undertaken for this audit.

**Decision gate:** Audit complete; do not claim full admin functionality. Remediate in isolated PRs with tests and explicit deployment verification.
