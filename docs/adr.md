# SmartHub AgroChain — Architecture Decision Records (ADRs)

Documenting the architectural evolution, design patterns, and operational rules governing the SmartHub AgroChain platform.

---

## ADR 001: Single Page DTO Architecture ("One Page, One API, One DTO")

* **Status:** Accepted & Enforced
* **Context:** Prototype UI pages previously issued multiple client-side API queries, resulting in request waterfalls, scattered business calculations on the browser, and race conditions.
* **Decision:** Every page or view in the application consumes exactly one backend-hydrated DTO (e.g., `DashboardDTO`, `WalletSummaryDTO`, `MarketplaceDTO`, `VerificationDTO`, `FulfillmentDTO`, `SettlementDTO`, `NotificationPageDTO`).
* **Consequences:** Eliminates client-side business logic, drastically reduces roundtrips, establishes stable contracts between frontend and backend, and guarantees single-query page hydration.

---

## ADR 002: Server-Side Domain Services Layer (`src/services/`)

* **Status:** Accepted & Enforced
* **Context:** As API endpoints grew, Next.js route handlers were accumulating database queries, authorization checks, transaction orchestration, and notification logic into unwieldy controllers.
* **Decision:** Introduce a dedicated Domain Service Layer (`auth.service.ts`, `trust.service.ts`, `fulfillment.service.ts`, `payment.service.ts`, `notification.service.ts`). API route handlers act strictly as thin HTTP controllers responsible for request parsing, session checks, calling service methods, and returning DTOs.
* **Consequences:** Clean separation of concerns, reusable domain logic across REST and CLI/Cron scripts, simplified unit testing, and maintainable API controllers.

---

## ADR 003: Centralized Trust Engine (`src/lib/trust.ts`)

* **Status:** Accepted & Enforced
* **Context:** Verification statuses, daily withdrawal limits, and listing capabilities were previously hardcoded or checked directly against raw Prisma enums in UI components.
* **Decision:** Establish `src/lib/trust.ts` as the single source of truth for platform identity verification policies (`evaluateTrustPolicy`). Domain capability flags (`canPublishProducts`, `canWithdraw`, `dailyWithdrawalLimit`) are computed server-side.
* **Consequences:** Prevents client-side privilege escalation, centralizes tier policy constants for future admin configuration, and unifies trust badges across marketplace and farmer dashboards.

---

## ADR 004: Fulfillment State Machine Engine (`src/lib/fulfillment.ts`)

* **Status:** Accepted & Enforced
* **Context:** Order fulfillment status transitions required rigid lifecycle enforcement (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY_FOR_PICKUP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED` $\rightarrow$ `COMPLETED`).
* **Decision:** Build a server-side state machine engine in `src/lib/fulfillment.ts` that enforces allowed transitions, computes available actions by user role, and conditions escrow releases on explicit buyer delivery confirmation.
* **Consequences:** Prevents invalid state transitions, protects escrow funds, and standardizes tracking timelines across all delivery workflows.

---

## ADR 005: Settlement Engine & Idempotent Financial Protection (`src/lib/settlement.ts`)

* **Status:** Accepted & Enforced
* **Context:** Financial transactions, platform fees, taxes, and webhook callbacks require guaranteed idempotency and auditability to prevent double-spending or duplicate escrow releases.
* **Decision:** Implement `src/lib/settlement.ts` and `src/services/payment.service.ts` to execute platform fee calculations, tax splits, receipt generation, and transaction idempotency validation.
* **Consequences:** Protects payment webhooks against duplicate delivery, guarantees transaction auditability, and prepares the system for future double-entry ledger integration.

---

## ADR 006: Event-Driven Communication Domain (`src/lib/events.ts`)

* **Status:** Accepted & Enforced
* **Context:** Domain services previously called notification methods directly, coupling business transaction logic with communication and email/SMS side-effects.
* **Decision:** Introduce an Event Bus infrastructure in `src/lib/events.ts`. Domain operations emit strongly-typed business events (`publishAgroEvent`). Notification, Audit Log, and Email dispatchers operate as decoupled subscribers.
* **Consequences:** Decouples core business transactions from communication side-effects, enables multi-channel notification dispatch (In-App, Email, SMS), and builds an extensible event backbone for future real-time and analytics modules.

---

## ADR 007: Repository Layer & Platform Operations (`src/repositories/`, `src/jobs/`)

* **Status:** Accepted & Enforced
* **Context:** Domain services directly executing ORM database calls made query optimization and persistence swapping difficult while lack of background workers increased HTTP request latency.
* **Decision:** Introduce a Data Repository Layer (`UserRepository`, `OrderRepository`, `ProductRepository`, `PaymentRepository`) between Domain Services and Prisma ORM. Centralize background tasks (`src/jobs/`), system health monitoring (`/api/health`), and platform config flags (`src/lib/config.ts`).
* **Consequences:** Swappable persistence layer, improved query performance and index alignment, background job processing off HTTP request threads, and production health monitoring.

---

## ADR 008: Dependency Inversion via Repository Interfaces & CI/CD Pipeline

* **Status:** Accepted & Enforced
* **Context:** Enterprise scaling requires strict dependency inversion between domain services and database access implementations to support contract mocking and automated testing pipelines.
* **Decision:** Define TypeScript Repository Interfaces (`IUserRepository`, `IOrderRepository`, `IPaymentRepository`) in `src/repositories/interfaces/`, implemented by Prisma repositories in `src/repositories/implementations/`. Integrate automated CI/CD workflows (`.github/workflows/ci.yml`) and domain test suites.
* **Consequences:** Complete dependency inversion, zero-friction mocking for unit tests, automated CI/CD validation on git push, and enterprise production readiness.

---

## ADR 009: Enterprise Developer Platform (DevEx) & Prometheus Telemetry

* **Status:** Accepted & Enforced
* **Context:** Scaling multi-developer platforms requires unified error hierarchies, standardized API envelopes (`{ success, data, meta, error }`), dependency injection containers, and Prometheus telemetry metrics.
* **Decision:** Implement domain error hierarchy (`src/lib/errors.ts`), standardized API envelope wrapper (`src/lib/api-response.ts`), dependency injection container (`src/container/`), CQRS-Lite services, and Prometheus metrics endpoint (`/api/metrics`).
* **Consequences:** Eliminates inconsistent API error formats, enforces strict request contract validation, simplifies developer onboarding, and provides telemetry metrics for Grafana/Prometheus scraping.

---

## ADR 010: Distributed Tracing & Security Hardening (`src/lib/tracing.ts`, `src/lib/security.ts`)

* **Status:** Accepted & Enforced
* **Context:** Distributed requests require end-to-end trace correlation (`traceId`, `spanId`) and production security headers (CSP, HSTS, X-Frame-Options) to protect financial data and identity documents.
* **Decision:** Implement distributed tracing middleware (`src/lib/tracing.ts`) returning `x-trace-id` headers, rate-limiting (`src/lib/rate-limit.ts`), and security headers wrapper (`src/lib/security.ts`).
* **Consequences:** Guarantees end-to-end request observability, protects sensitive authentication & webhook endpoints against brute-force attacks, and aligns with OWASP Top 10 guidelines.

---

## ADR 011: Phase 4 Enterprise Operations, OpenAPI 3.0 & Containerization (`docs/openapi.yaml`, `Dockerfile`)

* **Status:** Accepted & Enforced
* **Context:** Transitioning to Phase 4 (Production Operations) requires formal OpenAPI 3.0 API specifications, multi-stage Docker containerization, multi-service Docker Compose orchestration, and integration test suites.
* **Decision:** Formulate OpenAPI 3.0 specification (`docs/openapi.yaml`), multi-stage production Dockerfile (`Dockerfile`), Docker Compose setup (`docker-compose.yml`), and integration test suites (`__tests__/integration/`).
* **Consequences:** Provides standardized API documentation for client SDK generation, guarantees reproducible containerized deployments, and establishes Phase 4 operational readiness.
