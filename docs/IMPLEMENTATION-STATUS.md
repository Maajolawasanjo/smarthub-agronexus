# SmartHub AgroChain — Implementation Status Baseline

*Last updated: Baseline Hardening Initiation*

## Status Legend
- `VERIFIED`: Complete end-to-end (UI → API → Auth → Service → DB → External Provider → E2E Test).
- `IMPLEMENTED`: Backend & DB complete, pending live external staging verification.
- `PARTIAL`: Real backend exists, but contains prototype fallbacks or unhandled edge cases.
- `UI_ONLY`: Interface exists with mock/local state, missing backend wiring.
- `MOCKED`: Service or transport uses fake responses or in-memory arrays.
- `BROKEN`: Defects prevent complete execution chain.
- `MISSING`: Capability not yet implemented in code.

---

## System Component Status Baseline

| Module | Subsystem | Baseline Status | Notes / Blockers |
|---|---|---|---|
| **Auth & Identity** | JWT Session & Cookies | `PARTIAL` | SEC-001: JWT fallback secret present. |
| **Auth & Identity** | Registration & Roles | `PARTIAL` | SEC-003: Public registration accepts self-assigned `role`. |
| **Auth & Identity** | Login API | `PARTIAL` | SEC-002: Hardcoded test credentials in `/api/auth/login`. |
| **Marketplace** | Product Catalog | `PARTIAL` | Real DB queries exist, but farmer verification filter missing. |
| **Marketplace** | Inventory Reservation | `PARTIAL` | Lacks transactional locking under concurrent purchases. |
| **Orders** | State Machine | `IMPLEMENTED` | Order creation works, needs domain state transition centralizer. |
| **Wallet & Escrow** | Ledger Calculations | `IMPLEMENTED` | Single source of truth DTO, tested & passing. |
| **Wallet & Escrow** | Escrow Lock & Release | `IMPLEMENTED` | Transactional balance updates complete. |
| **Payments** | Flutterwave Checkout | `PARTIAL` | API integration real; needs direct order linkage. |
| **Payments** | Webhook Security | `BROKEN` | PAY-001: Webhook signature check uses length test. |
| **Logistics** | POD Evidence | `PARTIAL` | Endpoint works, but evidence package not persisted in DB. |
| **Notifications** | Email & SMS Transport | `MOCKED` | MOCK adapters log to console; outbox is in-memory array. |
| **Admin Portal** | Users & Management | `UI_ONLY` | Admin UI uses hardcoded `initialUsers` array for actions. |
| **Admin Portal** | Audit Logging | `UI_ONLY` | `/api/admin/audit-logs` synthesizes logs dynamically. |
