# Smarthub Agrochain

> A decentralized agro-ecosystem connecting farmers, investors, and consumers with full transparency.

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

---

## Overview

Smarthub Agrochain is a B2B agricultural marketplace platform connecting international buyers with premium-quality African agricultural produce. It provides transparent, traceable supply chains for commodities including cashew nuts, cocoa beans, spices, grains, and fresh produce.

---

## Features

- 🌾 **Product Marketplace** — Browse and filter agricultural commodities
- 🛒 **Cart & Checkout** — Persistent cart with localStorage sync
- 👤 **Auth Flows** — Buyer and Farmer sign-up/sign-in with form validation
- 📊 **Dashboard** — Analytics, order tracking, revenue charts, wallet
- 📦 **Order Management** — Full order lifecycle with status tracking
- 🌍 **Responsive Design** — Mobile-first, tested across breakpoints
- 🔔 **Toast Notifications** — Global feedback across all interactions

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | App Router, SSR, routing |
| **React 19** | UI rendering |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Page & component animations |
| **Recharts** | Dashboard data visualisation |
| **Lucide React** | Icon system |
| **clsx + tailwind-merge** | Conditional class utilities |

---

## Project Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── about/
│   ├── cart/
│   ├── contact/
│   ├── dashboard/           # Protected dashboard area
│   │   ├── orders/
│   │   ├── products/
│   │   ├── settings/
│   │   ├── tracking/
│   │   └── wallet/
│   ├── login/
│   ├── signup/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── dashboard/           # Dashboard-specific components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatsCards.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── RecentOffers.tsx
│   │   ├── notifications/
│   │   ├── orders/
│   │   ├── tracking/
│   │   └── wallet/
│   ├── layout/              # Global layout components
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── ui/                  # Shared UI primitives
│       ├── Button.tsx
│       ├── Hero.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Switch.tsx
│       ├── Toast.tsx
│       ├── Connectivity.tsx
│       ├── TargetMarket.tsx
│       └── Testimonials.tsx
├── context/                 # React Context providers
│   ├── CartContext.tsx
│   ├── SearchContext.tsx
│   └── UserContext.tsx
├── lib/
│   ├── data/
│   │   └── products.ts      # Product catalogue data
│   ├── constants.ts         # App-wide constants
│   └── utils.ts             # cn() utility
└── types/
    └── index.ts             # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/your-org/smarthub-agrochain.git
cd smarthub-agrochain
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## Deployment (Vercel)

This project is optimised for Vercel deployment.

1. Push to your GitHub repository
2. Import the repo in [https://vercel.com/new](https://vercel.com/new)
3. Vercel will auto-detect Next.js — no configuration needed
4. Set any required environment variables in the Vercel dashboard

### Environment Variables

No environment variables are required for the current demo build. When integrating a real backend, add the following to your Vercel project settings and a local `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

> ⚠️ Never commit `.env.local` to version control.

---

## Known Limitations (Demo Build)

- **Authentication** is simulated — no real backend. User data is persisted in `localStorage`.
- **Products** are static mock data in `/lib/data/products.ts`.
- **Cart** persists via `localStorage` only, not a database.
- **Orders / Tracking / Wallet** display mock data and are not connected to a live API.

---

## Roadmap

- [ ] Backend API integration (Node.js / Supabase / Firebase)
- [ ] Real authentication (JWT / NextAuth.js)
- [ ] Payment gateway (Stripe / Paystack)
- [ ] Admin panel for product management
- [ ] Real-time order tracking with WebSockets
- [ ] Multi-currency pricing

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT © Smarthub Agrochain
