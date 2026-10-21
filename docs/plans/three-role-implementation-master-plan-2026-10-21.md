# SmartHub AgroChain — Three-Role Implementation Master Plan

**Version:** 1.1 — APPROVED (four product policies locked)  
**Date:** 2026-10-21  
**Starting point:** [Admin Operations and Product Parity Audit](./admin-operations-product-parity-2026-10-21.md), [Cross-Role Farmer–Admin–Buyer Audit](./cross-role-farmer-admin-buyer-2026-10-21.md)  
**State:** The four product policies are APPROVED as of 2026-10-21. Detailed Phase 0 execution and tests are specified in [Phase 0 Execution Specification](./phase-0-security-database-ci-execution-spec-2026-10-21.md). Planning only: no application-code or production-data modification authorized by this document.

## 1. Product objective

Deliver a verified, persistent three-role agricultural marketplace where Farmer, Admin, and Buyer are different permissioned views of the **same authoritative business entities**. Cross-role changes must appear after refetch and remain correct across browser sessions, without fictitious listings, fabricated financial metrics or silently missing notifications.

Core principle: a successful button response does not establish completion. Completion is **UI → authorized route → validated domain command → atomic DB state → durable event/outbox → recipient read model → refresh/relogin verification**.

## 2. Architectural decisions for implementation

**System of record:** Supabase PostgreSQL accessed through Prisma. Supabase Auth's auth.users is NOT the account source. Prisma User, FarmerProfile, BuyerProfile, Session, Verification, Product, Inventory, SellerOrder, Order, Payment, Wallet/WalletTransaction, Dispute, Notification and AuditEvent are business records. Admin console uses separate ADMIN authentication realm and no public registration.

**One domain, three views:** Reusable schemas, domain services and state transitions. Separate role-specific APIs and UX may call the same internal command/query services; never duplicate business invariants in each form.

**Authorization:** Verify role, active user, realm session, ownership, eligibility and actor scope on every server-side command. Revoke/sunset legacy JWT fallback for sensitive actions. Protected privileged KYC API must reject non-admins.

**Audit and messaging:** Persist authoritative event/audit records and transactional outbox within the command transaction wherever atomicity matters. Notifications addressed by actual user ID; retries are idempotent. Never report notification delivery success before stored.

**Read models:** Admin overview, admin queues, farmer dashboard and buyer catalog query the same records with explicitly different scope filters, not invented placeholders. Polling or refresh is an acceptable MVP mechanism; instantaneous push is not necessary for correctness.

**Operations:** Keep physical business state (moderation, inventory, fulfillment, escrow) independently modeled; do not overload one status variable.

**Security/config:** Normalize canonical production origin (www and apex if both used); enforce origin/CSRF centrally. Preserve proper role security. No generic bypasses to fix failed browser requests. No live money tests before financial review.

## 3. Proposed product and trust policies requiring sign-off

1. Admin may create/edit a product **on behalf of an existing, explicitly chosen FarmerProfile ID**; admin can never fabricate or silently fall back to the first approved farmer. For customer-visible publication, farmer must be verified and active.
2. Drafts do not go to the pending-review queue, and neither drafts nor submitted/unapproved items are visible on any unauthenticated buyer list or direct detail endpoint.
3. **APPROVED — audited direct admin publishing:** Farmer submission enters PENDING_APPROVAL; an authenticated ADMIN may create and directly publish only on behalf of an explicitly selected existing, verified, active farmer, after validating shared listing fields, genuine inventory, publication eligibility and immutable actor/reason/timestamp audit. No silent seller fallback.
4. **APPROVED — claims-based reapproval:** Stock/unit/MOQ/price must be validated and real. Price and available-stock edits can stay live after audit and reservation-safe checks. Changes affecting product identity, origin, grade, condition, quality evidence or photos require reapproval; do not affect immutable past order price snapshots.
5. Published/readable/checkout-eligible predicate requires: Product APPROVED; isAvailable true; approved and active Farmer; non-archived listing; effective availableFrom; sufficient availableQty for requested order quantity and MOQ; valid price. A draft/hidden product ID cannot circumvent the policy.
6. Farmer may manage own allocated SellerOrder only; admin manages defined operational exceptions and arbitration; buyer may view/cancel/request dispute under policy. Parent Order state is derived from all SellerOrder states with explicit fulfillment precedence and multi-vendor rules.
7. Dispute creation invokes **defined escrow hold/freeze policy**, not just a label. Refund/release is a privileged idempotent ledger command; no orphaned status transitions or duplicate payout.
8. Admin configuration changes must be persisted, validated and audited. Fee changes are governed separately: snapshots/effective dates and no retroactive changes to historical funds. No public admin registration.
9. **APPROVED — instant verified-purchase reviews:** Reviews from verified purchasers of delivered/completed orders publish immediately after server-side order ownership and product eligibility checks, with abuse reporting and auditable admin takedown.

## 4. Implementation workstreams and dependency gates

### Phase 0 — Baseline, security, release safety (BLOCKER)
- Reconcile outstanding PR branches and deployed main: previous pending auth PR and additive live Supabase schema migration. Baseline Prisma _prisma_migrations against applied migrations before migrate deploy; do not reset DB or replay existing schema.
- Confirm Vercel production app URL and hostname redirect policy; implement central trusted-origin CSRF enforcement.
- Fix unsafe /api/kyc/verify; use one authorized admin KYC service, reject requests without realm session. Close legacy JWT suspension bypass and enforce user.isActive for all mutation paths.
- Establish staging or isolated test database, sanitized fixtures, migration dry-run, typecheck/lint/test/build CI and roll-forward/rollback instructions; protect real accounts.
**Gate:** unauthorized KYC requests 401/403, frozen legacy sessions denied, production same-origin mutations accepted and foreign origins rejected, schema deploy idempotent.

### Phase 1 — Shared contracts and authoritative state machines
- Shared Zod/TypeScript DTOs for produce, KYC, moderation actions, availability, order actions, notifications and normalized API success/error envelopes.
- Canonical product fields: farmerProfileId (admin), category, name, produceType, variety, description; grade, condition, qualityNotes; price/unit, integer inventory base units, MOQ/pricingNotes; packaging, packageSize; harvestDate, availabilityStatus/availableFrom, storageCondition/storageNotes; farmState/LGA/community; images; create/edit/draft/submit. Do not collect moisture until explicitly modeled (field + validation) or remove it from form.
- Define source-of-truth product lifecycle (DRAFT→PENDING_APPROVAL→APPROVED or REJECTED; SUSPENDED/ARCHIVED with explicit reinstatement), separate availability/inventory. Shared published/checkout eligible predicate.
- Define SellerOrder lifecycle, aggregate parent Order transitions, delivery states and event catalog.
- Decide quantities / fractional kg policy before schema changes. Document API compatibility and data migration.
**Gate:** frontend and backend import/test matching schemas; product read, detail, checkout and admin all use same eligibility predicate.

### Phase 2 — Farmer onboarding and admin verification
- Farmer registration/profile fields persist; secure KYC document upload with authenticated ownership, file validation, private object storage and signed viewing.
- Upsert pending Verification and reset reviewedById/reviewedAt/remarks on resubmission; audit and notify assigned admin work queue.
- Admin verification list/details, approve/reject with notes and explicit admin identity; persist farmer verificationStatus and review record in one transaction.
- Farmer KYC/profile/sell gate shows authoritative current status; notifications and resubmission accurately reflect state.
**Gate:** pending→approve→farmer unblocked, reject→resubmit→pending visible to admin; malformed uploads and non-admin approvals forbidden.

### Phase 3 — Product listing parity, moderation, buyer catalog
- Shared product input field definitions and validator; farmer create draft/submit/edit and admin create-on-behalf/edit moderate forms with correct fields.
- Admin must select existing farmer by ID, not string name; unverified/inactive sellers cannot publish. No stock=100 or unit=KG default pretending to be real data.
- Transactionally save Product/Inventory and validated images; durable AuditEvent/Notification/outbox for submit, approve, reject, suspend, reinstate and relevant edits.
- Centralize admin queue (pending count excludes drafts/unavailable); include review reasons and changed-by info. Allow status change only via authoritative domain command.
- Fix farmer availability toggle API payload and ensure selected state persists.
- Buyer public list and direct product detail use identical eligibility; checkout validation uses same conditions. Replace showcase with explicitly labeled Demo Catalog or hide when DB empty.
**Gate:** draft invisible, submit in admin queue, admin approval visible in farmer and real buyer catalog when eligible, suspension disappears from list/detail/checkout, resubmission/reapproval work, refresh and role isolation verified.

### Phase 4 — Buyer cart/orders and farmer/admin fulfillment synchronization
- Buyer cart and order validation: seller eligibility, stock, MOQ, locked price, deterministic integer quantities and repeat-safe stock reservation.
- Within transaction, create Order, SellerOrders for each farmer, OrderItems/Payment and Inventory reservation; persisted order-placed events to recipients.
- Farmer inbox restricted to own SellerOrders, accept/process/ready controls; admin master order UI maps actions to authoritative domain commands (not status strings).
- Derive parent Order state from SellerOrders and delivery, preserving multi-vendor orders; notify buyer/admin/farmers appropriately; audited transitions.
- Buyer orders/tracking and admin views refresh from same persisted order. Do not mark payment PAID outside verified payment/gateway process.
**Gate:** two farmers one buyer order; visibility correctly separated; all stakeholders see consistent lifecycle after refresh; stock reservation and concurrency safe.

### Phase 5 — Disputes, refunds, settlement and payout (separate finance gate)
- Review current wallet/escrow/settlement invariants before modifying financial services. No assumption that existing arbitrary Order status update is legal payout instruction.
- Design exact legal state transitions, idempotency, row-level locks, ledger double-entry/source-of-truth, payment intent/webhooks, reconciliation and outbox.
- Dispute create triggers appropriate freeze/hold state; admin evidence review + authorized decision; refund/release executes once and preserves Order, SellerOrder, Payment, WalletTransaction, Inventory, audit and stakeholder notification consistency.
- Prevent 'COMPLETED' if escrow release required but failed; no swallowed financial errors. Do not release real funds in test.
- Use mock gateway/staging wallet only for initial integration tests and separately authorize any production payment enablement.
**Gate:** balance invariants, duplicate webhooks, retries, concurrency, refund failure, dispute double-resolution, and multi-vendor settlement all pass reconciliation tests.

### Phase 6 — Operational admin completion and truthful reporting
- Persist Admin Settings/control center; provide real separate policy store for platform settings and financial configs with governance.
- User provisioning via secure invite/reset flow (not random undisclosed passwords or fictional phones); admin-only privileged creation.
- Notifications read/clear persistence per user, admin moderation/event inbox, accurate audit trail.
- CMS: either implement persisted content workflow or visibly disable fake editing; no misleading success.
- Analytics computed only from real data, clean empty states. Improve performance, paging/filter/search and authorization.
- Review reporting/moderation according to policy from Phase 1.
**Gate:** all admin actions survive refresh/second session, expected recipient sees change, absent data yields honest empty state.

### Phase 7 — End-to-end regression, release and operations
- Automated unit contract, API auth, service transaction and browser E2E tests for Buyer, Farmer, Admin; independent staging fixtures.
- Test negative role isolation, stale cookies, wrong seller ownership, invalid status, duplicate checkout/dispute, inventory race, non-delivery of notification, KYC resubmission and admin rejection.
- Deploy per PR with tests, migration preview and rollback; compare DB snapshots, monitor logs/errors, measure page latency and repair if slow.
- Strict separation of demo-only catalog and production inventory.
**Gate:** all signed-off journeys pass in staging, then controlled production smoke testing with no live payouts until financial approval.

## 5. Role × event × read-model acceptance checklist

| Producer event | Admin must see/do | Farmer must see/do | Buyer must see |
|---|---|---|---|
| Farmer registers | Account with correct role and pending verification | Own onboarding status | Nothing sensitive |
| KYC submitted | New pending review record, evidence and counter | Submitted state | Nothing sensitive |
| KYC rejected/approved | Decision, actor, remarks, timestamp and audit | New status and notification | Verified badge only if approved |
| Product draft | In all-listings if filter allows; NOT pending queue | Private editable draft | Nothing (even direct ID) |
| Product submission | Pending review with actual farmer ID and submitted fields | Awaiting approval | Nothing |
| Product approval/rejection | Persisted decision & reason | Updated status and notification | Visible only if approved and eligible |
| Admin suspend/restore | Persisted reason and allowed transitions | Status + notification | Hidden/visible consistently in list/detail/cart |
| Farmer changes stock/price | Correct listing and audit | New values persist | Updated values for eligible items, old orders unchanged |
| Buyer order placed | Master Order, SellerOrders, stock and payment state | Own SellerOrder and notification | Own order and authoritative payment/fulfillment status |
| Farmer confirms / ships | Correct seller-specific and aggregate master state | Own order control | Updated aggregate state and notification |
| Admin order action | Explicit command, audit, all linked state | Correct SellerOrder impact | Parent order / tracking changes |
| Dispute opened | Queue + evidence + actual protected escrow status | Relevant case/hold (if seller impacted) | Dispute reference and hold visibility |
| Dispute resolved | All financial and nonfinancial entities reconcile | Final result, payout/refund notification | Final result and correct wallet/payment |
| Admin freezes account | Revoke all sessions and block unsafe mutations | Cannot continue activity, products hidden if seller | Cannot use suspended listings |
| Buyer reviews completed order | Abuse/moderation policy applied | Verified product rating | Honest review and rating |

## 6. Release and PR structure

Use one well-scoped PR per phase (or smaller change set), not one sweeping unreviewable mega-PR. Each PR includes schema changes (if needed), UI + backend together, tests, audit/event contracts, impact analysis, screenshots and a rollback procedure. No direct production seed or destructive SQL for functionality tests. Schema alignment already manually applied to Supabase must be accounted for before CI migration deployment.

**Definition of Done for a cross-role operation:** correct server authorization, validated input, atomically durable authoritative state, audit, reliable recipient event/outbox, correct counterpart page after refetch/relogin, and passing positive and negative tests. No standalone success toast passes this standard.

## 7. Approved product-policy lock; technical inputs still open

### Approved policies (binding)

| Decision | Approved implementation |
|---|---|
| Admin publishing | `audited-direct`: explicit eligible existing farmer; admin directly publishes only if all server-side validation and audit checks pass |
| Product reapproval | `claims`: safe price/stock edits can stay live; identity/origin/quality/photo claims require renewed moderation |
| Review publication | `instant`: verified-purchase reviews immediately visible after eligibility checks, with abuse reporting and admin takedown |
| Demo catalog | `separate`: showcase products are visibly designated demo-only, separate from production inventory and checkout |

### Technical details that remain to be resolved without reopening these decisions

- Define canonical inventory units before changing quantity or order arithmetic (fractional kg versus integer base units).
- Persist notifications and outbox; email may be an optional asynchronous delivery channel.
- Keep Flutterwave and real-money checkout disabled pending separate financial ledger/escrow approval.
- Choose a separated static showcase or isolated demo database; never mix demo products into real purchasable inventory.

**Phase 0 must pass** before feature PRs can be merged or deployed. Refer to [Phase 0 Execution Specification](./phase-0-security-database-ci-execution-spec-2026-10-21.md) for tracked deliverables and tests.

Approving these policies does not authorize immediate application-code changes or financial mutations.
