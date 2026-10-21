# SmartHub AgroChain — Phase 0 Security, Database & CI Execution Specification

**Status:** IMPLEMENTATION-READY PLAN — NOT IMPLEMENTED  
**Approved scope date:** 2026-10-21  
**Depends on:** [Approved Three-Role Master Plan](./three-role-implementation-master-plan-2026-10-21.md), [Admin Operations Audit](../audits/admin-operations-product-parity-2026-10-21.md), [Cross-Role Audit](../audits/cross-role-farmer-admin-buyer-2026-10-21.md)  
**Owner:** SmartHub AgroChain engineering; admin-only privileges remain under authorized production operator.  
**Zero-production-change gate:** This document is design and test planning. Creating it does **not** authorize code edits, deployments, auth cutovers, migrations, production seeds, live purchases, refunds, payouts, or outbound notifications.

## A. Locked scope and immovable constraints

The approved product decisions are binding on all future phases:
- **Admin product publishing = audited-direct.** An admin can create and directly publish for a specifically selected real farmer only when the farmer is approved and active, the product satisfies all marketplace eligibility rules, inventory/price are valid, and the actor/reason is durably audited.
- **Reapproval = claims.** Price and available stock can update live only with audit and reservation-safety checks; identity, provenance, grade/condition/quality claims, and supporting images require reapproval.
- **Reviews = instant.** Verified-purchase eligible reviews publish immediately, subject to abuse reporting and auditable admin takedown; no review may bypass buyer ownership/eligible purchase checks.
- **Demo catalog = separate.** Showcase fixtures must be clearly flagged and isolated from real purchasable inventory and checkout.

Keep **no public admin sign-up**, the current custom Prisma/PostgreSQL account system (not Supabase Auth), strict ADMIN/FARMER/BUYER role isolation, preservation of existing users and sessions during controlled migration, and no real-money financial test until the separate finance gate. No secrets or password hashes in docs, screenshots, logs, test artifacts or commit history.

## B. Verified pre-implementation baseline, 2026-10-21

1. GitHub \`main\` is Next.js 16.1.2 + Prisma 6.19.3 + Vitest. \`package.json\` includes \`build: prisma generate && next build\`, \`test: vitest run\`, and \`lint: next lint\`. Current \`.github/workflows/ci.yml\` **suppresses lint and test failure** with \`|| true\` (plus a \`jest || vitest\` fallback), so CI green is not a security gate. Exact lint CLI support must be checked for Next.js 16 before replacing it.
2. \`src/app/api/kyc/verify/route.ts\`: missing/wrong ADMIN session merely logs a warning at lines ~14–17, then still updates \`FarmerProfile.verificationStatus\`. Alternate \`/api/admin/verifications/[id]\` does check the admin realm. **Immediate security priority**.
3. \`src/lib/session.ts\`: \`getSessionContext()\` checks PostgreSQL Session revocation/expiry, User.isActive and realm role. \`getSession()\` falls back to a signed, unrevocable-by-Session legacy JWT; \`src/app/api/auth/login/route.ts\` and registration issue the legacy cookie. \`src/middleware.ts\` also recognizes legacy cookies at the routing layer.
4. \`src/app/api/auth/register/route.ts\` on \`main\` only sets legacy session cookie. Draft [PR #2](https://github.com/Maajolawasanjo/smarthub-agronexus/pull/2) adds database realm-session issuance on registration and configures Prisma migration URL preference for \`DIRECT_URL\`, but also preserves legacy JWT. **Do not merge PR #2 unreviewed**; adapt and test with Phase 0 session cutover.
5. \`prisma.config.ts\` on \`main\` uses \`DATABASE_URL\` for CLI migrations; Vercel \`DATABASE_URL\` is a transaction-pooler URL while \`DIRECT_URL\` exists for production. Prisma runtime should keep a correct pooler connection, while CLI migrations should use controlled direct/session pooling (never casually run DDL over a transaction pooler).
6. Supabase **has 26 application tables and six entries** under \`supabase_migrations.schema_migrations\`, but \`to_regclass('public."_prisma_migrations"')\` is NULL. Five historical migration scripts + one additive production alignment were applied through Supabase. Draft [PR #3](https://github.com/Maajolawasanjo/smarthub-agronexus/pull/3) contains the additive alignment SQL already applied in Supabase. **Do not run \`prisma migrate deploy\`, \`migrate reset\`, \`db push\` or replay \`init\` against Production until historical checksums/schema drift and baseline are reconciled.** Existing Prisma migration history is not present.
7. Vercel Production has \`DATABASE_URL\`, \`DIRECT_URL\`, and \`JWT_SECRET\`; \`NEXT_PUBLIC_APP_URL\` is **absent**. Several write routes compute allowed Origin from that variable with localhost fallback; real production host is used with both apex and www in conversation. Exact hostname policy and redirect must be verified before adding any allowlist. Production and preview variable targets differ; previews may lack database URLs.
8. At read-only baseline query: four user records and five session records; no \`_prisma_migrations\` table. No production business fixtures should be seeded for this phase. API route authentication has not been fully exercised in a real browser during this planning task.
9. \`__tests__/multi-realm-session.test.ts\`, \`__tests__/integration/phase0-security-containment.test.ts\`, \`__tests__/admin-foundation.test.ts\`, etc., exist. Their presence does not imply passing tests or correct deployed behavior. Existing tests mock Prisma/session and some **explicitly expect legacy JWT**: update or quarantine those assertions only with replacement coverage, not by blindly deleting tests.
10. Treat webhook, payout, wallet and escrow work as locked until Phase 5. Phase 0 may *test that* unauthenticated actors cannot mutate financial routes, but must not process funds.

## C. Dependency graph

\`\`\`text
P0-01 inventory/backup + staging isolation
  ├── P0-02 migration drift & baseline (MUST precede any migration command)
  ├── P0-03 CI integrity (needed before protected merges)
  ├── P0-04 canonical origin/CSRF contract
  └── P0-05 KYC privilege containment [urgent]
       ↓
P0-06 database-backed auth/session migration + legacy-cookie containment
       ↓
P0-07 route-wide permissions & identity tests
       ↓
P0-08 secure configuration / preview isolation
       ↓
P0-09 integrated staging negative tests
       ↓
P0-10 limited production release and non-mutating smoke tests
       ↓
PHASE 0 GO/NO-GO — prerequisites for Phase 1
\`\`\`

**Exception:** P0-05 is a security hotfix candidate and should be prioritized as soon as implementation is authorized, without waiting for the entire feature roadmap. Still require its own negative tests and release review.

## D. Implementation tickets (NO CODE WORK HAS STARTED)

### P0-01 — Capture verified release baseline and recoverability
**Priority:** blocker | **Dependencies:** none | **Artifacts:** environment manifest, source SHAs, DB backup and restore evidence.
- Record GitHub \`main\` commit, exact deployed Vercel commit/alias, Node and Prisma versions, PR #2 and #3 head/base, existing migration files, current Cloudflare/DNS domain routing, and any staging instance.
- Inventory environment variable *names, scopes and target environments* only; never export plaintext credentials. Verify production vs Preview database isolation and the existence of a secure staging URL/database.
- Use provider-supported Supabase backup/export and document **restoration drill** before DDL or auth cutover. Preserve identities, historical session state, orders and future finance records. Do not assume time-travel backup is enabled.
- Decide release windows, rollback owner and separate on-call verification actor. Log each production action in release checklist.
**Done:** immutable baseline manifest, restorable backup, locked prod/staging boundary, zero user data lost.

### P0-02 — Reconcile Prisma vs Supabase migration histories
**Priority:** blocker | **Dependencies:** P0-01 | **Files:** \`prisma/schema.prisma\`, \`prisma/migrations/*\`, \`prisma.config.ts\`, PR #3.
- Perform **read-only** schema diff: models/columns, types/enums, defaults, uniqueness, foreign keys, onDelete/onUpdate behavior, indexes, RLS, functions/triggers and ledger constraints; presence of 26 tables alone is insufficient. Compare each historical SQL file/expected checksum to Supabase's recorded and actual effects.
- Distinguish the five original Prisma migration directories from the manually applied additive sixth. Review PR #3 and place its SQL in versioned history once; merge order cannot inadvertently rerun it.
- On isolated clone only, rehearse Prisma migration baseline using officially supported \`prisma migrate resolve --applied\` per exact migration name, **only after** verification that the schema reflects the migration. Baseline is *bookkeeping*, not a substitute for applying missing DDL. Document how the sixth alignment migration corresponds to its GitHub directory.
- Do not create fake Applied entries for divergent SQL. Resolve any drift with a reviewed additive reconciliation migration; never drop live data to make history fit.
- Validate a no-op subsequent \`prisma migrate deploy\` against the cloned baseline. Ensure Prisma CLI uses \`DIRECT_URL\`; runtime uses \`DATABASE_URL\`.
**Done:** documented 6/6 mapping, no pending phantom migrations, no drift that blocks Auth/Session, cloned deploy is no-op, production baseline action separately approved.

### P0-03 — Make CI fail closed and deterministic
**Priority:** blocker | **Dependencies:** P0-01 | **Files:** \`.github/workflows/ci.yml\`, \`package.json\`, \`eslint.config.mjs\`, \`vitest.config.ts\`, \`tsconfig.json\`.
- Replace \`npm run lint || true\` with a working ESLint CLI for installed Next.js 16 (\`eslint .\` with explicit config, excluding generated output). Remove Jest fallback and unconditional success from test step. Run \`npm ci\`, \`npx prisma validate\`, \`npx prisma generate\`, \`npx tsc --noEmit\`, \`npm run lint\`, \`npm test\`, \`npm run build\`.
- CI build **must not connect to production database** or send emails. Provide scoped dummy compile-time vars or isolated test env, not real secrets.
- Add workflow concurrency controls and PR status checks; record exact Node version and caching/lockfile.
- Verify a deliberately failing lint/test/TypeScript case makes the job red; prevent Vercel auto-deploy/merge on failed checks when repository permissions allow. No \`|| true\`, \`continue-on-error\` or blanket \`skip\` for security.
**Done:** reproducible green on clean clone; one deliberate negative produces failed CI; no plaintext secrets; zero Production DB writes.

### P0-04 — Centralize production Origin/CSRF policy
**Priority:** blocker | **Dependencies:** P0-01 | **Files:** API mutations in \`src/app/api/admin/*\`, \`src/app/api/auth/*\`, shared security utility (to be created).
- Resolve the **single canonical** public host via redirects (recommend \`https://www.smarthubagrochain.online\` if production routes use www; verify DNS/redirect first) and explicit alternate same-site apex redirect policy.
- Set \`NEXT_PUBLIC_APP_URL\` only after confirming actual canonical production host, scope and preview behavior. Consider a server-only trusted origin config to avoid inadvertently trusting caller-supplied Host/X-Forwarded-Host.
- Define one \`assertSameOrigin\` function using a server-configured allowlist, strict scheme/host/port parse, and safe treatment of absent Origin for browser cookie mutations (defense-in-depth with SameSite and CSRF token as appropriate). Document handling for Vercel Preview hosts; never allow wildcard Vercel domains or localhost in production.
- Use the centralized policy in admin user creation, order actions, config, fees, dispute and withdrawals, other credential-bearing state-changing requests.
**Done:** legitimate prod same-origin passes; cross-origin, falsified forwarded headers, \`null\` Origin, scheme downgrade, and untrusted preview host denied unless deliberately supported by documented separate CSRF token mechanism.

### P0-05 — Fix unauthorized privileged KYC endpoint
**Priority:** urgent security | **Dependencies:** isolated tests + implementation sign-off | **Files:** \`src/app/api/kyc/verify/route.ts\`, \`src/app/api/admin/verifications/[id]/route.ts\`.
- Reject missing/buyer/farmer/expired/revoked sessions **before** parsing the body or executing any DB operation.
- Prefer consolidate to one canonical admin-only verification domain command under \`/api/admin/verifications/[id]\`; alternate \`/api/kyc/verify\` may return 404/410, or delegate only after strict \`getAdminSession()\` authorization and validated request.
- Validate \`APPROVE\`/\`REJECT\` action, valid target ID, evidence state, reviewedBy/At and remarks; require a reason for rejections. Record immutable audit and stage durable notification in the authorized transaction/outbox design (Phase 2 may complete notification architecture).
- Use parameterized Prisma updates, never trust \`farmerProfileId\` ownership from body for privileged paths without lookup.
**Done:** 0 unauthenticated state transitions; correct admin decision leaves exactly one coherent persisted status.

### P0-06 — Convert all auth flows to revocable realm sessions safely
**Priority:** blocker | **Dependencies:** P0-02, P0-05 | **Files:** \`src/lib/session.ts\`, \`src/middleware.ts\`, \`src/app/api/auth/register/route.ts\`, \`login/route.ts\`, \`logout/route.ts\`, \`me/route.ts\`, protected route handlers, PR #2.
- Preserve public BUYER/FARMER signup only; **never introduce public admin signup**. On successful registration, create User, correct role profile and persisted realm Session; issue HttpOnly realm cookie with vault ID, Secure/SameSite policy, and safe expiry. Define failure handling so a user isn't stranded if session issuance fails after account creation.
- On login, always check fresh \`User.isActive\`, bcrypt password and requested realm against stored User.role. Prevent arbitrary role promotion by header or cookie. Admin login uses only ADMIN realm.
- Stop issuing legacy JWT for new logins; explicitly retire or short-lived revalidate old signed \`smarthub_session\` tokens against current user role, isActive, and revocation epoch. Define grace-period and user-facing relogin behavior; **no silent authorization bypass**.
- Make \`getSession()\` enforce the same authoritative DB-backed revocable context as realm-specific calls. \`src/middleware.ts\` remains non-authoritative presence/routing gate, never permission proof.
- Logout revokes exactly requested realm; clarify legacy-cookie clearing and whether other role sessions in same browser remain active. Freeze/deactivation revokes all registry sessions and invalidates existing legacy tokens. Rotated password and role downgrade invalidate prior sessions.
- Audit cookie path/domain for www↔apex; never cross-contaminate Admin with Buyer/Farmer, and never trust caller \`x-auth-realm\` as authorization.
**Done:** registration produces matching Session; fresh login/logout/relogin works; suspended user cannot mutate through either realm or old JWT; simultaneous role sessions obey access matrix.

### P0-07 — Apply enforcement inventory to all role routes
**Priority:** high | **Dependencies:** P0-06 | **Files:** \`src/app/api/admin/**\`, \`src/app/api/farmer/**\`, \`src/app/api/orders/**\`, \`src/app/api/products/**\`, \`src/app/api/wallet/**\`, \`src/app/api/disputes/**\`.
- Build route inventory of method, required realm, resource ownership, active state and CSRF validation. Every mutation must authorize at the server; middleware is not sufficient.
- Prevent Buyer→Farmer/Admin, Farmer→other Farmer, Admin realm→buyer-owned wallet operations unless explicitly delegated. Mask resource existence where useful (404 vs 403).
- Review shared \`getSession()\` endpoints that can be abused with multiple realm cookies, and separate read authority from mutation authority. Re-check \`User.isActive\` for each privileged call.
- Basic financial route checks only; **do not refactor or execute money transitions** in Phase 0 (separate finance workstream).
**Done:** all identified privileged routes have documented policy + positive/negative tests; no unauthorized writes.

### P0-08 — Environment, secrets and release hygiene
**Priority:** high | **Dependencies:** P0-01/02 | **Files:** deployment configuration and documented operator settings.
- Verify \`DATABASE_URL\` transaction-pooler username/port and \`DIRECT_URL\` session/direct port; ensure live app is not pointed at an unexpected Supabase project.
- Distinguish Production, Preview and Development. Do not let Preview use production wallets, mail, DB or administrative identities; use a disposable staging Supabase project.
- Verify JWT/HMAC secrets are strong and never exposed to browser; plan rotation for credentials previously shared in chat, including DB and privileged API keys, with rollback and deployment sequencing. Rotate only with controlled operator approval.
- Pin allowed canonical host, verified Resend sender and safe nonproduction mail sink, after auth and CSRF tests.
- Document minimum permissions for Supabase/Vercel/GitHub integration and ways to access logs without sharing sensitive values.
**Done:** verified environment mapping, no credential leak in logs, staging isolation.

### P0-09 — Prove acceptance with isolated automated tests
**Priority:** blocker | **Dependencies:** P0-03–08 | **Files:** new \`__tests__/security/*.test.ts\`, existing \`multi-realm-session.test.ts\`, \`phase0-security-containment.test.ts\`, integration and E2E harness.
- Unit: origin parser, roles, token TTL, cookie attributes, KYC validator.
- Route integration: mock sessions **and** verify none of the Prisma mutation methods are called on forbidden requests; verify real admin path with isolated DB fixture.
- DB integration: use separate test PostgreSQL database with disposable User/Session/Farmer/Verification rows; assert commit, rollback and session revocation.
- Browser E2E: buyer, farmer, admin login, realm isolation, logout, freeze, cross-origin negative test, reload/refetch.
- Negative CI test: broken assertion causes job fail; preview/staging builds never access Prod or real email.
**Done:** all documented T0 tests pass with artifacts; no expected failures suppressed.

### P0-10 — Release in contained increments, observe, and verify
**Priority:** blocker | **Dependencies:** all preceding | **Files:** release runbook/checklist.
- Split into reviewable PRs, proposed order: **P0-A security KYC & fail-closed tests**, **P0-B origin/auth cutover**, **P0-C CI/drift baseline/staging readiness** (adapt deployment sequencing so CI protection precedes production merge).
- Run full test suite and E2E on staging. Document network/DB outage, user inactive, token expiry, incorrect origin and duplicate signin handling.
- Deploy behind operational review; run **non-financial production smoke tests**, verify login/logout and legitimate existing accounts only with consent; avoid inventing sample customer/farmer accounts on production.
- Check Vercel runtime logs and Supabase audit/session counts, watch 401/403 and 5xx, failed KYC writes; never log tokens/passwords. Roll back to last safe app build or activate tested mitigation if auth migration fails; never blindly roll back database schema.
**Done:** security acceptance evidence, signed operational go/no-go, no lost accounts, no unauthorized access, no production money touched.

## E. Required test cases (Phase 0) — named and executable

| ID | Class | Setup / action | Pass criterion |
|---|---|---|---|
| T0-01 | KYC authorization | POST \`/api/kyc/verify\` anonymously with APPROVE | 401/403; no FarmerProfile/Verification/AuditEvent mutation |
| T0-02 | KYC authorization | POST same route as Buyer and Farmer | 403, no mutation |
| T0-03 | KYC authorization | POST with revoked/expired Admin Session | 401/403, no mutation |
| T0-04 | KYC happy path | Approved Admin session with valid pending document | Exactly one authorized persisted decision, reviewer/timestamp/audit recorded |
| T0-05 | KYC validation | Admin sends invalid action, missing farmer, rejection with no reason | 400/404, no status mutation |
| T0-06 | Signup | Buyer signup in isolated DB | User + BuyerProfile + Session + BUYER cookie; ADMIN cookie absent |
| T0-07 | Signup | Farmer signup in isolated DB | User + FarmerProfile PENDING + Session + FARMER cookie |
| T0-08 | Privilege | Public registration with \`role=ADMIN\` | No ADMIN user or session created |
| T0-09 | Login | Valid Admin password+realm | Only authorized ADMIN session; wrong realm/role gets 403 |
| T0-10 | Password | Wrong password and nonexistent email | Uniform failure, no session; secrets never logged |
| T0-11 | Logout | Buyer realm logout with Admin also signed in same browser | Buyer revoked; Admin realm retained (or documented explicit all-logout semantics) |
| T0-12 | Expiry | Expired/revoked DB Session cookie | No authorization in page API or shared API |
| T0-13 | Freeze | Admin suspends a Buyer/Farmer; immediately retry old cookie | Both registry and legacy-token paths denied |
| T0-14 | Reactivate | Admin reactivates suspended user | Old revoked session remains denied; fresh login required |
| T0-15 | Multi-realm | Same browser holds Admin and Buyer/Farmer sessions | Each route only accepts correct authorized user+realm; no cross-realm privilege escalation |
| T0-16 | CSRF | Correct production Origin on admin write in staging-like canonical host | Passes CSRF layer when authorized |
| T0-17 | CSRF | Foreign Origin, null Origin, wrong port/scheme, spoofed Host | Denied, no mutation |
| T0-18 | CSRF | Apex→www redirect/canonicalization | Documented behavior, no leaked auth cookies or cross-host bypass |
| T0-19 | Migration | Clone of production schema and migration records | Baseline maps 6 existing migrations without applying duplicate CREATE |
| T0-20 | Migration | \`prisma migrate deploy\` on properly baselined staging clone | No-op and no data loss; production not used |
| T0-21 | Drift | \`prisma migrate diff\` and catalog consistency checks on staging | No unreviewed differences in enums, indexes, FKs, defaults, RLS |
| T0-22 | CI failure | Intentionally failing lint, typecheck and unit test in disposable PR | Each causes a red required job, never masked |
| T0-23 | CI clean | \`npm ci\` → Prisma validate/generate → tsc → ESLint → Vitest → build | All green, artifacts retained |
| T0-24 | Env isolation | Preview deployment attempts DB/email action | Never connects to production DB/mailer; disposable staging only |
| T0-25 | Route ACL | Exercise Buyer→Admin, Farmer→Admin, Buyer→other Buyer, Farmer→other Farmer APIs | 403/404, no unauthorized read/write |
| T0-26 | Resilience | DB unavailable while user performs auth request | Controlled 503/5xx, no false login success, no leaked secrets |
| T0-27 | Production smoke | Existing authorized account sign-in, authenticated GET, sign-out | Correct UI + DB Session record/revocation and audit telemetry; no business writes |
| T0-28 | Regression | Simultaneous Admin + Buyer login, cookie rotation, OAuth-none model | Existing registration users unaffected; valid role isolation after deploy |

**Interpretation:** These are required tests to **write and run during implementation**, not tests already executed or passed. Use a harness that covers route handler and DB behavior; mocks alone do not satisfy DB and browser gates.

## F. Pull request breakdown and dependencies

| PR | Target content | Required reviewer/gate |
|---|---|---|
| **P0-A** | Block unauthorized KYC endpoint, strict admin decisions, unit + route negative tests | High-priority security review, T0-01–05 |
| **P0-B** | Reconcile PR #2 auth changes, legacy retirement, role sessions, logout, middleware behavior | Session revocation and login E2E, T0-06–15 |
| **P0-C** | Canonical origin & CSRF enforcement, per-route authorization inventory | T0-16–18, T0-25 |
| **P0-D** | Repair CI, reliable lint/TS/test gates, staging isolation and reproducible build | T0-22–24, T0-26 |
| **P0-E** | Safely integrate PR #3 and reconcile migration history in staging (Production baseline requires separate explicit approval) | T0-19–21, backup/rollback |
| **P0-F** | Documentation and release/smoke checklist (no security regression) | T0-27–28 and owner go/no-go |

Order of merge should preserve **fail-closed CI and tested staging before Production deployment**, even if code development of the KYC hotfix is prioritized. Do not assume PR #2 or PR #3 can be merged without rebasing/test reconciliation. No automatic production DDL from app deploy.

## G. Evidence required for Phase 0 sign-off

- [ ] All changes linked to a reviewed PR and tests; no code left in unmerged draft PR if required in live app.
- [ ] Production schema backup + staging restore drill recorded.
- [ ] Verified migration diff and six migration-history mappings (five historical + additive alignment).
- [ ] No unauthenticated KYC mutation possible.
- [ ] All account suspension actions invalidate old and new cookies; old JWT fallback cannot bypass current user role/isActive.
- [ ] Existing Buyer, Farmer and Admin sign-in flows work without public admin signup.
- [ ] CSRF/origin permits only intended public origin(s) with deliberate preview rules.
- [ ] Lint/type/test/build gates fail closed and pass cleanly after changes.
- [ ] Auth and role access tests pass in staging, then controlled production smoke; runtime logs reviewed.
- [ ] No customer data loss, unexpected sessions, demo inventory contamination or payment/escrow activity.
- [ ] Release/rollback owners approve the GO/NO-GO record.

**Phase 0 status: NOT STARTED / NOT VERIFIED.** This specification is ready for engineering execution; application code must remain unchanged until the user authorizes implementation.
