# SMART HUB AGROCHAIN — FORENSIC AUTHENTICATION & AUTHORIZATION AUDIT

**Date:** September 11, 2026  
**Target Codebase:** SmartHub AgroChain (`smarthub-agronexus`)  
**Scope:** Full-stack authentication, authorization, session lifecycle, credential handling, middleware guards, and protected resource access.  
**Execution Mode:** Pure Forensic Code Audit (No source files modified, zero implementation assumed).

---

## 1. Executive Summary

### Overall Status: **CRITICAL SECURITY ISSUES / PARTIALLY COMPLETE**

While the core baseline of user registration and login is connected to PostgreSQL via Prisma and protected with bcrypt and HMAC-SHA256 JWT cookies, the authentication and authorization architecture is **NOT production-ready**. 

The forensic audit revealed severe architectural omissions, unthrottled endpoints, broken access controls (BOLA/IDOR), a fatal hashing mismatch in the password update route, and completely unauthenticated administrative endpoints.

### Key Audit Findings Matrix
| Component | Status | Code Reality Summary |
|---|:---:|---|
| **Buyer Registration & Login** | ⚠️ **PARTIAL** | End-to-end connected to Supabase DB via bcrypt; but zero email verification, zero rate limiting, and email change requires no authentication or re-check. |
| **Farmer Registration & Login** | ⚠️ **PARTIAL** | Profile and wallet are atomically created; but verification state gating is bypassed for public produce viewing, and no dedicated farmer onboarding state machine exists. |
| **Admin Authentication** | 🔴 **VULNERABLE** | Separate `/admin/login` page exists, but relies on standard `/api/auth/login` which sets a valid session cookie for non-admins before the UI rejects them; no MFA; no self-service creation. |
| **Session Management** | ⚠️ **PARTIAL** | Stateless 7-day HMAC-SHA256 JWT in `HttpOnly` cookie. **Zero server-side session revocation**; logout only clears the client cookie; tokens cannot be invalidated upon account suspension or password change. |
| **Route Protection (Middleware)** | 🔴 **VULNERABLE** | [`src/middleware.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts#L130-L136) matcher **only covers `/dashboard/:path*`, `/farmer/:path*`, and `/admin/:path*`**. **All `/api/*` routes are excluded from middleware**. Several APIs fail to check user identity or ownership. |
| **Resource Ownership (IDOR/BOLA)** | 🔴 **VULNERABLE** | Critical endpoints (`PUT /api/orders/[id]` and `POST /api/disputes`) perform **zero ownership checks**, allowing any logged-in user to mutate or freeze any order. |
| **Public Information Leakage** | 🔴 **VULNERABLE** | [`GET /api/disputes`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/disputes/route.ts#L57-L80) has **zero authentication** and dumps all buyers' full names, emails, and order dispute records to the public internet. |
| **Password Update Route** | 🔴 **VULNERABLE** | [`src/app/api/user/password/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/user/password/route.ts#L8-L17) uses insecure `pbkdf2Sync` with a hardcoded static salt (`"agrosalt"`) and only 1000 iterations instead of `bcrypt`, reads an unverified fallback cookie (`"userId"` || `"usr_demo_buyer"`), and permanently breaks login for users who update their password. |
| **Email Verification** | ❌ **MISSING** | Non-existent. No schema fields, no tokens, no email delivery, no verification routes. Accounts are immediately active. |
| **Password Recovery (Forgot/Reset)** | ❌ **MISSING** | Non-existent. No `/forgot-password`, no `/reset-password`, no token tables, no recovery mechanism. |
| **Rate Limiting / Brute Force** | ❌ **MISSING** | [`src/lib/rate-limit.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/lib/rate-limit.ts#L9) is implemented but **never called anywhere in the codebase**. Login and registration can be brute-forced infinitely. |

---

## 2. Actor Flow Diagrams with Node Status

### Node Legend
- ✅ **Implemented:** Fully functional and backed by code.
- ⚠️ **Partial:** Works partially or exhibits structural divergence.
- ❌ **Missing:** Absent from code, schema, or routing.
- 🔴 **Vulnerable:** Security hole, bypassable logic, or data exposure.
- ❓ **Not Verified:** Cannot be confirmed through code or automated traces.

---

### BUYER SIGNUP FLOW
```mermaid
flowchart TD
    A["[Buyer Signup UI (/signup)]"] -->|✅| B["[Client-side Form Validation]"]
    B -->|✅| C["[POST /api/auth/register]"]
    C -->|✅| D["[Server-side Payload Validation]"]
    D -->|❌| E["[Rate Limit Guard]"]
    D -->|✅| F["[Duplicate Email & Phone Lookup]"]
    F -->|✅| G["[Bcrypt Hash (rounds: 10)]"]
    G -->|✅| H["[Atomic Prisma $transaction]"]
    H -->|✅| I["[User Record Created (Role: BUYER, isActive: true)]"]
    H -->|✅| J["[BuyerProfile Created]"]
    I -->|❌| K["[Email Verification Token Generated & Sent]"]
    I -->|✅| L["[JWT Created (HMAC-SHA256, 7-day exp)]"]
    L -->|✅| M["[Set-Cookie: smarthub_session (HttpOnly, SameSite: lax)]"]
    M -->|✅| N["[UserContext Hydration: setUserFromAuth]"]
    N -->|✅| O["[router.push('/dashboard')]"]
    O -->|✅| P["[Edge Middleware Route Guard]"]
    P -->|✅| Q["[Buyer Dashboard (/dashboard)]"]
    Q -->|⚠️| R["[Protected Data APIs]"]

    style E fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style K fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style R fill:#faad14,stroke:#333,stroke-width:1px,color:#000
    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style I fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style J fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style L fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style M fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style N fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style O fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style P fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
```

---

### BUYER LOGIN FLOW
```mermaid
flowchart TD
    A["[Buyer Login UI (/login)]"] -->|✅| B["[Client Format Validation]"]
    B -->|✅| C["[POST /api/auth/login]"]
    C -->|🔴| D["[Rate Limiting / Brute-Force Protection]"]
    C -->|✅| E["[User Lookup by Email in Prisma]"]
    E -->|✅| F["[Account Status Check (isActive === true)]"]
    F -->|✅| G["[Bcrypt Password Verification]"]
    G -->|✅| H["[JWT Created (userId, email, role)]"]
    H -->|✅| I["[Set-Cookie: smarthub_session]"]
    I -->|✅| J["[Client Context Hydration]"]
    J -->|✅| K["[Client Role Redirection (/dashboard)]"]
    K -->|✅| L["[Edge Middleware Session & Role Check]"]
    L -->|✅| M["[Buyer Dashboard Access]"]
    M -->|🔴| N["[Audit Log Record]"]

    style D fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style N fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style E fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style I fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style J fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style K fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style L fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style M fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
```

---

### FARMER SIGNUP FLOW
```mermaid
flowchart TD
    A["[Farmer Signup UI (/signup?tab=farmer)]"] -->|✅| B["[Farm Fields Validation (farmName, state)]"]
    B -->|✅| C["[POST /api/auth/register (role=FARMER)]"]
    C -->|🔴| D["[Rate Limiting Guard]"]
    C -->|✅| E["[Bcrypt Hash Password]"]
    E -->|✅| F["[Prisma $transaction]"]
    F -->|✅| G["[Create User (Role: FARMER)]"]
    F -->|✅| H["[Create FarmerProfile (Status: PENDING)]"]
    G -->|❌| I["[Verification Document Submission Upload]"]
    G -->|✅| J["[Issue JWT Session Cookie]"]
    J -->|✅| K["[Redirect to /farmer]"]
    K -->|✅| L["[Farmer Dashboard UI]"]
    L -->|⚠️| M["[Access to Marketplace Sells]"]

    style D fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style I fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style M fill:#faad14,stroke:#333,stroke-width:1px,color:#000
    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style E fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style J fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style K fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style L fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
```

---

### FARMER LOGIN FLOW
```mermaid
flowchart TD
    A["[Farmer Login UI (/login)]"] -->|✅| B["[Submit Credentials]"]
    B -->|✅| C["[POST /api/auth/login]"]
    C -->|✅| D["[Verify Credentials in DB]"]
    D -->|✅| E["[Issue smarthub_session Cookie]"]
    E -->|✅| F["[Client Role Check: FARMER]"]
    F -->|✅| G["[Redirect to /farmer]"]
    G -->|✅| H["[Middleware Farmer Route Enforcement]"]
    H -->|✅| I["[Farmer Portal Rendered]"]

    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style E fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style I fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
```

---

### ADMIN LOGIN FLOW
```mermaid
flowchart TD
    A["[Admin Login UI (/admin/login)]"] -->|✅| B["[Submit Credentials]"]
    B -->|✅| C["[POST /api/auth/login]"]
    C -->|🔴| D["[Backend Role Gating (None: sets cookie for any valid user)]"]
    D -->|✅| E["[Set smarthub_session Cookie]"]
    E -->|🔴| F["[Client-Side Check: data.user.role === 'ADMIN']"]
    F -->|✅| G["[If ADMIN: redirect to /admin/overview]"]
    F -->|🔴| H["[If Non-Admin: UI shows error but cookie is already set!]"]
    G -->|✅| I["[Middleware Admin Route Enforcement]"]
    I -->|✅| J["[Admin Console Access]"]
    J -->|❌| K["[MFA / 2FA Challenge]"]

    style D fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style K fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style E fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style I fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style J fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
```

---

### LOGOUT FLOW
```mermaid
flowchart TD
    A["[User clicks Logout]"] -->|✅| B["[UserContext: logout()]"]
    B -->|✅| C["[POST /api/auth/logout]"]
    C -->|✅| D["[clearSessionCookie(): maxAge: 0]"]
    D -->|🔴| E["[Server-Side Token Revocation / Blacklist]"]
    C -->|✅| F["[Client: setUser(null)]"]
    F -->|✅| G["[window.location.href = '/login']"]
    E -.->|🔴| H["[Stolen JWT remains valid across all APIs until 7-day expiry]"]

    style E fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
```

---

### EMAIL VERIFICATION FLOW
```mermaid
flowchart TD
    A["[User Registration]"] -->|❌| B["[Generate Secure Verification Token]"]
    B -->|❌| C["[Persist Token in DB with Expiration]"]
    C -->|❌| D["[Dispatch Verification Email via Resend]"]
    D -->|❌| E["[User Clicks Link: /verify-email?token=...]"]
    E -->|❌| F["[Verify Token & Single-Use Enforcement]"]
    F -->|❌| G["[Update User: emailVerified = true]"]
    G -->|❌| H["[Unlock Full Marketplace Privileges]"]

    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style E fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
```

---

### PASSWORD RESET FLOW
```mermaid
flowchart TD
    A["[User forgets password]"] -->|❌| B["[/forgot-password UI]"]
    B -->|❌| C["[POST /api/auth/forgot-password]"]
    C -->|❌| D["[Create Reset Token (DB Table)]"]
    D -->|❌| E["[Dispatch Reset Link Email]"]
    E -->|❌| F["[/reset-password?token=... UI]"]
    F -->|❌| G["[POST /api/auth/reset-password]"]
    G -->|❌| H["[Bcrypt New Password & Invalidate Sessions]"]

    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style E fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
```

---

### SESSION EXPIRATION FLOW
```mermaid
flowchart TD
    A["[JWT Token reaches 7 days (payload.exp)]"] -->|✅| B["[Client sends request with expired cookie]"]
    B -->|✅| C["[Edge Middleware: verifyEdgeSessionToken]"]
    C -->|✅| D["[payload.exp < Date.now(): Returns null]"]
    D -->|✅| E["[Redirect to /login?redirect=pathname]"]
    B -->|✅| F["[API Request: getSession()]"]
    F -->|✅| G["[Returns null]"]
    G -->|✅| H["[API returns 401 Unauthorized]"]
    H -->|⚠️| I["[Client UserContext: handles 401 by clearing state]"]

    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style E fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style I fill:#faad14,stroke:#333,stroke-width:1px,color:#000
```

---

### ACCOUNT SUSPENSION FLOW
```mermaid
flowchart TD
    A["[Admin Freezes User: PATCH /api/admin/users/[id]/freeze]"] -->|✅| B["[prisma.user.update(isActive: false)]"]
    B -->|🔴| C["[Session Invalidation in Redis / Database]"]
    C -->|🔴| D["[Edge Middleware: checks isActive?]"]
    D -->|🔴| E["[NO: Middleware ONLY checks JWT signature & exp]"]
    E -->|🔴| F["[Suspended user continues browsing /dashboard & /farmer for up to 7 days]"]
    B -->|✅| G["[If user logs out, new login attempts are rejected (403)]"]

    style C fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style E fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style F fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
```

---

### AUTHORIZATION / RBAC FLOW
```mermaid
flowchart TD
    A["[Incoming Request to Protected Resource]"] -->|✅| B["[Extract Session: getSession()]"]
    B -->|✅| C["[Role Check: session.role]"]
    C -->|⚠️| D["[hasPermission(role, permission)]"]
    D -->|🔴| E["[EnterpriseRole Matrix has 8 roles; DB only has 3!]"]
    C -->|🔴| F["[Object Ownership Check]"]
    F -->|✅| G["[Orders Release Escrow: buyerId === session.userId]"]
    F -->|✅| H["[Farmer Produce Status: farmerProfile.userId === session.userId]"]
    F -->|🔴| I["[Orders Status Mutation (PUT /api/orders/[id]): ZERO OWNERSHIP CHECK]"]
    F -->|🔴| J["[Disputes Create (POST /api/disputes): ZERO ORDER OWNERSHIP CHECK]"]
    F -->|🔴| K["[Disputes View (GET /api/disputes): ZERO AUTHENTICATION]"]

    style E fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style I fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style J fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style K fill:#ff4d4f,stroke:#333,stroke-width:1px,color:#fff
    style D fill:#faad14,stroke:#333,stroke-width:1px,color:#000
    style A fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style B fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style C fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style G fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
    style H fill:#52c41a,stroke:#333,stroke-width:1px,color:#fff
```

---

## PART 1 — Full Authentication Architecture Map

The application implements a stateless JSON Web Token (JWT) architecture over HTTP-only cookies, combined with Next.js Edge Middleware for page route protection, and individual API route handlers for endpoint protection.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND PRESENTATION & AUTH UI                                    │
│    - Buyer/Farmer Signup: src/app/signup/page.tsx                     │
│    - Buyer/Farmer Signin: src/app/login/page.tsx                      │
│    - Administrator Signin: src/app/admin/login/page.tsx                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Form Submissions (JSON payload)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. CLIENT AUTH STATE & HYDRATION                                      │
│    - User Context Provider: src/context/UserContext.tsx                │
│    - Session Polling/Hydration: GET /api/auth/me                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Fetch Requests
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. API ROUTE HANDLERS (AUTHENTICATION CONTROLLERS)                     │
│    - POST /api/auth/register: src/app/api/auth/register/route.ts       │
│    - POST /api/auth/login: src/app/api/auth/login/route.ts             │
│    - POST /api/auth/logout: src/app/api/auth/logout/route.ts           │
│    - GET  /api/auth/me: src/app/api/auth/me/route.ts                   │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ Password verify/hash            │ JWT sign/cookie
                   ▼                                 ▼
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│ 4. CRYPTOGRAPHY & SECURITY       │ │ 5. SESSION & TOKEN ENGINE         │
│    - Bcrypt (10 rounds): register│ │    - Node Engine: src/lib/session │
│    - Web Crypto (HMAC-SHA256)    │ │    - Edge Engine: src/middleware  │
│    - Broken PBKDF2: user/password│ │    - Cookie: smarthub_session     │
└──────────────────┬───────────────┘ └─────────────────┬─────────────────┘
                   │ Prisma ORM queries                │ Reads Cookie
                   ▼                                   ▼
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│ 6. DATABASE LAYER                │ │ 7. ROUTE ENFORCEMENT & GUARDS     │
│    - Engine: prisma/schema.prisma│ │    - Edge: src/middleware.ts      │
│    - Client: src/lib/prisma.ts   │ │    - RBAC: src/lib/permissions.ts │
│    - Tables: User, BuyerProfile, │ │    - Matchers: /dashboard, /farmer│
│      FarmerProfile, AuditEvent   │ │      /admin (EXCLUDES /api/*)     │
└──────────────────────────────────┘ └───────────────────────────────────┘
```

---

## PART 2 — Forensic Audit: Buyer Signup Flow

### Step-by-Step Code Path Tracing
1. **Signup UI:** [`src/app/signup/page.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/signup/page.tsx#L64-L120)
2. **Submit Handler:** `handleSubmit` at lines 149–191.
3. **Endpoint:** `POST /api/auth/register` at [`src/app/api/auth/register/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/auth/register/route.ts#L7-L161).
4. **Database Write:** Atomic `prisma.$transaction` creating `User` and `BuyerProfile` records.
5. **Session Creation:** `setSessionCookie()` writing `smarthub_session`.
6. **Client Redirect:** `setUserFromAuth(data.user)` followed by `router.push('/dashboard')`.

### Detailed Audit Questions (1–30)
1. **Location:** `src/app/signup/page.tsx` (toggleable tab `tab === 'buyer'`).
2. **Fields collected:** `fullName`, `email`, `phone`, `password`, `confirmPassword`.
3. **Client-side validation:** `validateBuyer` checks: `fullName.length >= 2`, email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, phone regex `/^[0-9+\s\-()]{7,15}$/`, password `PW_RULES` (min 8 chars, 1 uppercase, 1 lowercase, 1 digit/symbol), and password confirmation match.
4. **Server-side validation:** `POST /api/auth/register` checks: non-empty `fullName`, non-empty `email`, non-empty `userPhone`, and `password.length >= 8`.
5. **Validation parity:** **NO.** Client enforces uppercase, lowercase, numbers, and symbols. Server only checks `password.length >= 8`. A direct API call can register with `password: "12345678"`.
6. **Email normalization:** `const normalizedEmail = email.toLowerCase().trim();` (Line 63).
7. **Duplicate email handling:** Handled explicitly via `prisma.user.findFirst` returning HTTP `409` (`"An account with this email address already exists"`).
8. **Duplicate account with same email:** Prevented by application logic and database `@unique` constraint on `email`.
9. **Password handling:** Received as plain text over HTTPS; hashed on line 100 before any database write.
10. **Hashing algorithm:** `bcrypt.hash(password, 10)` (Blowfish-based crypt with cost factor 10).
11. **Password storage/transmission:** Stored strictly as a bcrypt hash. Not stored in plain text. Transmitted over HTTPS.
12. **Database records created:** Two records in one atomic transaction:
    - `User` record (base credentials and role).
    - `BuyerProfile` record (`userId`, `address: null`, `state: null`, `lga: null`).
13. **Role assigned:** `Role.BUYER`.
14. **Account status assigned:** `isActive: true` (default in Prisma schema line 19).
15. **Email verification required:** **NO.** Not required, not checked, and no token is created.
16. **Verification token created:** **NO.**
17. **Session created immediately:** **YES.** Immediately logged in upon signup.
18. **Cookie/token created:** JWT signed with HMAC-SHA256 containing `{ userId, email, role, exp }`.
19. **Storage:** `smarthub_session` cookie stored in browser with flags: `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `sameSite: "lax"`, `path: "/"`, `maxAge: 7 days`.
20. **Post-signup execution:** Returns HTTP `201` with user JSON payload; client updates `UserContext` and triggers router push.
21. **Redirect target:** `/dashboard`.
22. **Dashboard recognition:** **YES.** The cookie is read by middleware, which allows entry into `/dashboard`.
23. **Unverified Buyer access:** **YES.** Unverified buyers have complete, unrestricted access to all buyer functionality.
24. **Failure halfway through:** Handled by `prisma.$transaction`. If profile creation fails, user creation rolls back.
25. **Transactional integrity:** **YES.** Enclosed in `prisma.$transaction(async (tx) => { ... })`.
26. **Duplicate related profiles:** Prevented by `@unique` constraint on `BuyerProfile.userId`.
27. **Error handling:** Returns JSON `{ error: string }`. Prisma P2002 errors are caught and converted to friendly HTTP 409 responses.
28. **Sensitive data in errors:** In non-production, `details: err?.message` is returned. In production, generic messages are returned.
29. **Rate limiting:** **NO.** There is no rate limit middleware or invocation on this endpoint.
30. **End-to-end functionality:** **YES.** End-to-end operational.

---

## PART 3 — Forensic Audit: Farmer Signup Flow

### Step-by-Step Code Path Tracing
1. **Signup UI:** [`src/app/signup/page.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/signup/page.tsx#L99-L137) (when `tab === 'farmer'`).
2. **Submit Handler:** Lines 192–230.
3. **Endpoint:** `POST /api/auth/register` with `role: "FARMER"`.
4. **Prisma Transaction:** Lines 114–123 creating `FarmerProfile` with `verificationStatus: PENDING`.
5. **Session & Redirect:** Sets `smarthub_session` cookie and redirects to `/farmer`.

### Forensic Findings: Authentication vs. Farmer Onboarding
* **Identity & Role:** Creates `User` with `role: "FARMER"` and `isActive: true`.
* **Profile & Status:** Creates `FarmerProfile` with `verificationStatus: PENDING`.
* **Separation of Concerns:** **PARTIALLY SEPARATED.** Basic account credentials and farm name/state are captured during registration. However, **Farmer identity verification (KYC document upload) is decoupled** and deferred to `/farmer/settings` or produce listing.
* **Failure Modes:**
  1. **Produce Listing Trust Check Conflict:** In [`src/app/api/farmer/produce/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/farmer/produce/route.ts#L63-L68), code says:
     `if (farmerProfile.verificationStatus !== "APPROVED") return 403`
     Yet lines 124–142 attempt a tiered trust policy check allowing Tier 1 unverified accounts up to 2 active listings. **Line 63 strictly blocks unverified farmers**, rendering the Tier 1 policy dead code.
  2. **Phone Number Conflict:** If a farmer registers with a phone number already used by a buyer, signup fails with a 409 error.

---

## PART 4 & 5 — Forensic Audit: Buyer vs. Farmer Login Flows

### Comparison Matrix
| Dimension | Buyer Login | Farmer Login | Architectural Assessment |
|---|---|---|---|
| **Login Page** | `/login` (Tab: "Buyer") | `/login` (Tab: "Farmer") | **Single Shared UI Component** (`src/app/login/page.tsx`) |
| **API Endpoint** | `POST /api/auth/login` | `POST /api/auth/login` | **Single Shared Route** (`src/app/api/auth/login/route.ts`) |
| **Credential Lookup** | `prisma.user.findUnique({ where: { email } })` | Identical | Identical |
| **Password Verification** | `bcrypt.compare(password, user.password)` | Identical | Identical |
| **Account Status Check** | `if (!user.isActive) return 403;` | Identical | Identical |
| **Cross-Portal Auth** | A Farmer entering credentials on "Buyer" tab is authenticated and redirected to `/farmer` | A Buyer entering credentials on "Farmer" tab is authenticated and redirected to `/dashboard` | **Role-agnostic authentication**. Tabs are purely visual cosmetic affordances. |
| **Session Payload** | `{ userId, email, role: "BUYER" }` | `{ userId, email, role: "FARMER" }` | Unified JWT payload |
| **Brute-Force Guard** | **NONE** | **NONE** | **Critical gap across all roles** |

### Key Findings
Buyer and Farmer authentication are **NOT two separate systems**; they share the exact same backend route, cookie, hashing, and database model. The tabs on `/login` are purely cosmetic UI wrappers that adjust client-side copy.

---

## PART 6 — Forensic Audit: Admin Authentication

### 1. Does an Admin login page exist? Where is it?
**YES.** Located at [`src/app/admin/login/page.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/admin/login/page.tsx).

### 2. Is there an Admin signup page?
**NO.** There is no Admin signup page.

### 3. How are Admin accounts created?
Admin accounts can **only** be created by:
- Direct database insertion via SQL / Prisma Studio.
- Database seed script [`prisma/seed.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/prisma/seed.ts#L13-L23) (`admin@smarthubagro.com`).

### 4. Can a normal user elevate themselves to Admin?
**NO.** Public registration in [`src/app/api/auth/register/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/auth/register/route.ts#L66-L67) explicitly sanitizes the requested role:
```ts
const targetRole = requestedRole === "FARMER" ? "FARMER" : "BUYER";
```
Sending `role: "ADMIN"` or `role: "SUPER_ADMIN"` automatically defaults to `BUYER`.

### 5. Critical Vulnerability in Admin Login UI:
In [`src/app/admin/login/page.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/admin/login/page.tsx#L40-L62):
```ts
const response = await fetch("/api/auth/login", { ... });
const data = await response.json();

if (!response.ok) { ... }

// VULNERABILITY: Cookie has ALREADY been written by /api/auth/login!
if (data.user?.role?.toUpperCase() !== "ADMIN") {
  setError("Unauthorized access. Admin privileges required.");
  return;
}
```
* **The Flaw:** `/api/auth/login` validates credentials and sets the HTTP-only `smarthub_session` cookie **before** the client checks the role. 
* **The Impact:** If a Buyer or Farmer submits credentials at `/admin/login`, the UI displays an error, but the user is **already logged into the application**. Navigating to `/dashboard` immediately shows them authenticated.
* **MFA / 2FA:** **COMPLETELY MISSING**. No multi-factor authentication exists for administrators.
* **Re-authentication:** **MISSING**. No re-authentication is required for high-risk operations (freezing accounts, releasing escrow, approving KYC).

---

## PART 7 — Forensic Audit: Session Architecture

| Question | Code Reality | Exact Code Reference |
|---|---|---|
| **1. Session Type** | Stateless JSON Web Token (JWT) | [`src/lib/session.ts:28-42`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/lib/session.ts#L28-L42) |
| **2. Storage Location** | Browser Cookie | `src/lib/session.ts:78` |
| **3. Cookie Name** | `smarthub_session` | `src/lib/session.ts:4` |
| **4. HttpOnly?** | **YES** (`httpOnly: true`) | `src/lib/session.ts:79` |
| **5. Secure flag?** | **CONDITIONAL** (`secure: process.env.NODE_ENV === "production"`) | `src/lib/session.ts:80` |
| **6. SameSite?** | `"lax"` | `src/lib/session.ts:81` |
| **7. Path?** | `"/"` | `src/lib/session.ts:82` |
| **8. Expiration** | 7 days (`7 * 24 * 60 * 60` seconds) | `src/lib/session.ts:83` |
| **9. Idle Timeout?** | **NO.** Pure static timestamp expiration. | N/A |
| **10. Absolute Timeout?** | 7 days from token issuance. | `src/lib/session.ts:30` |
| **11. Session Rotation?** | **NO.** Token is signed once at login and remains static. | N/A |
| **12. Database Session Table?** | **NO.** Zero session records stored in database. | [`prisma/schema.prisma`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/prisma/schema.prisma) |
| **13. Multi-Device Sessions?** | Allowed (any device with valid JWT is accepted). | N/A |
| **14. Server-Side Session Revocation?** | **IMPOSSIBLE.** No token blacklist or DB tracking exists. | N/A |
| **15. Logout Behavior** | Sets `maxAge: 0` on cookie; token remains valid if copied. | [`src/app/api/auth/logout/route.ts:6`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/auth/logout/route.ts#L6) |
| **16. Post-Suspension Invalidation?** | **FAILS.** Suspended users retain access until token expires. | [`src/middleware.ts:98`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts#L98) |

---

## PART 8 — Current Authenticated User Resolution

### How the Application Answers: *"Who is currently logged in?"*

There are **three conflicting sources of truth**:

1. **At the Edge (Middleware):**
   - Calls `verifyEdgeSessionToken(token)` using Web Crypto SubtleCrypto.
   - **Source of truth:** The unencrypted JWT payload (`userId`, `email`, `role`).
   - **Flaw:** Does **not** check the database. If a user was deleted or suspended 1 second ago, the middleware still treats them as valid.

2. **In Server API Routes:**
   - Calls `getSession()` from `src/lib/session.ts`.
   - **Source of truth:** The JWT payload.
   - **Flaw:** Some routes (e.g., [`src/app/api/user/password/route.ts:17`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/user/password/route.ts#L17)) bypass `getSession()` completely and read an unverified cookie `cookieStore.get("userId")?.value || "usr_demo_buyer"`.

3. **In React Client Components:**
   - Handled by [`src/context/UserContext.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/context/UserContext.tsx#L30-L54).
   - On mount, calls `GET /api/auth/me`.
   - `GET /api/auth/me` verifies JWT and then performs a live `prisma.user.findUnique({ where: { id: session.userId } })`.
   - **Flaw:** If network is slow or `GET /api/auth/me` fails, client context resets to `user = null`, causing visual flashing or layout jumps.

---

## PART 9 — Route & Middleware Protection Matrix

| Route Pattern | Public | Buyer | Farmer | Admin | Enforcement Mechanism |
|---|:---:|:---:|:---:|:---:|---|
| `/` (Landing Page) | ✅ | ✅ | ✅ | ✅ | None (Public) |
| `/products` | ✅ | ✅ | ✅ | ✅ | None (Static data showcase) |
| `/login` | ✅ | ✅ | ✅ | ✅ | Public |
| `/signup` | ✅ | ✅ | ✅ | ✅ | Public |
| `/admin/login` | ✅ | ✅ | ✅ | ✅ | Public |
| `/dashboard/:path*` | ❌ | ✅ | ❌ | ❌ | [`src/middleware.ts:115-119`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts#L115-L119) (Redirects Farmers to `/farmer`, Admins to `/admin/overview`) |
| `/farmer/:path*` | ❌ | ❌ | ✅ | ❌ | [`src/middleware.ts:109-113`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts#L109-L113) (Redirects Buyers to `/dashboard`, Admins to `/admin/overview`) |
| `/admin/:path*` | ❌ | ❌ | ❌ | ✅ | [`src/middleware.ts:121-125`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts#L121-L125) (Redirects non-admins to their respective portal) |
| **`/api/*` (ALL APIs)** | 🔴 | 🔴 | 🔴 | 🔴 | **EXCLUDED FROM MIDDLEWARE!** Enforced strictly on a per-route basis. Several routes have zero checks. |

---

## PART 10 — Dashboard Entry & Loading State Audit

1. **Redirect Timing:** After login, `router.push('/dashboard')` or `router.push('/farmer')` is called.
2. **Flash of Unauthenticated State (FOUC):** In client layouts, `UserContext.loading` defaults to `true`. While `loading` is true, dashboards display a loading spinner before rendering content, preventing sensitive data leakage on the client.
3. **Session Loss During Active Session:** If the cookie expires while a user is on the dashboard, subsequent API calls return HTTP 401. However, client-side pages do not automatically redirect to `/login` until the user refreshes or triggers an action that checks the response status.

---

## PART 11 — Authorization & RBAC Audit

### Database Roles vs. Application Roles Discrepancy
* **Database Enum ([`prisma/schema.prisma:250`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/prisma/schema.prisma#L250)):**
  ```prisma
  enum Role {
    ADMIN
    FARMER
    BUYER
  }
  ```
* **Permissions File ([`src/lib/permissions.ts:1-9`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/lib/permissions.ts#L1-L9)):**
  ```ts
  export type EnterpriseRole =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "COMPLIANCE_OFFICER"
    | "FINANCE_OFFICER"
    | "SUPPORT_AGENT"
    | "LOGISTICS_MANAGER"
    | "BUYER"
    | "FARMER";
  ```
* **Forensic Reality:** 5 of the 8 enterprise roles (`SUPER_ADMIN`, `COMPLIANCE_OFFICER`, `FINANCE_OFFICER`, `SUPPORT_AGENT`, `LOGISTICS_MANAGER`) **cannot be saved in the database**. Any attempt to assign them will crash Prisma with an invalid enum value error.

---

## PART 12 — Critical Resource Ownership & IDOR / BOLA Audit

| Route | Method | Vulnerability | Severity | Code Reality |
|---|:---:|---|:---:|---|
| **`/api/orders/[id]`** | `PUT` | **BOLA / IDOR** | 🔴 **P0** | Accepts any status update (`COMPLETED`, `CANCELLED`). Checks authentication but **ZERO ownership or role checks**. Any buyer can cancel or complete any other buyer's order. |
| **`/api/disputes`** | `POST` | **IDOR / Financial Freezing** | 🔴 **P0** | Takes `orderId` and creates dispute. **Does not verify that `session.userId` is the buyer or farmer of that order**. Any user can dispute any order and freeze payment status. |
| **`/api/disputes`** | `GET` | **Mass Public Data Exposure** | 🔴 **P0** | **ZERO authentication required**. Dumps all disputes with buyer names, buyer emails, and order IDs to anyone who calls `GET /api/disputes`. |
| **`/api/user/password`** | `POST` | **Account Takeover / Auth Bypass** | 🔴 **P0** | Reads unauthenticated cookie `userId` with fallback `"usr_demo_buyer"`. Uses broken `pbkdf2Sync` with static salt `"agrosalt"`. |
| **`/api/user/profile`** | `PATCH` | **Arbitrary Email Mutation** | 🔴 **P1** | Allows changing `email` with zero verification, zero password confirmation, and zero notification to old email. |

---

## PART 13 — Email Verification Audit

* **Verification page:** ❌ **MISSING** (Does not exist).
* **Token generation / storage:** ❌ **MISSING** (No database model or token generation utility).
* **Account status gating:** ❌ **MISSING** (Newly registered users have `isActive: true` and immediate full platform access).

---

## PART 14 & 15 — Password Recovery & Password Change Audit

### Password Recovery (Forgot / Reset)
* **Status:** ❌ **MISSING**
* No `/forgot-password` page.
* No `/reset-password` page.
* No reset token model in schema.
* No recovery endpoint in `/api/auth/*`.

### Password Change ([`src/app/api/user/password/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/user/password/route.ts))
* **Status:** 🔴 **BROKEN & VULNERABLE**
* **Incompatible Hashing:** Hashes with `crypto.pbkdf2Sync(password, "agrosalt", 1000, 64, "sha512")`. Because login expects bcrypt, **any user who changes their password can never log in again**.
* **Identity Spoofing:** Reads `cookieStore.get("userId")?.value || "usr_demo_buyer"`. Does not inspect JWT session.
* **Plaintext comparison fallback:** Line 40 checks `user.password === currentPassword` (permits plaintext passwords).

---

## PART 16 — Email Change Audit

* **Status:** 🔴 **VULNERABLE**
* Located in `PATCH /api/user/profile` lines 94–100.
* Allows updating email by passing `{ "email": "new@domain.com" }`.
* Requires no password confirmation, no verification of new address, and no notification to original address.
* Session JWT retains old email until user logs out and logs in again.

---

## PART 17 — Account Lifecycle & Status

* **Available statuses in schema:** Exactly one boolean field: `User.isActive` (`true` or `false`).
* **Admin suspension:** [`src/app/api/admin/users/[id]/freeze/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/admin/users/%5Bid%5D/freeze/route.ts) toggles `isActive`.
* **Enforcement gap:** When `isActive` is set to `false`, **existing JWT sessions remain valid**. Middleware does not query database `isActive`, allowing suspended users continued access to dashboards until cookie expiration (up to 7 days).

---

## PART 18 — Logout Audit

* **UI implementation:** Present in sidebar navigation across all portals.
* **Backend implementation:** [`POST /api/auth/logout`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/auth/logout/route.ts) calls `clearSessionCookie()`.
* **Revocation:** **NONE.** Stateless JWT is not blacklisted. A copied token continues to authenticate against all APIs until expiration.

---

## PART 19 — Auth Error States Inventory

| State | UI Handled? | Toast / Banner? | Technical Accuracy |
|---|:---:|:---:|---|
| **Invalid Credentials** | ✅ | ✅ Red Banner | Returns HTTP 401 `"Invalid email or password"` |
| **Account Deactivated** | ✅ | ✅ Red Banner | Returns HTTP 403 `"Your account has been deactivated..."` |
| **Duplicate Email/Phone** | ✅ | ✅ Red Banner | Returns HTTP 409 `"An account with this email/phone already exists"` |
| **Unverified Email** | ❌ | ❌ | State does not exist in application |
| **Expired Reset Token** | ❌ | ❌ | Password reset does not exist in application |
| **Server Exception** | ✅ | ✅ Red Banner | Returns HTTP 500 `"An unexpected server error occurred..."` |
| **Unauthorized API Access** | ⚠️ | Partial | Handled if component catches error; otherwise silent fail |

---

## PART 20 — Ranked Critical Vulnerabilities

### 🔴 P0 — Critical Vulnerabilities (Must Fix Immediately)

1. **Unauthenticated Public Data Leakage in Disputes API**
   * **Location:** [`src/app/api/disputes/route.ts:57-80`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/disputes/route.ts#L57-L80)
   * **Vulnerability:** `GET /api/disputes` has no authentication check.
   * **Impact:** Public harvest of buyer names, emails, order amounts, and dispute logs.

2. **Broken Object Level Authorization (BOLA/IDOR) in Order Mutation**
   * **Location:** [`src/app/api/orders/[id]/route.ts:305-345`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/orders/%5Bid%5D/route.ts#L305-L345)
   * **Vulnerability:** `PUT /api/orders/[id]` checks authentication but not resource ownership.
   * **Impact:** Any authenticated user can cancel any order, trigger automated refunds, or mark orders as completed.

3. **Incompatible & Insecure Password Update Implementation**
   * **Location:** [`src/app/api/user/password/route.ts:8-52`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/user/password/route.ts#L8-L52)
   * **Vulnerability:** PBKDF2 with static salt `"agrosalt"`, fallback `"usr_demo_buyer"`, and plaintext password comparison.
   * **Impact:** Account lockout upon password update; arbitrary user password overwrite.

4. **Zero Rate Limiting on Authentication Endpoints**
   * **Location:** [`src/app/api/auth/login/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/auth/login/route.ts) & [`src/app/api/auth/register/route.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/auth/register/route.ts)
   * **Vulnerability:** `checkRateLimit` is never invoked.
   * **Impact:** High-speed dictionary attacks and credential stuffing against user accounts.

### 🟠 P1 — High Vulnerabilities

5. **Middleware API Exclusion**
   * **Location:** [`src/middleware.ts:130-136`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts#L130-L136)
   * **Vulnerability:** Middleware matcher ignores `/api/*`.
   * **Impact:** Any newly created API route that forgets manual session checks is open to the public.

6. **Suspended Account Session Persistence**
   * **Location:** [`src/middleware.ts:98`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/middleware.ts#L98)
   * **Vulnerability:** Middleware does not verify database `isActive`.
   * **Impact:** Suspended malicious actors maintain portal access until token expiration.

7. **Arbitrary Unverified Email Mutation**
   * **Location:** [`src/app/api/user/profile/route.ts:97`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/app/api/user/profile/route.ts#L97)
   * **Vulnerability:** Email can be updated via PATCH with zero verification or password confirmation.

---

## PART 21 — Database Schema Inventory & Weaknesses

### Auth-Related Schema Extract (`prisma/schema.prisma`):
```prisma
model User {
  id                    String         @id @default(cuid())
  fullName              String
  email                 String         @unique
  phoneNumber           String         @unique
  password              String
  profileImage          String?
  role                  Role           @default(BUYER)
  isActive              Boolean        @default(true)
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  buyerProfile          BuyerProfile?
  farmerProfile         FarmerProfile?
  wallet                Wallet?
  ...
}

enum Role {
  ADMIN
  FARMER
  BUYER
}
```

### Schema Omissions:
1. No `emailVerified: Boolean` or `emailVerifiedAt: DateTime?`.
2. No `VerificationToken` or `PasswordResetToken` models.
3. No `Session` model for tracking active devices or revoking access.
4. No `failedAttempts: Int` or `lockedUntil: DateTime?` on `User`.
5. No `lastLoginAt: DateTime?` or `lastLoginIp: String?`.

---

## PART 22 — API Protection Matrix

| Method | Endpoint | Purpose | Auth Required | Role Required | Ownership Check | Rate Limit |
|---|---|---|:---:|:---:|:---:|:---:|
| `POST` | `/api/auth/register` | User signup | ❌ | None | N/A | ❌ None |
| `POST` | `/api/auth/login` | User login | ❌ | None | N/A | ❌ None |
| `POST` | `/api/auth/logout` | Session logout | ❌ | None | N/A | ❌ None |
| `GET` | `/api/auth/me` | Fetch active session | ✅ | Any | Self | ❌ None |
| `GET` | `/api/user/profile` | View profile | ✅ | Any | Self | ❌ None |
| `PATCH`| `/api/user/profile` | Update profile/email | ✅ | Any | Self | ❌ None |
| `POST` | `/api/user/password`| Change password | 🔴 Broken | None | 🔴 Fallback | ❌ None |
| `GET` | `/api/orders/[id]` | View order details | ✅ | Any | ✅ Buyer/Farmer | ❌ None |
| `PUT` | `/api/orders/[id]` | Mutate order status | ✅ | Any | 🔴 **MISSING** | ❌ None |
| `POST` | `/api/orders/[id]/release-escrow` | Release payment | ✅ | Buyer/Admin | ✅ Verified | ❌ None |
| `GET` | `/api/disputes` | List disputes | 🔴 **NONE** | None | 🔴 **MISSING** | ❌ None |
| `POST` | `/api/disputes` | Create dispute | ✅ | Any | 🔴 **MISSING** | ❌ None |
| `GET` | `/api/admin/users` | List all users | ✅ | Admin | N/A | ❌ None |
| `PATCH`| `/api/admin/users` | Suspend user | ✅ | Admin | N/A | ❌ None |

---

## PART 23 — Client Auth State & Hydration

* **Context Provider:** [`src/context/UserContext.tsx`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/context/UserContext.tsx)
* **Hydration Mechanism:** `useEffect` fires `fetchSession()` which calls `GET /api/auth/me`.
* **State synchronization:** Fast client-side updates via `setUserFromAuth()` called immediately after login/register.
* **Risk:** If a user logs out in Tab A, Tab B remains unaware until an API call triggers a 401 error or the user reloads the page.

---

## PART 24 — Admin Privileged Operations Audit

| Operation | Route | Role Gated? | Re-Auth Required? | Audited? |
|---|---|:---:|:---:|:---:|
| **List Users** | `GET /api/admin/users` | ✅ (`ADMIN`) | ❌ No | ❌ No |
| **Suspend User** | `PATCH /api/admin/users` | ✅ (`ADMIN`) | ❌ No | ✅ (`recordAuditEvent`) |
| **Freeze User** | `PATCH /api/admin/users/[id]/freeze` | ✅ (`ADMIN`) | ❌ No | ❌ No |
| **Approve KYC** | `POST /api/admin/verifications/[id]` | ✅ (`ADMIN`) | ❌ No | ✅ (`recordAuditEvent`) |
| **Approve Produce** | `PATCH /api/admin/products/[id]/approve` | ✅ (`ADMIN`) | ❌ No | ❌ No |
| **Export Ledger** | `GET /api/admin/ledger/export` | ✅ (`ADMIN`) | ❌ No | ❌ No |

---

## PART 25 — Security Audit Logging

* **Logger File:** [`src/lib/audit.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/src/lib/audit.ts) writes to database table `AuditEvent`.
* **What is logged:** User freeze/suspension, KYC verification, delivery confirmation, escrow release, order dispute.
* **What is NOT logged:**
  - ❌ Login attempts (Success & Failure)
  - ❌ User registration
  - ❌ User logout
  - ❌ Password changes
  - ❌ Email updates
  - ❌ Admin logins
* **Integrity:** `AuditEvent` has no update or delete endpoints; ordinary users cannot tamper with audit logs.

---

## PART 26 — Test Suite Coverage Audit

* **Existing Tests in Codebase:**
  - [`__tests__/security-hardening.test.ts`](file:///home/exploitx/Documents/MAAJO/smarthub-agronexus/__tests__/security-hardening.test.ts): Tests pure unit functions for JWT fail-closed behavior (`SEC-001`) and role resolution (`SEC-003`).
* **Missing Tests:**
  - ❌ Zero integration tests for `POST /api/auth/register`.
  - ❌ Zero integration tests for `POST /api/auth/login`.
  - ❌ Zero tests for middleware redirects across roles.
  - ❌ Zero tests for BOLA/IDOR protection on orders.
  - ❌ Zero tests for brute force rate limiting.

---

## PART 27 — End-to-End Flow Verification

* **Buyer Registration & Login:** Verified functional against live Supabase PostgreSQL. Creates user, hashes password with bcrypt, signs JWT, sets `smarthub_session`, and redirects to `/dashboard`.
* **Farmer Registration & Login:** Verified functional. Sets up `FarmerProfile` with status `PENDING` and redirects to `/farmer`.
* **Admin Login:** Verified functional for authorized admins, but flawed client-side role check allows non-admin cookie establishment.
* **Dispute Endpoints:** Verified unauthenticated data leak on `GET /api/disputes`.
* **Password Change:** Verified broken due to PBKDF2 vs. bcrypt incompatibility.

---

## PART 28 — Final Verdict & Roadmap

### Direct Answers to Key Questions:

1. **What is working?**
   - Public registration (Buyer & Farmer) with transactional profile creation.
   - Core login authentication via bcrypt and HMAC-SHA256 JWT cookies.
   - Portal route isolation via Edge Middleware (`/dashboard`, `/farmer`, `/admin`).

2. **What is incomplete?**
   - Farmer onboarding and KYC verification gating.
   - Client-side role handling on `/admin/login`.
   - Audit logging for authentication lifecycle events.

3. **What is insecure?**
   - `PUT /api/orders/[id]` (BOLA/IDOR vulnerability allowing arbitrary order mutation).
   - `GET /api/disputes` (Unauthenticated public data exposure).
   - `POST /api/user/password` (Broken PBKDF2 hash, static salt, unverified identity cookie).
   - Complete lack of rate limiting on login and registration.

4. **What is missing?**
   - Email verification system.
   - Password reset / forgot password mechanism.
   - Server-side session revocation / token blacklist.
   - Admin Multi-Factor Authentication (MFA).

5. **Is Buyer authentication production-ready?**
   **NO.** Lack of email verification, zero rate limiting, and broken password recovery prevent production readiness.

6. **Is Farmer authentication production-ready?**
   **NO.** Requires proper onboarding verification gates and security parity with Buyer.

7. **Is Admin authentication production-ready?**
   **NO.** Lacks MFA, has client-side role verification flaws, and lacks re-authentication for sensitive actions.

8. **Is the complete authentication/authorization system production-ready?**
   **NO.** Critical vulnerabilities (P0) and missing recovery flows must be remediated prior to production launch.

---

### Recommended Implementation Roadmap

#### Phase 1: Critical Security & Vulnerability Fixes (Immediate)
1. **Fix `src/app/api/user/password/route.ts`**: Replace PBKDF2 with bcrypt, verify `getSession()`, and remove plaintext comparisons.
2. **Patch BOLA/IDOR on `PUT /api/orders/[id]`**: Restrict status transitions to order owners or authorized logistics/admin roles.
3. **Lock Down `/api/disputes`**: Add `getSession()` requirement to `GET /api/disputes` and check order ownership on `POST`.
4. **Activate Rate Limiting**: Wire `checkRateLimit` into `/api/auth/login` and `/api/auth/register`.
5. **Fix `/admin/login`**: Validate admin role server-side in `/api/auth/login` before setting session cookie.

#### Phase 2: Core Missing Authentication Features
1. **Password Recovery Flow**: Implement `PasswordResetToken` table, `/forgot-password`, `/reset-password`, and email dispatch.
2. **Email Verification Flow**: Add `emailVerified` boolean to `User`, generate single-use verification tokens, and enforce verification before placing orders.

#### Phase 3: Session Security & Hardening
1. **Session Revocation**: Implement token versioning or a database session store to allow immediate revocation on logout, password change, or admin suspension.
2. **Middleware DB Sync**: Ensure suspended users (`isActive: false`) are rejected at the edge.

#### Phase 4: Enterprise RBAC & Admin MFA
1. **Align Database Roles**: Align Prisma schema `Role` enum with `EnterpriseRole` in `permissions.ts`.
2. **Admin MFA**: Add TOTP (Google Authenticator) challenge to `/admin/login`.