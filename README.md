# 🌾 Smarthub Agrochain (AgroNexus)

> **Enterprise-Grade B2B Agricultural Export & Sourcing Marketplace**
> 
> *Architected for high-concurrency agricultural commodity trading, automated escrow verification, multi-tenant farmer onboarding, real-time shipment telemetry, and cross-border settlement across sub-Saharan Africa.*

[![Next.js](https://img.shields.io/badge/Next.js-16.x_(App_Router)-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)

---

## 📋 Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Core Domain & Business Capabilities](#2-core-domain--business-capabilities)
3. [Technology Stack & System Topology](#3-technology-stack--system-topology)
4. [Database Schema & Entity-Relationship Architecture](#4-database-schema--entity-relationship-architecture)
5. [API Specification & Data Flow Pipelines](#5-api-specification--data-flow-pipelines)
6. [Security, Session Management & RBAC](#6-security-session-management--rbac)
7. [Installation & Operational Guide](#7-installation--operational-guide)
8. [Directory Structure](#8-directory-structure)
9. [Financial Ledger & Escrow Settlement Engine](#9-financial-ledger--escrow-settlement-engine)
10. [Automated Quality Control & Trust Policies](#10-automated-quality-control--trust-policies)
11. [Testing & Quality Assurance](#11-testing--quality-assurance)
12. [Deployment & Infrastructure Topology](#12-deployment--infrastructure-topology)
13. [Maintainers & Licensing](#13-maintainers--licensing)

---

## 1. Architectural Overview

**Smarthub Agrochain** (AgroNexus) is a production-grade, distributed B2B platform designed to eliminate friction, opaque intermediary pricing, and quality risk in international agricultural exports. Built upon Next.js 16 App Router, PostgreSQL, Prisma ORM, and modern event-driven design patterns, the system bridges the gap between rural smallholder farmers, licensed logistics aggregators, quality control laboratories, and institutional global commodity buyers.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 PRESENTATION LAYER                               │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │    Public Showroom    │  │    Farmer Dashboard   │  │   Admin Control HQ   │  │
│  │     (/products)       │  │       (/farmer)       │  │       (/admin)       │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────────┬───────────┘  │
└──────────────┼──────────────────────────┼─────────────────────────┼──────────────┘
               │                          │                         │
┌──────────────▼──────────────────────────▼─────────────────────────▼──────────────┐
│                              API & CONTROLLER LAYER                              │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │ /api/farmer/produce   │  │  /api/admin/products  │  │  /api/wallet/escrow  │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────────┬───────────┘  │
└──────────────┼──────────────────────────┼─────────────────────────┼──────────────┘
               │                          │                         │
┌──────────────▼──────────────────────────▼─────────────────────────▼──────────────┐
│                             SERVICE & REPOSITORY LAYER                           │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
│  │ WalletService / Escrow│  │ Trust & Policy Engine │  │ Fulfillment Engine   │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────────┬───────────┘  │
└──────────────┼──────────────────────────┼─────────────────────────┼──────────────┘
               │                          │                         │
┌──────────────▼──────────────────────────▼─────────────────────────▼──────────────┐
│                             PERSISTENCE & STORAGE                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │               PostgreSQL (Prisma ORM with Connection Pooling)               │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Domain & Business Capabilities

### 🌾 1. Multi-Farmer Competition ("Supermarket Engine")
- **Independent Listing Autonomy**: Multiple verified farmers can list identical commodities (e.g. *Cleaned Natural Sesame Seeds* or *Single-Origin Cocoa Beans*) with distinct asking prices, stock quantities, minimum order quantities (MOQ), moisture levels, and farm locations.
- **Fair Marketplace Competition**: The storefront catalog surfaces listings side-by-side without artificial deduplication, displaying producer provenance, origin state, and trust ratings.

### 🔍 2. Quality Assurance & Moderation Workflow
- **Pending Review Pipeline**: Every new produce submission defaults to `isAvailable = false` (Pending Approval).
- **Admin Audit Queue**: Platform operators evaluate moisture content, admixture, packaging specifications, and farm origin before toggling items to `Approved`.
- **Multi-Image Persistence**: Supports up to 5 high-resolution inspection photos per batch, stored and mapped via the `ProductImage` database entity.

### 💰 3. Escrow-Protected Financial Ledger
- **Buyer Escrow Lock**: Funds are securely locked in an escrow account upon order placement.
- **Automated Settlement**: Escrow is released to the seller's wallet only after digital Proof-of-Delivery (POD) is confirmed by the buyer or system inspector.
- **Double-Entry Ledger Integrity**: Every balance adjustment (Deposit, Escrow Lock, Release, Payout Withdrawal) is recorded in immutable `WalletTransaction` ledgers.

---

## 3. Technology Stack & System Topology

| Tier | Component | Technology | Rationale |
|---|---|---|---|
| **Framework** | Core Application | **Next.js 16.x (App Router)** | Server Components, Turbopack bundling, streaming SSR |
| **Language** | Runtime | **TypeScript 5.x (Strict)** | Static safety, DTO validation, strict null checks |
| **Database** | Database Engine | **PostgreSQL 16.x** | ACIDO compliance, JSONB support, relational integrity |
| **ORM** | Database Adapter | **Prisma ORM 6.x** | Type-safe queries, migration control, schema safety |
| **Styling** | Presentation | **Tailwind CSS 4.x & Vanilla CSS** | Custom design tokens, zero runtime CSS-in-JS |
| **Animations** | Motion Engine | **Framer Motion 12.x** | Hardware-accelerated cubic-bezier transitions |
| **Telemetry** | Observability | **Custom Tracing / W3C TraceContext** | Distributed trace headers, latency tracking |
| **Testing** | QA | **Vitest 3.x** | High-speed unit & integration test runner |

---

## 4. Database Schema & Entity-Relationship Architecture

The relational model (`prisma/schema.prisma`) enforces strict referential integrity across users, produce catalog, orders, and financial transactions.

```mermaid
erDiagram
    User ||--o| FarmerProfile : owns
    User ||--o| BuyerProfile : owns
    User ||--o| Wallet : owns
    FarmerProfile ||--o{ Product : produces
    Category ||--o{ Product : categorizes
    Product ||--o{ ProductImage : contains
    Product ||--o1 Inventory : tracks
    Product ||--o{ OrderItem : included_in
    Order ||--o{ OrderItem : consists_of
    User ||--o{ Order : places
    Order ||--o1 Delivery : tracked_by
    Order ||--o1 Payment : settled_by
    Wallet ||--o{ WalletTransaction : records
```

### Key Models Overview:
- **`User`**: Central identity with `Role` enum (`ADMIN`, `FARMER`, `BUYER`).
- **`FarmerProfile`**: Verified farm metadata, state, LGA, and KYC status (`PENDING`, `VERIFIED`, `APPROVED`).
- **`BuyerProfile`**: Shipping addresses, tax identification, import licenses.
- **`Product`**: Commodity details, asking price, normalized `unit` (`KG`, `BAG`, `TON`, `CRATE`, `PIECE`), and approval state (`isAvailable`).
- **`ProductImage`**: Linked image gallery URLs per product batch.
- **`Inventory`**: Stock tracking with `availableQty` and `reservedQty`.
- **`Wallet` & `WalletTransaction`**: Financial ledger tracking `BALANCE`, `ESCROW_LOCKED`, `PAYOUT_PENDING`.

---

## 5. API Specification & Data Flow Pipelines

### Key Endpoints

| HTTP Method | Route Endpoint | Role Required | Description |
|---|---|---|---|
| `POST` | `/api/farmer/produce` | `FARMER` | Ingests produce batch with dynamic category resolution & unit normalization |
| `GET` | `/api/products` | `PUBLIC` | Fetches active approved market catalog |
| `GET` | `/api/products/[id]` | `ALL` | Fetches specific produce details (supports pending review view for submitter) |
| `GET` | `/api/admin/products` | `ADMIN` | Fetches moderation queue filtered by status (`Pending`, `Approved`, `Rejected`) |
| `PUT` | `/api/admin/products/[id]/approve` | `ADMIN` | Approves or rejects a produce submission |
| `POST` | `/api/wallet/deposit` | `BUYER` | Credits buyer digital wallet |
| `POST` | `/api/wallet/withdraw` | `FARMER` | Initiates bank transfer payout from cleared balance |

---

## 6. Security, Session Management & RBAC

1. **Role-Based Access Control (RBAC)**:
   - `ADMIN`: Platform moderation, verification approvals, system fee configuration, global analytics.
   - `FARMER`: Produce management, field inspection reports, wallet payout withdrawals.
   - `BUYER`: Procurement showroom, cart management, escrow checkout, shipment tracking.
2. **Cryptographic Sessions**:
   - Encrypted session tokens with expiry verification (`src/lib/session.ts`).
3. **Audit Logging & Tracing**:
   - `W3C TraceContext` standard tracing headers (`x-trace-id`) injected into requests for API observability.

---

## 7. Installation & Operational Guide

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **npm**: v9.x+
- **PostgreSQL**: v15.x or v16.x

### Step-by-Step Environment Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Maajolawasanjo/smarthub-agronexus.git
   cd smarthub-agronexus
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/smarthub_agronexus?schema=public"
   SESSION_SECRET="super-secret-32-character-minimum-key"
   NODE_ENV="development"
   ```

4. **Initialize Database Schema & Seeds**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000`.

---

## 8. Directory Structure

```
smarthub-agronexus/
├── docs/                            # OpenAPI specs, audit logs, architecture diagrams
├── prisma/                          # Database schema definition & migration scripts
│   └── schema.prisma
├── public/                          # Optimized static imagery & public brand assets
├── src/
│   ├── app/                         # Next.js 16 App Router hierarchy
│   │   ├── admin/                   # Platform operator panel (/admin/*)
│   │   ├── api/                     # REST API handlers & endpoints
│   │   ├── dashboard/               # Buyer sourcing dashboard (/dashboard/*)
│   │   ├── farmer/                  # Producer portal (/farmer/*)
│   │   ├── products/                # Public export showroom (/products/*)
│   │   ├── globals.css              # Custom styling tokens & theme definitions
│   │   └── layout.tsx               # Root layout wrapper
│   ├── components/                  # Enterprise React components
│   │   ├── admin/                   # Admin moderation controls
│   │   ├── dashboard/               # Buyer procurement widgets
│   │   ├── farmer/                  # Produce submission & status components
│   │   ├── layout/                  # Navigation bars, footers
│   │   └── ui/                      # Reusable primitives (Buttons, Modals, Toasts)
│   ├── context/                     # Application state providers
│   ├── dto/                         # Data Transfer Object interfaces & validators
│   ├── lib/                         # Core utilities, Prisma client, session security
│   ├── repositories/                # Repository pattern implementation for data access
│   └── services/                    # Business logic services (Wallet, Settlement, Trust)
├── vitest.config.ts                 # Vitest test framework configuration
└── next.config.ts                   # Next.js build configuration
```

---

## 9. Financial Ledger & Escrow Settlement Engine

The financial core (`src/services/wallet.service.ts`) ensures atomic updates to financial balances:

1. **Deposit**: Buyer funds wallet via bank transfer / gateway -> Status: `CLEARED`.
2. **Escrow Lock**: When an order is created, funds transfer from `availableBalance` -> `escrowBalance`.
3. **Escrow Release**: Upon buyer POD confirmation, funds transfer from `escrowBalance` -> Farmer `availableBalance`.
4. **Payout**: Farmer requests withdrawal to local bank account (`src/app/api/wallet/withdraw/route.ts`).

---

## 10. Automated Quality Control & Trust Policies

- **Commodity Category Resolution**: Submissions automatically route to verified agricultural categories (e.g. *Tubers & Roots*, *Seeds & Grains*, *Nuts & Cocoa*, *Fresh & Processed*).
- **Unit Normalization**: Automatically converts input metrics to standard export units (`KG`, `BAG`, `TON`, `CRATE`, `PIECE`).
- **Tier 1 Listing Limits**: Unverified accounts are limited to listing a maximum number of active items until identity verification is completed.

---

## 11. Testing & Quality Assurance

Run static analysis and unit test suites:

```bash
# Type check TypeScript codebase
npx tsc --noEmit

# Execute unit and integration tests with Vitest
npx vitest run

# Run linter
npm run lint
```

---

## 12. Deployment & Infrastructure Topology

Optimized for containerized deployment or serverless platforms such as Vercel, Railway, or AWS ECS:

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 13. Maintainers & Licensing

Developed and maintained by **Smarthub Agrochain Engineering**.

**License**: Proprietary & Confidential — All Rights Reserved © 2026 Smarthub Agrochain.
