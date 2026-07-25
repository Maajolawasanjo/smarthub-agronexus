# 🌾 SmartHub AgroChain (AgroNexus)

> **AI-Powered Enterprise B2B Agricultural Marketplace & Supply Chain Platform**
> 
> *Architected for high-concurrency commodity trading, multi-currency escrow, automated financial ledgers, digital wallets, identity verification (KYC), and end-to-end supply chain telemetry across global agricultural export routes.*

![SmartHub AgroChain Banner](/public/images/greenhouse_harvest_banner.png)

[![Next.js](https://img.shields.io/badge/Next.js-16.x_(App_Router)-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Flutterwave](https://img.shields.io/badge/Flutterwave-Payment_Gateway-F5A623?style=for-the-badge&logo=flutterwave&logoColor=white)](https://flutterwave.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 📋 Table of Contents

1. [Hero Section](#1-hero-section)
2. [Table of Contents](#2-table-of-contents)
3. [Overview](#3-overview)
4. [The Problem](#4-the-problem)
5. [The Solution](#5-the-solution)
6. [Core Features](#6-core-features)
   - [Buyer Features](#buyer-features)
   - [Farmer Features](#farmer-features)
   - [Admin Features](#admin-features)
7. [Screenshots & UI Walkthrough](#7-screenshots--ui-walkthrough)
8. [System Architecture](#8-system-architecture)
9. [Technology Stack](#9-technology-stack)
10. [Folder Structure](#10-folder-structure)
11. [Database Design](#11-database-design)
12. [Business Workflow](#12-business-workflow)
13. [Financial System](#13-financial-system)
14. [Security & Compliance](#14-security--compliance)
15. [API Overview](#15-api-overview)
16. [Installation](#16-installation)
17. [Environment Variables](#17-environment-variables)
18. [Running Tests](#18-running-tests)
19. [Production Readiness](#19-production-readiness)
20. [Roadmap](#20-roadmap)
21. [Contributors](#21-contributors)
22. [License](#22-license)
23. [Contact](#23-contact)
24. [Acknowledgements](#24-acknowledgements)

---

## 3. Overview

**SmartHub AgroChain** (AgroNexus) is a Next.js 16 and PostgreSQL-powered enterprise B2B agricultural export marketplace and supply chain management engine. Designed to connect smallholder farming communities, agricultural cooperatives, and local producers directly with international importers, food processors, and commodity traders.

The platform eliminates predatory intermediaries by integrating:
- **Direct-to-Buyer Marketplace**: Enabling multi-farmer competition with transparent commodity pricing, harvest provenance, moisture metrics, and export specifications.
- **Smart Escrow & Double-Entry Ledger**: Safeguarding funds in multi-currency digital wallets until digital Proof-of-Delivery (POD) is confirmed.
- **Automated Verification & Moderation**: Ensuring that all listed produce undergoes quality control checks before entering the active catalog.
- **Multi-Role Portal Hierarchy**: Customized control centers tailored for Buyers, Farmers, Logistics Agents, and System Super Administrators.

---

## 4. The Problem

Agricultural trade in emerging markets—particularly sub-Saharan Africa—is constrained by systemic inefficiencies and structural trust deficits:

1. **Farmer Exploitation & Opaque Intermediaries**: Smallholder farmers receive as little as 20% of international market values due to aggressive multi-layered middlemen.
2. **Payment Insecurity & Fraud**: Producers frequently suffer from delayed payouts, bounced checks, or non-payment post-delivery. Conversely, international buyers face risks of non-shipment or sub-standard goods.
3. **Quality & Moisture Discrepancies**: High rejection rates at destination ports due to unverified moisture content, pest contamination, and non-standard packaging.
4. **Logistics & Traceability Blackholes**: Lack of real-time telemetry between farmgate harvest, regional aggregation hubs, customs processing, and maritime shipping lines.
5. **Credit & Capital Deficits**: Inability for verified producers to leverage trade history for input financing or pre-harvest liquidity.

---

## 5. The Solution

SmartHub AgroChain solves these structural trade barriers through a unified software architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SMARTHUB AGROCHAIN SOLUTION                      │
├───────────────────────┬───────────────────────────┬─────────────────────────┤
│   B2B MARKETPLACE     │     FINANCIAL LEDGER      │   QUALITY & TELEMETRY   │
│  - Multi-farmer list  │  - Multi-currency Wallet  │  - Grade inspection QC  │
│  - Real-time catalog  │  - Smart Escrow Lock      │  - Moisture telemetry   │
│  - Direct buyer quotes│  - Automated Payouts      │  - Milestone tracking   │
└───────────────────────┴───────────────────────────┴─────────────────────────┘
```

- **Direct Supermarket-Style Competition**: Buyers compare live commodity offers from multiple verified farmers, evaluating price per metric ton, moisture level, origin state, and certified organic status.
- **Programmable Escrow Vaults**: Buyer capital is locked upon contract generation and released atomically to the farmer's wallet only after physical inspection and POD verification.
- **Automated Quality Verification Engine**: Platform inspectors evaluate produce batches against international export standards (`ISO`/`FSSAI`/`NAFDAC`), gating unverified produce in a moderation queue.
- **Real-Time Telemetry & Transparency**: End-to-end shipment lifecycle tracking from farmgate loading to vessel dispatch.

---

## 6. Core Features

### Buyer Features
- 🛒 **Export Showroom & Sourcing Catalog**: Browse export-ready commodities (Sesame Seeds, Raw Cashew Nuts, Cocoa Beans, Split Dried Ginger, Cassava Flour) with interactive category filtering.
- 🔍 **Interactive Sourcing & Price Calculator**: Calculate landed costs, logistics fees, insurance, and freight estimates dynamically.
- 💼 **Digital Wallet & Escrow Checkout**: Deposit funds via local/international payment rails, lock funds in escrow, and monitor balance movements.
- 📦 **Order Lifecycle & Milestone Tracker**: Monitor multi-step order progress from `Pending Inspection` to `Port Arrival` and `Delivered`.
- ⭐ **Supplier Verification & Ratings**: Review verified farmer performance scores, harvest history, and quality inspection certificates.

### Farmer Features
- 🌾 **Produce Submission Studio**: List harvested commodities with details including variety, asking price, stock quantity, packaging unit (`KG`, `BAG`, `TON`, `CRATE`, `PIECE`), harvest date, and high-resolution batch photos.
- 📊 **Farmer Operational Dashboard**: Real-time KPI analytics tracking total sales volume, active listings, pending escrow balances, and field agent assignments.
- 💳 **Payout Wallet & Instant Withdrawals**: Receive cleared escrow funds directly into local bank accounts via automated payment rails.
- 📜 **Produce Verification Management**: Submit farm registration documents and view field agent quality inspection reports.
- 📈 **Price Intelligence**: Access regional market price trends to price produce competitively.

### Admin Features
- 🛡️ **Product Moderation Queue**: Inspect pending produce submissions, verify moisture metrics, check harvest locations, and approve/reject listings (`isAvailable` state toggle).
- 👥 **User Management & RBAC**: Administer user accounts across `ADMIN`, `FARMER`, and `BUYER` roles with suspension, verification, and KYB/KYC tools.
- 🏛️ **Treasury & Escrow Control HQ**: Audit platform transaction ledgers, manage commission fee structures, and resolve trade disputes.
- 📊 **System-Wide Analytics**: Monitor gross merchandise value (GMV), platform transaction volume, category demand, and regional output metrics.

---

## 7. Screenshots & UI Walkthrough

### Public Export Showroom & Landing Page
![Public Landing Page](/public/images/greenhouse_harvest_banner.png)

### Logistics & Supply Chain Connectivity
![Supply Chain Telemetry](/public/agrochain-logistics.png)

### Farmers & Field Operations
![Farmers Field Operations](/public/agrochain-farmers.png)

*(Note: Additional screenshots of the Buyer Sourcing Dashboard, Farmer Control Center, Admin Approval Queue, and Wallet Interface can be found under `/public/` and generated via screenshot tools.)*

---

## 8. System Architecture

SmartHub AgroChain utilizes a clean multi-tier architecture with strict domain boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT PRESENTATION TIER                         │
│   Next.js 16 App Router (React 19, Tailwind CSS 4, Framer Motion 12)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (REST API / JSON / Server Actions)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                             API & SECURITY TIER                             │
│   Auth / Sessions (Cryptographic JWT) │ RBAC Middleware │ Rate Limiters    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                           BUSINESS LOGIC & SERVICES                         │
│  ┌────────────────────┐   ┌─────────────────────┐   ┌────────────────────┐  │
│  │ Wallet & Escrow    │   │ Quality & Moderation│   │ Order & Shipping   │  │
│  │ Service Engine     │   │ Policy Engine       │   │ Fulfillment Engine │  │
│  └────────────────────┘   └─────────────────────┘   └────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Prisma ORM Client)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                          PERSISTENCE & EXTERNAL RAILS                       │
│  ┌─────────────────────────────────┐       ┌─────────────────────────────┐  │
│  │ PostgreSQL 16 DB (Prisma Schema)│       │ Flutterwave Payment Gateway │  │
│  └─────────────────────────────────┘       └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Technology Stack

### Presentation & Frontend
- **Framework**: [Next.js 16.x (App Router)](https://nextjs.org/)
- **UI Runtime**: [React 19.x](https://react.dev/)
- **Type System**: [TypeScript 5.x](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS 4.x](https://tailwindcss.com/) & Custom CSS Design Tokens
- **Motion & Micro-interactions**: [Framer Motion 12.x](https://www.framer.com/motion/)
- **Charts & Data Visualization**: [Recharts 3.x](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend, Database & Infrastructure
- **Database**: [PostgreSQL 16.x](https://www.postgresql.org/)
- **ORM**: [Prisma ORM 6.x](https://www.prisma.io/)
- **Session & Auth Security**: Jose / Web Crypto API JWT session tokens
- **Payment Processing & Payouts**: Flutterwave SDK / REST Webhooks
- **Telemetry & Tracing**: W3C TraceContext Distributed Tracing (`x-trace-id`)
- **Testing Framework**: [Vitest 3.x](https://vitest.dev/)

---

## 10. Folder Structure

```
smarthub-agronexus/
├── docs/                            # Deep engineering documentation & OpenAPI specs
│   ├── openapi.yaml                 # OpenAPI 3.0 API Specification
│   ├── farmer-dashboard-audit.md    # Production audit & hardening reports
│   └── feature-inventory.md         # Comprehensive feature roadmap
├── prisma/                          # Relational schema definition & seed scripts
│   └── schema.prisma
├── public/                          # Optimized static imagery, branding, and assets
│   ├── LOGO.jpg
│   ├── agrochain-farmers.png
│   ├── agrochain-logistics.png
│   └── images/products/             # Commodity images
├── src/
│   ├── app/                         # Next.js 16 App Router Routes
│   │   ├── about/                   # About page (/about)
│   │   ├── admin/                   # Admin Panel (/admin/*)
│   │   │   ├── analytics/           # Global analytics
│   │   │   ├── overview/            # Moderation overview
│   │   │   ├── products/            # Produce approval queue
│   │   │   └── users/               # User directory
│   │   ├── api/                     # REST API Route Handlers
│   │   │   ├── admin/               # Admin endpoints
│   │   │   ├── auth/                # Auth endpoints (/login, /register, /logout)
│   │   │   ├── farmer/              # Farmer produce ingestion & management
│   │   │   ├── orders/              # Order lifecycle & escrow triggers
│   │   │   ├── products/            # Public & buyer catalog queries
│   │   │   └── wallet/              # Digital wallet deposit & withdrawal
│   │   ├── dashboard/               # Buyer Dashboard (/dashboard/*)
│   │   ├── farmer/                  # Farmer Portal (/farmer/*)
│   │   ├── products/                # Public Export Showroom (/products)
│   │   ├── globals.css              # Theme variables & design system
│   │   └── layout.tsx               # Root Layout
│   ├── components/                  # Domain-Driven UI Components
│   │   ├── admin/                   # Admin moderation widgets
│   │   ├── dashboard/               # Buyer dashboard cards & charts
│   │   ├── farmer/                  # Produce submission forms & metrics
│   │   ├── layout/                  # Navbar, Footer
│   │   └── ui/                      # Primitive design components (Button, Modal, Toast)
│   ├── context/                     # Global React State Contexts (User, Cart, Produce)
│   ├── dto/                         # Data Transfer Object Contracts & Types
│   ├── lib/                         # Core Utilities (Prisma, Session, Security, Tracing)
│   ├── repositories/                # Repository Pattern Abstractions (User, Order, Payment)
│   └── services/                    # Core Business Logic Services (Wallet, Settlement, Trust)
├── vitest.config.ts                 # Vitest Runner Config
├── next.config.ts                   # Next.js Optimization Config
└── package.json
```

---

## 11. Database Design

The relational database architecture (`prisma/schema.prisma`) maintains strict ACIDO compliance, foreign key constraints, and cascade policies.

```mermaid
erDiagram
    USER ||--o| FARMER_PROFILE : "has profile"
    USER ||--o| BUYER_PROFILE : "has profile"
    USER ||--o| WALLET : "owns"
    FARMER_PROFILE ||--o{ PRODUCT : "produces"
    CATEGORY ||--o{ PRODUCT : "classifies"
    PRODUCT ||--o{ PRODUCT_IMAGE : "contains"
    PRODUCT ||--o1 INVENTORY : "tracks stock"
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    ORDER ||--o{ ORDER_ITEM : "contains"
    USER ||--o{ ORDER : "places"
    ORDER ||--o1 PAYMENT : "settled by"
    ORDER ||--o1 DELIVERY : "dispatched via"
    WALLET ||--o{ WALLET_TRANSACTION : "logs"
```

### Core Entities:
- **`User`**: Base identity model (`id`, `email`, `passwordHash`, `fullName`, `role: ADMIN | FARMER | BUYER`, `isActive`).
- **`FarmerProfile`**: Farm details (`farmName`, `farmAddress`, `state`, `lga`, `verificationStatus: PENDING | APPROVED | REJECTED`).
- **`BuyerProfile`**: Procurement details (`companyName`, `taxId`, `country`, `address`).
- **`Product`**: Commodity record (`name`, `description`, `price`, `unit: KG | BAG | TON | CRATE | PIECE`, `isAvailable`, `farmerProfileId`, `categoryId`).
- **`ProductImage`**: Linked high-resolution batch photography.
- **`Inventory`**: Stock tracking (`availableQty`, `reservedQty`).
- **`Wallet` & `WalletTransaction`**: Multi-currency ledger tracking available balances and locked escrow amounts.

---

## 12. Business Workflow

```
[Buyer Places Order]
        │
        ▼
[Funds Locked in Escrow Vault] ──► (Status: ESCROW_LOCKED)
        │
        ▼
[Farmer Prepares Produce Batch]
        │
        ▼
[Quality Inspection & Shipping Dispatch]
        │
        ▼
[Digital Proof of Delivery (POD) Confirmed]
        │
        ▼
[Escrow Released to Farmer Wallet] ──► (Status: CLEARED)
        │
        ▼
[Farmer Initiates Bank Withdrawal]
```

---

## 13. Financial System

SmartHub AgroChain implements a robust double-entry accounting engine (`src/services/wallet.service.ts`):

1. **Wallet Deposits**: Buyers credit their digital wallet via integrated card or bank transfer rails.
2. **Escrow Encumbrance**: When an order is generated, funds are atomically moved from `availableBalance` to `escrowLockedBalance`.
3. **Automated Settlement & Commission**: Upon order fulfillment (POD), platform commissions are computed, and net proceeds are released to the farmer's cleared balance.
4. **Payout Withdrawal Engine**: Farmers request withdrawals directly to local bank accounts, backed by webhook state confirmation.
5. **Reconciliation & Audit**: All transaction logs record transaction references, timestamps, and balance snapshots for accounting reconciliation.

---

## 14. Security & Compliance

- **Role-Based Access Control (RBAC)**: Enforced across client navigation and API endpoints to isolate `ADMIN`, `FARMER`, and `BUYER` boundaries.
- **Session Security**: Server-side JWT session validation using HTTP-only secure cookies.
- **Input Sanitization & SQL Injection Defense**: Prisma ORM parametrized queries prevent SQL injection attacks.
- **Webhook Security**: Payment webhooks validate signatures (`verif-hash`) to prevent transaction spoofing.
- **Rate Limiting**: API routes incorporate IP-based rate limiting to prevent denial-of-service attempts.

---

## 15. API Overview

Comprehensive API specifications are documented in OpenAPI 3.0 format under [`/docs/openapi.yaml`](/docs/openapi.yaml).

### Summary Endpoints:
- **Authentication**: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Farmer Operations**: `POST /api/farmer/produce`, `GET /api/farmer/analytics`, `GET /api/farmer/customers`, `PATCH /api/farmer/produce/[id]/status`
- **Catalog & Showroom**: `GET /api/products`, `GET /api/products/[id]`, `GET /api/categories`
- **Admin Moderation**: `GET /api/admin/products`, `PUT /api/admin/products/[id]/approve`, `GET /api/admin/overview`
- **Wallet & Escrow**: `POST /api/wallet/deposit`, `POST /api/wallet/withdraw`, `GET /api/wallet`

---

## 16. Installation

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **npm**: v9.x or higher
- **PostgreSQL**: v15.x or v16.x

### Step-by-Step Execution

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Maajolawasanjo/smarthub-agronexus.git
   cd smarthub-agronexus
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment File**:
   Copy `.env.example` (or create `.env`):
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database Schema & Client**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 17. Environment Variables

| Variable Name | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/agronexus?schema=public` |
| `SESSION_SECRET` | Yes | 32+ character key for cryptographic JWT signing | `super-secret-production-encryption-key-32-chars` |
| `NODE_ENV` | Yes | Application environment | `development` \| `production` |
| `NEXT_PUBLIC_APP_URL` | Optional | Frontend application base URL | `http://localhost:3000` |
| `FLUTTERWAVE_PUBLIC_KEY` | Optional | Flutterwave gateway public key | `FLWPUBK_TEST-xxxxxx-X` |
| `FLUTTERWAVE_SECRET_KEY` | Optional | Flutterwave gateway secret key | `FLWSECK_TEST-xxxxxx-X` |
| `FLUTTERWAVE_SECRET_HASH`| Optional | Secret hash for webhook validation | `agronexus-webhook-secret-hash` |

---

## 18. Running Tests

SmartHub AgroChain utilizes **Vitest** for fast unit and integration testing.

```bash
# Run full test suite
npx vitest run

# Run TypeScript compilation check
npx tsc --noEmit

# Run Next.js linter
npm run lint
```

---

## 19. Production Readiness

The codebase has undergone production hardening across the following vectors:

- ✅ **Data Integrity**: Database tables enforced via foreign keys, unique constraints, and transaction isolation.
- ✅ **Concurrency Handling**: Stock reservations and wallet adjustments executed in atomic Prisma transactions.
- ✅ **Clean Codebase**: 0 TypeScript compilation errors (`npx tsc --noEmit` verified).
- ✅ **Observability**: Standardized API error responses and distributed tracing (`x-trace-id`).

---

## 20. Roadmap

### 🚀 Version 1.0 (Current Baseline)
- [x] Full Next.js 16 App Router UI & Server API Infrastructure
- [x] Multi-tenant role system (`ADMIN`, `FARMER`, `BUYER`)
- [x] PostgreSQL & Prisma ORM database models
- [x] Farmer produce ingestion engine with multi-photo uploads and unit normalization
- [x] Admin approval and product moderation queue
- [x] Digital wallet and escrow financial ledger engine

### 🔮 Version 2.0 (Planned)
- [ ] AI-assisted produce pricing & yield forecasting
- [ ] Automated SMS/WhatsApp notifications for field farmers
- [ ] Real-time IoT sensor telemetry (container temperature & humidity tracking)
- [ ] Automated logistics routing & freight aggregation

### 🌐 Version 3.0 (Future Vision)
- [ ] Multi-currency cross-border settlement (USDC / Fiat integration)
- [ ] On-chain agricultural provenance and trade history on public ledger
- [ ] Pre-harvest financing & yield index insurance products

---

## 21. Contributors

Developed and maintained by the **SmartHub AgroChain Engineering Team**:

- **Maajo Nathan Lawasanjo** — *Lead Systems Architect & Core Developer* ([@Maajolawasanjo](https://github.com/Maajolawasanjo))

---

## 22. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 23. Contact

- **Website**: [https://smarthubagro.com](https://smarthubagro.com)
- **Email**: `admin@smarthubagro.com`
- **GitHub**: [https://github.com/Maajolawasanjo/smarthub-agronexus](https://github.com/Maajolawasanjo/smarthub-agronexus)

---

## 24. Acknowledgements

Special thanks to the open-source communities and platforms powering SmartHub AgroChain:
- [Next.js](https://nextjs.org/) & [Vercel](https://vercel.com/)
- [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- [Flutterwave](https://flutterwave.com/)
