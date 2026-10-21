# Phase 0-C — Browser Mutation CSRF Containment

**State:** Branch implementation; merge/deployment not yet approved  
**Baseline:** PR #6 (revocable realm sessions); PR #7 (origin policy and protected writes)  
**Production canonical Origin:** `https://www.smarthubagrochain.online`. The default is intentional because the production Vercel project currently lacks `NEXT_PUBLIC_APP_URL`.

## Security contract

- Accept production cookie-backed mutations only if an actual HTTP `Origin` or `Referer` matches the deployment's preconfigured trusted origin **exactly**, including HTTPS and port, and any supplied Sec-Fetch-Site is `same-origin` or `none`.
- Reject requests lacking both headers. This is a browser-facing cookie route contract; service API integrations need distinct token authentication and authorization, not a header bypass.
- Never trust `Host`, `X-Forwarded-Host`, arbitrary wildcard domains, substring comparisons, or `localhost` in production.
- A trusted `APP_ORIGIN` or `NEXT_PUBLIC_APP_URL` is an operator-controlled override. A preview deployment may derive the exact origin from trusted `VERCEL_URL` when no operator origin is specified. Preview DB/secret isolation remains required before deployment.
- Server-side `getAdminSession()` or appropriate Buyer/Farmer `getSharedSession()` and resource ownership checks remain required after CSRF.
- Both `Origin` **and** `Referer` must agree if both supplied. Cross-site `Sec-Fetch-Site` is rejected even if another header is spoofed.
- Never apply this policy as a substitute for verifying payment-provider webhook signatures. Browser writes and server-to-server callbacks have different authentication models.

## Mutation routes brought under unified origin guard

| Route | Verbs | Owner/session |
|---|---|---|
| `/api/admin/users` | POST, PATCH | ADMIN |
| `/api/admin/farmers/[id]` | PATCH | ADMIN |
| `/api/admin/users/[id]/freeze` | PATCH | ADMIN |
| `/api/admin/products/[id]/approve` | PUT, DELETE | ADMIN |
| `/api/admin/verifications/[id]` | PUT | ADMIN |
| `/api/admin/config` | PATCH | ADMIN |
| `/api/admin/config/fees` | PATCH | ADMIN |
| `/api/admin/orders/[id]` | PUT | ADMIN |
| `/api/admin/disputes/[id]/resolve` | POST | ADMIN |
| `/api/admin/withdrawals` | POST | ADMIN |
| `/api/wallet/withdraw` | POST | BUYER/FARMER realm |
| `/api/auth/logout` | POST | role-specific session revocation |

**Not modified by this PR:** order, escrow, fee calculation, payout state machines, persistence semantics, migrations or account records. Existing admin settings still use process-memory state; CSRF does not fix that. Existing Admin product form fields, order action mismatches and seller checks remain the subject of later phases.

## Verification plan

- Route tests: admin authenticated + evil/no Origin returns 403 before any Product/Verification/User DB calls; unauthenticated admin same-origin denied; valid production origin reaches input/domain validation.
- Unit tests: exact origin vs malicious subdomain/prefix, HTTP downgrade, localhost mismatch, wrong port, bad Referer, absent headers, malformed Origin, `Sec-Fetch-Site` cross-site and preview host.
- Regression: prior Phase 0-A KYC and Phase 0-B revocable session suites; entire Vitest suite and Next.js production build.
- CI: scoped ESLint gate for new security helper and test files, with full-repository lint debt tracked separately.
- Staging E2E remains **required** before production merge: browser-admin product moderation, Farmer KYC decisions, user freeze, order operations, cookie logout, and Buyer/Farmer withdrawal negative tests with **no money moved**.
- Production deployment status is not independently accessible using current Vercel connector scope; do not claim deployed until deployment SHA/aliases and authenticated endpoint tests are verified.

## Follow-up Phase 0-C2

Enumerate **all** Buyer/Farmer cookie-backed writes, including profile, addresses, orders, cart, reviews, KYC upload, farmer produce, disputes and bank-account management. Add the same guard as appropriate in small reviewed batches. Explicitly distinguish payment and gateway callback endpoints so signature-verified webhooks are not inadvertently broken. Validate frontend same-origin requests and upload clients before expanding the guard. Then add protected branch rules and a complete CI lint baseline improvement.
