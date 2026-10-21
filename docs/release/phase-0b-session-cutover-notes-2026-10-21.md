# Phase 0-B — Realm Session Cutover (implementation release note)

**Status:** Implemented in isolated draft PR; not deployed.  
**Depends on:** Phase 0-A KYC authorization PR #4; staging and acceptance gates in docs/plans/phase-0-security-database-ci-execution-spec-2026-10-21.md.

## Behavioral changes

- A successful BUYER/FARMER registration now creates a Session registry row and HttpOnly realm cookie. Public ADMIN registration is rejected with HTTP 403.
- A successful login creates the appropriate revocable role session, clears the legacy cookie, and does not issue a new legacy JWT.
- APIs using getSession() no longer accept old JWT-only cookies; a user with only the old cookie must sign in again. This is intentional for suspension and logout safety. The user and profile database records are preserved.
- getSharedSession() rejects explicit disallowed x-auth-realm selection rather than falling back to another user's role cookie.
- If registration commits user/profile data but cannot create a session, the response is HTTP 503 with accountCreated:true and clear instruction to sign in, to avoid duplicate registration retries.

## Acceptance and release conditions

- New and old accounts can log in to their original roles with correct current User.role and isActive.
- An inactive user, expired/revoked session, stale admin role, or JWT-only request is denied by server-side authorization.
- Logout and freeze revoke sessions; persistent customer data is unchanged.
- Security and full Vitest/TypeScript/build CI pass (scoped lint for modified files; full-repository lint debt remains tracked).
- Review middleware's legacy presence-only routing gate and convert it to realm-only after integration tests in the next security step; middleware must **never** be the sole authorization source.
- Ensure no state-changing routes rely exclusively on middleware; each must check PostgreSQL-backed session. Follow-up Phase 0-C audits all API routes.
- Run staging browser E2E and obtain controlled production release approval; no live database writes, migration or financial test in this branch.

## Note about existing branch alignment

PR #2 has a related registration-only fix and must **not** be separately merged over this change. Reconcile/close it after Phase 0-B is accepted. PR #3 and the existing live Supabase migration require separate Prisma migration-history baseline; do not run Prisma migrate deploy as part of this change.
