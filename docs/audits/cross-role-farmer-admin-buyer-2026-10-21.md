# Cross-role workflow audit — SmartHub AgroChain
**Date:** 2026-10-21 | **Baseline:** GitHub main, live read-only Supabase/Vercel metadata | **Status:** FAIL: cross-role functionality not guaranteed.  
**Scope:** Farmer → Admin → Buyer and reverse propagation. **No application implementation, deployment, or production data writes.**

## Current production evidence
Read-only snapshot: 1 active admin, 3 buyer users, **0 FarmerProfile, Verification, Product, Order, SellerOrder, Dispute, Notification, AuditEvent**. Thus no live cross-role end-to-end test was possible. Vercel does not contain `NEXT_PUBLIC_APP_URL`, although several admin mutation routes validate Origin against this value (default `http://localhost:3000`).

## Core workflow matrix
| Workflow | Where the record goes | Expected reverse propagation | Audit result |
|---|---|---|---|
| Farmer signs up | `User` + `FarmerProfile`; admin Farmers API reads | Farmer initially PENDING | Connected by code; no live farmer |
| Farmer sends KYC | `POST /api/kyc/upload` upserts `Verification`; Admin Verifications GET lists it | Admin PUT changes `Verification` + `FarmerProfile.verificationStatus`; Farmer KYC and Sell gate read new status | Connected, but critical authorization and document trust flaws |
| Farmer saves draft | `Product.status=DRAFT`, unavailable | Buyer cannot see in list | Admin Products incorrectly groups DRAFT as Pending |
| Farmer submits product | `Product.status=PENDING_APPROVAL`; Admin Products reads all | Admin approves/rejects; farmer Listings GET reads status | Connected in DB; Admin Overview moderationQueue only tracks KYC |
| Admin approves listing | `status=APPROVED,isAvailable=true`; Product and Notification written separately | Farmer sees approved; Buyer `/api/products` displays only verified, active seller products | Conditional; can falsely claim published |
| Admin rejects/suspends | Status & availability updated | Farmer status changes after refresh; public buyer list excludes | Generally connected; notification/audit not atomic |
| Farmer pauses/reactivates | Farmer Listings PATCH availability status API | Should hide/reveal from buyer | **BROKEN payload contract**: UI sends isAvailable, API expects status |
| Buyer creates order | Checkout creates Order, SellerOrder, Payment, Inventory reservations; Admin Orders reads master | Farmer suborders API; Buyer Orders API | Connected at DB layer, **checkout lacks full trust eligibility checks** |
| Farmer accepts/order progresses | SellerOrder updated; parent Order partly aggregated | Admin/Buyer read Order; Farmer reads SellerOrder | **Incomplete parent-child synchronization**, buyer may miss intermediate updates |
| Admin order action | Admin Orders PUT uses AdminOrderService | Buyer Order and Farmer SellerOrder should match | **BROKEN action encoding; partial SellerOrder propagation** |
| Buyer/Farmer disputes | `Dispute` created, Admin Disputes reads it | Admin resolves; buyer/farmer read result | DB connected; escrow handling not atomically consistent |
| Admin freezes account | User.isActive=false and registry Sessions revoked | Marketplace hides farmer; all sensitive routes deny | **Legacy JWT fallback may still authenticate suspended user** |
| Review submitted | Buyer `/api/reviews` stores review; Farmer/public review APIs read | No admin moderation queue | Decide if immediate publication is intended |
| Notifications | Per-user `Notification`; `/api/notifications` reads | Various KYC/product/dispute events attempt delivery | Not all workflows emit event; event subscriber is ephemeral |

## P0 — critical security and consistency defects

1. **Unprotected KYC admin mutation:** `src/app/api/kyc/verify/route.ts:14-17` detects missing ADMIN session but only logs a warning, then executes verification-status update. It must return 401/403. The main `/api/admin/verifications/[id]` route has admin authorization, but the alternate route bypasses it.
2. **Checkout can bypass publication restrictions:** `src/app/api/orders/route.ts:74-95` and `/api/orders/validate` check `isAvailable`/stock, not required `Product.status=APPROVED`, seller verified, seller active. Public product listing enforces those conditions. Recheck all atomically in checkout.
3. **Direct product GET exposes nonpublic listings:** `src/app/api/products/[id]/route.ts:16-35` returns any ID regardless of moderation state, including drafts/rejected. Related-products query only checks isAvailable. Distinguish authorized seller/admin detail vs public published detail.
4. **Admin product creation misattributes seller/stock:** Admin form sends arbitrary free-text farmer, price, `unit=KG`, fabricated `stockQuantity=100`; farmer form supports 22 domain fields. `POST /api/farmer/produce` silently falls back to first APPROVED farmer if match fails. Require explicit seller ID, shared canonical DTO, valid images, real stock and complete form parity.
5. **Farmer availability toggle:** `src/app/farmer/listings/page.tsx:105-109` sends `{isAvailable}` while `src/app/api/farmer/produce/[id]/status/route.ts:24-36` requires `{status}`. Request fails.
6. **Admin order action mismatch:** `src/app/admin/orders/page.tsx:73-80` sends `{status:newStatus,action:newStatus}`, while `AdminOrderService` expects e.g. MARK_PROCESSING, MARK_IN_TRANSIT, RELEASE_ESCROW, CANCEL. Normalization in `/api/admin/orders/[id]` occurs only if action missing. UI-to-backend broken and CONFIRMED lacks service action. Parent Order status and SellerOrder status are not consistently synchronized.
7. **Money/dispute partial commits:** `/api/orders/[id]` sets COMPLETED before releasing escrow and *swallows release errors*. `/api/orders/[id]/cancel` commits inventory/payment/status before separate wallet refund. `/api/admin/disputes/[id]/resolve` separately updates funds, Order, Dispute; refund branch does not fully reconcile seller orders/inventory; release branch does not explicitly mark parent Order COMPLETED. Buyer dispute UI claims escrow frozen but `/api/disputes` merely creates Dispute/AuditEvent. Correct via canonical idempotent ledger/outbox, not ad hoc changes.
8. **Legacy JWT freeze gap:** `getSessionContext` checks User.isActive; `getSession()` allows old JWT cookie fallback without rechecking isActive. Revoking registry sessions on suspension does not invalidate these tokens.

## P1 — broken feedback/operational completeness

- KYC farmer UI preloads an apparent document URL rather than securely uploading/validating a real owned file; `/api/kyc/upload` simply accepts documentUrl. KYC resubmission resets farmer verificationStatus but **not Verification.reviewedAt/reviewedById**, so Admin Overview pending count can omit resubmissions.
- Admin Products GET lists all products but maps DRAFT to Pending. Product submissions do not create an admin-targeted persisted notification; Admin Overview moderation queue is only KYC, and pendingProducts counts every isAvailable=false product, not only PENDING_APPROVAL.
- Admin approval blindly sets isAvailable true without checking active verified farmer, stock, harvest/availability date or valid publication state, so 'published to showroom' can be false.
- `/api/admin/farmers/[id]` can approve farmer verificationStatus with no Verification document record: define reasoned override vs normal KYC workflow.
- Product moderation writes Product before separate AuditEvent and Notification; failure may return 500 despite successful approval. Event subscribers are in-memory, not durable outbox; delivery not guaranteed.
- SellerOrder status PATCH writes state and sometimes parent Order but has no buyer notification. Admin parent Order transitions often don't update SellerOrder; notifyOrderStateChange exists elsewhere but is not uniformly used.
- Buyer/Farmer review GET returns rating 5.0 with zero reviews; admin review moderation not implemented. Either explicitly adopt immediate publication or create review moderation.
- Admin settings and config are not durable; missing NEXT_PUBLIC_APP_URL can block production admin POST/PATCH/PUT. Companion audit: `docs/audits/admin-operations-product-parity-2026-10-21.md`.

## Acceptance tests required **after** targeted remediation, with isolated no-money fixtures

1. Farmer signup → Admin Farmers appears with correct verification status; buyer cannot see nonpublic listings.
2. Real verified KYC upload → Admin Verification queue and counts → authenticated Admin approves/rejects → Farmer KYC, profile and listing permission reflect change → Notification/AuditEvent stored; unauthorized direct KYC mutation returns 403.
3. Farmer draft → Admin All Listings only; pending queue excludes draft; public list **and direct detail** 404.
4. Farmer submit → Admin pending queue + notification → approve/reject with reason → Farmer sees result → Buyer list/detail obey eligibility and inventory, persists after refresh.
5. Admin create/edit uses explicit farmerProfileId and full farmer-equivalent fields, correct stock/unit/MOQ/media; no implicit seller fallback. Edit/pause/suspend/reinstate/status filters match across three roles.
6. Buyer checkout validates publishable product, seller, MOQ, stock and authoritative price; Order+SellerOrders reserved once; Admin Orders and right Farmer inbox reflect; buyer order history matches.
7. Farmer accepts/processing/ready → Admin/Buyer master state and Farmer SellerOrder state sync (including multi-farmer). Admin buttons use valid domain action mapping, reject invalid transitions, notify all stakeholders.
8. Dispute opened → actual funds frozen to policy, admin sees dispute → idempotent refund/release → all order, ledger, buyer/farmer views consistent; do **not** use real funds.
9. Admin suspends farmer/buyer → all realm and legacy sessions denied; no buyer purchase from suspended seller; Reactivation and new login verified.
10. Notification read/deletion and admin settings persistence survive reload and multi-session. Run automated integration, role security, idempotency and isolated E2E browser tests, verify SQL records.

**Decision:** Do not implement or claim production-ready cross-role functions yet. First secure privileged KYC and old sessions; standardize status/eligibility and role contracts; then isolate finance overhaul and verification. No production writes performed.
