# Smarthub Agrochain

> A premium B2B agricultural export marketplace connecting international buyers with verified Nigerian farm produce — with full transparency, laboratory-grade quality verification, and real-time shipment tracking.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-pink?logo=framer)](https://www.framer.com/motion)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Project Structure](#4-project-structure)
5. [Pages & Routes](#5-pages--routes)
6. [Context / State Management](#6-context--state-management)
7. [Design System](#7-design-system)
8. [Page Transitions](#8-page-transitions)
9. [User Roles & Access](#9-user-roles--access)
10. [Product Catalogue](#10-product-catalogue)
11. [Public Assets](#11-public-assets)
12. [Key Components](#12-key-components)
13. [localStorage Keys](#13-localstorage-keys)
14. [Configuration Files](#14-configuration-files)
15. [Deployment](#15-deployment)
16. [Known Limitations (Demo Build)](#16-known-limitations-demo-build)
17. [Roadmap](#17-roadmap)
18. [Contributing](#18-contributing)

---

## 1. Project Overview

**Smarthub Agrochain** is a full-stack-ready Next.js frontend for a B2B agricultural export platform. It provides:

- A **public-facing marketing site** (landing page, products showroom, how-it-works, about, contact)
- A **buyer dashboard** for registered importers to manage orders, track shipments, and view wallet transactions
- A **farmer portal** for local producers to submit produce listings, view field agent reports, and receive payouts
- An **admin panel** for platform operators to verify listings, moderate users, and monitor analytics
- A dual-view **product strategy**: public visitors see the curated export showroom (`/products`); authenticated buyers see their personalised sourcing dashboard (`/dashboard/products`)

The entire UI is locked to **light mode only** and uses a consistent **forest-green brand palette** throughout.

---

## 2. Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.x (Turbopack) | App Router, SSR, file-based routing |
| **React** | 19.x | UI rendering and component model |
| **TypeScript** | 5.x | Full type safety across all files |
| **Tailwind CSS** | 4.x | Utility-first styling with custom design tokens |
| **Framer Motion** | 12.x | Smooth page transitions and micro-animations |
| **Recharts** | 3.x | Revenue and analytics charts in dashboards |
| **Lucide React** | 0.563 | Consistent icon library |
| **clsx** | 2.x | Conditional className merging |
| **tailwind-merge** | 3.x | Prevents Tailwind class conflicts |
| **Geist Sans / Mono** | Google Fonts | Primary sans-serif and monospace typefaces |
| **Caveat** | Google Fonts | Handwriting-style accent font (used for decorative elements) |

---

## 3. Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
git clone https://github.com/your-org/smarthub-agrochain.git
cd smarthub-agrochain
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The server uses **Turbopack** by default for fast HMR.

> ⚠️ If you see stale images after replacing files in `/public`, delete the `.next` folder and restart:
> ```bash
> rm -rf .next && npm run dev
> ```

### Build for Production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## 4. Project Structure

```
smarthub-agrochain/
├── public/                          # Static assets served at root URL
│   ├── LOGO.jpg                     # Brand logo used in Navbar
│   ├── hero-bg.jpg                  # Landing page hero background image
│   ├── how-it-works-hero.jpg        # How It Works page hero background
│   ├── landing-hero-drone.jpg       # Products page hero background
│   ├── contact-hero.jpg             # Contact page hero background
│   ├── agrochain-farmers.png        # Farmers imagery (used in about/connectivity sections)
│   ├── agrochain-logistics.png      # Logistics imagery
│   ├── target-bg.png                # Target market section background
│   ├── target-buyer.png             # Target market — Buyer card image
│   ├── target-importer.png          # Target market — Importer card image
│   ├── target-processor.png         # Target market — Processor card image
│   ├── vegetable-container.png      # Decorative produce container
│   ├── brush-border.svg             # Decorative brush stroke SVG
│   ├── avatar-1.png → avatar-5.png  # Testimonial user avatars
│   ├── logos/                       # Partner/certification logos
│   ├── about/                       # About page specific images
│   └── images/
│       └── products/                # Product card images (9 products)
│           ├── sesame_seeds.png     # Cleaned Natural Sesame Seeds
│           ├── dates.jpg            # Premium Sweet Dried Dates (Debino)
│           ├── flour.png            # High-Grade Processed Cassava Flour
│           ├── cashew_nut.png       # Premium Raw Cashew Nuts (RCN)
│           ├── cocoa_beans.png      # Organic Single-Origin Cocoa Beans
│           ├── ginger_spices.png    # Premium Split Dried Ginger
│           ├── peanuts.png          # Export-Grade Hand-Selected Groundnuts
│           ├── cabbage.jpg          # Fresh Premium Green Cabbages
│           └── watermelon.jpg       # Sweet Organic Seedless Watermelons
│
├── src/
│   ├── app/                         # Next.js App Router — all page routes
│   │   ├── layout.tsx               # Root layout: fonts, providers, metadata
│   │   ├── template.tsx             # Page transition wrapper (Framer Motion)
│   │   ├── globals.css              # Global styles, Tailwind imports, design tokens
│   │   ├── page.tsx                 # Landing page (/)
│   │   ├── about/page.tsx           # About page (/about)
│   │   ├── contact/page.tsx         # Contact page (/contact)
│   │   ├── products/page.tsx        # Public products showroom (/products)
│   │   ├── how-it-works/page.tsx    # How It Works + Cost Estimator (/how-it-works)
│   │   ├── login/page.tsx           # Login page (/login)
│   │   ├── signup/page.tsx          # Sign-up page (/signup)
│   │   ├── cart/page.tsx            # Shopping cart (/cart)
│   │   ├── dashboard/               # Buyer dashboard (protected area)
│   │   │   ├── layout.tsx           # Dashboard shell: Sidebar + Header
│   │   │   ├── template.tsx         # Dashboard-specific page transitions
│   │   │   ├── page.tsx             # Dashboard home: StatsCards + Charts
│   │   │   ├── products/            # Buyer's sourcing catalogue
│   │   │   │   ├── page.tsx         # Product grid with search + filters
│   │   │   │   └── [id]/page.tsx    # Individual product detail view
│   │   │   ├── orders/page.tsx      # Order management with status tracking
│   │   │   ├── tracking/page.tsx    # Shipment tracking with map-style UI
│   │   │   ├── wallet/page.tsx      # Wallet: balance, deposits, transactions
│   │   │   ├── notifications/page.tsx  # In-app notification centre
│   │   │   └── settings/page.tsx    # Account & profile settings
│   │   ├── farmer/                  # Farmer portal (separate role area)
│   │   │   ├── layout.tsx           # Farmer shell: FarmerSidebar + Header
│   │   │   ├── template.tsx         # Farmer-specific page transitions
│   │   │   ├── page.tsx             # Farmer dashboard home
│   │   │   ├── sell/page.tsx        # Submit produce for sale
│   │   │   ├── listings/page.tsx    # View submitted produce listings
│   │   │   ├── produce/[id]/page.tsx  # Individual produce detail
│   │   │   ├── produce/detail/page.tsx
│   │   │   ├── wallet/page.tsx      # Farmer payout wallet
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── admin/                   # Admin panel (platform operators)
│   │       ├── layout.tsx           # Admin shell layout
│   │       ├── template.tsx         # Admin page transitions
│   │       ├── page.tsx             # Redirects to /admin/overview
│   │       ├── login/page.tsx       # Admin login gate
│   │       ├── signup/page.tsx      # Admin account creation
│   │       ├── overview/page.tsx    # Platform health + moderation tasks
│   │       ├── products/page.tsx    # Listing moderation & approval queue
│   │       ├── orders/page.tsx      # All platform orders view
│   │       ├── users/page.tsx       # User management (Buyers & Farmers)
│   │       ├── analytics/page.tsx   # Revenue charts and platform metrics
│   │       ├── content/page.tsx     # Content management
│   │       ├── notifications/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx           # Responsive top nav with auth-aware links
│   │   │   └── Footer.tsx           # Global site footer
│   │   ├── ui/                      # Shared primitive components
│   │   │   ├── Button.tsx           # Styled button with variant support
│   │   │   ├── Input.tsx            # Form input with label support
│   │   │   ├── Select.tsx           # Styled dropdown select
│   │   │   ├── Switch.tsx           # Toggle switch component
│   │   │   ├── Toast.tsx            # Global toast notification system
│   │   │   ├── Hero.tsx             # Landing page hero section
│   │   │   ├── Connectivity.tsx     # "How We Connect" section on landing
│   │   │   ├── TargetMarket.tsx     # Target market cards on landing
│   │   │   └── Testimonials.tsx     # Customer testimonials with marquee
│   │   ├── dashboard/               # Buyer dashboard components
│   │   │   ├── Header.tsx           # Dashboard top header bar
│   │   │   ├── Sidebar.tsx          # Collapsible left navigation sidebar
│   │   │   ├── StatsCards.tsx       # KPI metric cards (revenue, orders, etc.)
│   │   │   ├── RevenueChart.tsx     # Line/bar chart (Recharts)
│   │   │   ├── RecentOffers.tsx     # Recent sourcing offers panel
│   │   │   ├── notifications/       # Notification list components
│   │   │   ├── orders/OrdersList.tsx
│   │   │   ├── tracking/            # Tracking step timeline components
│   │   │   └── wallet/              # Balance card, transaction list, add-wallet modal
│   │   └── farmer/                  # Farmer portal components
│   │       ├── FarmerHeader.tsx
│   │       ├── FarmerSidebar.tsx
│   │       ├── FarmerChart.tsx
│   │       ├── FarmerStatsCards.tsx
│   │       ├── FieldAgent.tsx       # Field agent assignment card
│   │       ├── RecentSubmit.tsx     # Recent produce submissions
│   │       ├── SubmitFarmProduce.tsx  # Produce submission form
│   │       └── notifications/
│   │
│   ├── context/                     # React Context API providers
│   │   ├── UserContext.tsx          # Auth state: user data, role, login/logout
│   │   ├── CartContext.tsx          # Cart state: items, quantities, totals
│   │   ├── SearchContext.tsx        # Global search query state
│   │   └── ProduceContext.tsx       # Farmer produce submissions state
│   │
│   ├── lib/
│   │   ├── data/
│   │   │   └── products.ts          # Static product catalogue (6 dashboard products)
│   │   ├── constants.ts             # App-wide constants
│   │   └── utils.ts                 # cn() — className merge utility
│   │
│   └── types/
│       └── index.ts                 # Shared TypeScript type definitions
│
├── next.config.ts                   # Next.js config (image domains, optimizations)
├── tailwind.config.ts               # Tailwind config (if exists)
├── postcss.config.mjs               # PostCSS config for Tailwind
├── tsconfig.json                    # TypeScript compiler options
└── package.json
```

---

## 5. Pages & Routes

### Public Routes (No auth required)

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page: Hero, Connectivity, Target Market, Testimonials |
| `/products` | `app/products/page.tsx` | Public export showroom — 9 products with category filter tabs and seasonality calendar |
| `/how-it-works` | `app/how-it-works/page.tsx` | Interactive role switcher (Buyer / Farmer view), Agrochain supply loop, Live cost estimator tool, FAQ accordion |
| `/about` | `app/about/page.tsx` | Company mission, team, and values |
| `/contact` | `app/contact/page.tsx` | Contact form and trade desk info |
| `/login` | `app/login/page.tsx` | Login form — writes user to `localStorage` |
| `/signup` | `app/signup/page.tsx` | Signup form — role selection (Buyer / Farmer) |
| `/cart` | `app/cart/page.tsx` | Cart items, quantity controls, checkout modal |

### Buyer Dashboard Routes (Authenticated — role: `buyer`)

| Route | Description |
|---|---|
| `/dashboard` | Overview: KPI stats, revenue chart, recent offers |
| `/dashboard/products` | Personalised product catalogue with search and add-to-cart |
| `/dashboard/products/[id]` | Product detail view: full specs, pricing, sourcing CTA |
| `/dashboard/orders` | Order list with status badges (Pending / Active / Delivered) |
| `/dashboard/tracking` | Multi-step shipment tracker with port-to-port timeline |
| `/dashboard/wallet` | Wallet balance, deposit funds, transaction history |
| `/dashboard/notifications` | Platform notifications and alerts |
| `/dashboard/settings` | Profile update: name, email, country, currency, avatar |

### Farmer Portal Routes (Authenticated — role: `farmer`)

| Route | Description |
|---|---|
| `/farmer` | Farmer dashboard: stats, chart, field agent card, recent submissions |
| `/farmer/sell` | Submit new produce: name, quantity, grade, harvest date |
| `/farmer/listings` | All submitted produce and current status |
| `/farmer/produce/[id]` | Individual produce batch detail view |
| `/farmer/wallet` | Payout wallet and transaction history |
| `/farmer/notifications` | Notifications and agent updates |
| `/farmer/settings` | Profile: farm name, state, phone, bank details |

### Admin Panel Routes (Authenticated — role: `admin`)

| Route | Description |
|---|---|
| `/admin/login` | Separate admin authentication gate |
| `/admin/overview` | Platform health, commission rate, moderation task queue (approve/reject) |
| `/admin/products` | All farmer listings with moderation controls |
| `/admin/orders` | Full platform order log |
| `/admin/users` | User directory: Buyers and Farmers |
| `/admin/analytics` | Revenue charts, category breakdowns, performance metrics |
| `/admin/content` | Content management |
| `/admin/notifications` | Admin notification centre |
| `/admin/settings` | Admin account settings |

---

## 6. Context / State Management

All global state is managed via **React Context API**. Every provider is registered in `src/app/layout.tsx` and wraps the entire app.

### `UserContext` (`src/context/UserContext.tsx`)

Manages authentication and user profile.

```typescript
interface UserData {
  name: string;
  email: string;
  profileImage: string;
  currency: string;
  country: string;
  address: string;
  role: "buyer" | "farmer" | "admin";
  // Farmer-only fields:
  farmName?: string;
  phone?: string;
  state?: string;
}
```

**Key exports:**
- `useUser()` — hook to access `{ user, isAuthenticated, updateUser, logout }`
- `updateUser(data)` — partial update, auto-persists to `localStorage` key `smarthub_user`
- `logout()` — clears user state and removes `smarthub_user` from `localStorage`
- Admin users are also synced to a `smarthub_admins` array in `localStorage`

### `CartContext` (`src/context/CartContext.tsx`)

Manages the shopping cart for buyers.

**Key exports:**
- `useCart()` — hook to access `{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, cartCount, cartTotal }`
- Cart persists to `localStorage` key `smarthub_cart`
- `cartTotal` is calculated as `sum(item.price × item.quantity)`

### `SearchContext` (`src/context/SearchContext.tsx`)

Provides a global search query string shared across the products listing and navbar search input.

### `ProduceContext` (`src/context/ProduceContext.tsx`)

Manages farmer produce submissions in memory (resets on page refresh in the current demo build).

---

## 7. Design System

All design tokens are defined in `src/app/globals.css` using Tailwind v4's `@theme inline` directive.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#1B4D28` | Primary green — buttons, headings, active states, sidebar |
| `--color-primary-hover` | `#143d20` | Hover state for primary |
| `--color-secondary` | `#739072` | Muted green — subtitles, badges, secondary text |
| `--color-secondary-hover` | `#5f7a5e` | Hover state for secondary |
| `--color-accent` | `#4CAF50` | Bright accent green — highlights, live indicators |
| `--background` | `#EEF2EE` | Page background — a soft sage/off-white |
| `--foreground` | `#171717` | Body text |

> 💡 **Dark Mode is intentionally disabled.** The entire app forces light mode via `color-scheme: light !important` on both `:root` and `html`. Do not add dark mode classes — they will not apply.

### Typography

Three fonts are loaded via `next/font/google` in `layout.tsx`:

| Variable | Font | Usage |
|---|---|---|
| `--font-sans` (`--font-geist-sans`) | Geist Sans | Primary body and UI text |
| `--font-mono` (`--font-geist-mono`) | Geist Mono | Code, data, monospaced elements |
| `--font-handwriting` (`--font-caveat`) | Caveat | Decorative accent text |

### Breakpoints

Custom breakpoints defined in `@theme inline`:

```
xs:  320px   sm:  480px   md:  768px   lg:  1024px
xl: 1280px  2xl: 1440px  3xl: 1920px   4k: 2560px  5k: 3840px
```

### Custom Scrollbar

A brand-matching custom scrollbar is styled globally:
- **Width:** 10px (global), 6px (inside `<aside>` sidebars)
- **Thumb color:** `#1B4D28` (green) on light backgrounds, `rgba(255,255,255,0.2)` inside dark sidebars
- **Firefox compatible** via `scrollbar-width: thin`

### Animations

- **`.animate-marquee`** — Infinite horizontal scroll used in the partner logos / testimonials ticker (30s linear loop, pauses on hover)

---

## 8. Page Transitions

Page transitions are handled by **Framer Motion** via Next.js's `template.tsx` file pattern.

**How it works:**
- `src/app/template.tsx` — wraps every public page
- `src/app/dashboard/template.tsx` — wraps every dashboard page
- `src/app/farmer/template.tsx` — wraps every farmer page
- `src/app/admin/template.tsx` — wraps every admin page

Each `template.tsx` uses the same animation config:

```tsx
<motion.div
  initial={{ opacity: 0, y: 12, scale: 0.99 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 12, scale: 0.99 }}
  transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
>
```

This gives a smooth **fade + slight upward drift + micro-scale** on every page navigation. The cubic-bezier `[0.22, 1, 0.36, 1]` is a premium "ease-out expo" curve.

> **Important:** Unlike `layout.tsx` (which persists across routes), `template.tsx` re-mounts on every navigation, which is what triggers the animation. Do not move transition logic into `layout.tsx`.

---

## 9. User Roles & Access

The platform supports **three distinct user roles**, each with a separate portal:

| Role | Login Path | Portal Path | Access Level |
|---|---|---|---|
| `buyer` | `/login` | `/dashboard` | Can browse products, place orders, manage cart, track shipments, manage wallet |
| `farmer` | `/login` | `/farmer` | Can submit produce, view listings, manage farm settings, receive payouts |
| `admin` | `/admin/login` | `/admin/overview` | Can approve/reject listings, moderate users, view platform analytics |

**Role is set during signup** and stored in `localStorage` under `smarthub_user.role`.

**Route protection** in the current demo is handled client-side in each dashboard layout by reading `useUser()`. For production, implement middleware-based protection using Next.js `middleware.ts`.

### Dual Product View Strategy

- **Public visitors** (`/products`) see the **export showroom** — a curated, marketing-focused product catalogue with B2B specifications, seasonality calendar, and quality verification banners. No prices shown; CTAs push to sign-up.
- **Authenticated buyers** (`/dashboard/products`) see the **sourcing dashboard** — personalised product listings with live pricing, add-to-cart functionality, and order history integration.

---

## 10. Product Catalogue

### Public Showroom (`/products`)

Products are defined as a `CropDetail[]` array **directly in** `src/app/products/page.tsx`.

**Current product order (visible top to bottom in 3-column grid):**

| Position | Product | Image File | Category |
|---|---|---|---|
| 1 | Cleaned Natural Sesame Seeds | `sesame_seeds.png` | Seeds & Grains |
| 2 | Premium Sweet Dried Dates (Debino) | `dates.jpg` | Nuts & Cocoa |
| 3 | High-Grade Processed Cassava Flour | `flour.png` | Fresh & Processed |
| 4 | Premium Raw Cashew Nuts (RCN) | `cashew_nut.png` | Nuts & Cocoa |
| 5 | Organic Single-Origin Cocoa Beans | `cocoa_beans.png` | Nuts & Cocoa |
| 6 | Premium Split Dried Ginger | `ginger_spices.png` | Seeds & Grains |
| 7 | Export-Grade Hand-Selected Groundnuts | `peanuts.png` | Nuts & Cocoa |
| 8 | Fresh Premium Green Cabbages | `cabbage.jpg` | Fresh & Processed |
| 9 | Sweet Organic Seedless Watermelons | `watermelon.jpg` | Fresh & Processed |

Each product has: `name`, `scientificName`, `category`, `grade`, `moisture`, `admixture`, `defects`, `specificationKey`, `specValue`, `description`, `seasonStart`, `seasonEnd`, `packing`, `image`.

To **reorder products**, simply rearrange the objects in the `commodities` array inside `src/app/products/page.tsx`.

To **add a new product**, place its image in `public/images/products/` and add a new object to the `commodities` array.

### Dashboard Catalogue (`/dashboard/products`)

Products for the buyer dashboard are sourced from `src/lib/data/products.ts`. This is a separate dataset (currently 6 products) with additional e-commerce fields: `price`, `originalPrice`, `unit`, `stock`, `rating`, `reviewsCount`, `certification`, `sku`, `brand`, `moq`.

---

## 11. Public Assets

All static files live in `/public` and are served at the root URL.

### Key Images

| File | Used On |
|---|---|
| `hero-bg.jpg` | Landing page (`/`) hero background |
| `how-it-works-hero.jpg` | How It Works (`/how-it-works`) hero background |
| `landing-hero-drone.jpg` | Products showroom (`/products`) hero background |
| `contact-hero.jpg` | Contact page (`/contact`) hero background |
| `LOGO.jpg` | Navbar brand logo |
| `agrochain-farmers.png` | Connectivity / About sections |
| `agrochain-logistics.png` | Connectivity / About sections |
| `target-buyer.png` | Target Market section |
| `target-importer.png` | Target Market section |
| `target-processor.png` | Target Market section |
| `avatar-1.png` to `avatar-5.png` | Testimonials section |

> ⚠️ **Image caching:** Next.js caches optimised images inside `.next/cache/images`. If you replace an image file in `/public` with a new one of the same name, you **must** delete `.next` and restart the dev server to see the change. Do not rely on browser hard-refresh alone.

---

## 12. Key Components

### `Navbar` (`src/components/layout/Navbar.tsx`)
- Responsive top navigation with mobile hamburger menu
- Auth-aware: shows **Login / Sign Up** for guests; shows user avatar + role-appropriate dashboard link for authenticated users
- Active link highlighting based on current pathname

### `Toast` (`src/components/ui/Toast.tsx`)
- Global notification system using React Context
- Imported via `<ToastProvider>` in `layout.tsx`
- Usage anywhere in the app:
```tsx
const { showToast } = useToast();
showToast("Your order has been placed!", "success");
```
- Supports `"success"`, `"error"`, `"info"` variants

### `Button` (`src/components/ui/Button.tsx`)
- Accepts `className` for style overrides
- Always use this instead of raw `<button>` for consistent focus states and active scale animation

### `Hero` (`src/components/ui/Hero.tsx`)
- Full-screen landing page hero with background image, headline, and CTA buttons
- Background image: `/hero-bg.jpg`

### `Testimonials` (`src/components/ui/Testimonials.tsx`)
- Auto-scrolling marquee of customer testimonials
- Pauses on hover
- Uses `animate-marquee` CSS class

### `RevenueChart` (`src/components/dashboard/RevenueChart.tsx`)
- Recharts `LineChart` showing monthly revenue trends
- Mock data — replace with API call when backend is ready

### `Sidebar` (`src/components/dashboard/Sidebar.tsx`)
- Collapsible left sidebar for buyer dashboard
- Dark green (`#1B4D28`) background with white icons and text
- Active route highlighted

---

## 13. localStorage Keys

The app uses the following `localStorage` keys for the demo build:

| Key | Contents | Set By |
|---|---|---|
| `smarthub_user` | `UserData` JSON object (name, email, role, etc.) | `UserContext.updateUser()` |
| `smarthub_cart` | `CartItem[]` JSON array | `CartContext` |
| `smarthub_admins` | Admin user records array | `UserContext.updateUser()` (role: admin) |

To **clear all app data** in the browser, run in the console:
```javascript
localStorage.removeItem('smarthub_user');
localStorage.removeItem('smarthub_cart');
localStorage.removeItem('smarthub_admins');
```

---

## 14. Configuration Files

### `next.config.ts`

```typescript
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};
```

- `optimizePackageImports` — tree-shakes these libraries to reduce bundle size
- `remotePatterns` — whitelists Unsplash for external image usage via `next/image`

### `tsconfig.json`

- Path alias `@/*` maps to `./src/*` — always use `@/` imports, never relative paths.

### `postcss.config.mjs`

Standard Tailwind CSS v4 PostCSS config. No modifications needed.

---

## 15. Deployment

This project is optimised for **Vercel** deployment.

1. Push code to a GitHub/GitLab repository
2. Import the repo at [https://vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — no build configuration needed
4. Set environment variables in the Vercel dashboard if required

### Environment Variables

No environment variables are required for the current demo build. When integrating a backend, add to `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
```

> ⚠️ Never commit `.env.local` to version control. It is already in `.gitignore`.

---

## 16. Known Limitations (Demo Build)

| Feature | Current State | Production Plan |
|---|---|---|
| **Authentication** | Simulated via `localStorage`. Any email/password is accepted. | JWT + NextAuth.js or Supabase Auth |
| **Product data** | Static arrays in source files | PostgreSQL / MongoDB + REST API |
| **Cart** | Persisted to `localStorage` only | Server-side cart with user session |
| **Orders / Tracking** | Mock data, no real state changes | Backend order lifecycle API |
| **Wallet** | Static mock balances and transactions | Payment gateway (Paystack / Stripe) |
| **Admin moderation** | In-memory state only (resets on refresh) | Admin API with database writes |
| **Farmer submissions** | In-memory via `ProduceContext` | Form submission + database + file uploads |
| **Route protection** | Client-side `useUser()` check only | Next.js `middleware.ts` with JWT validation |

---

## 17. Roadmap

- [ ] Backend API integration (Node.js / Express / Supabase)
- [ ] Real authentication with JWT and refresh tokens (NextAuth.js)
- [ ] Payment gateway integration (Paystack for NG, Stripe for international)
- [ ] Real-time shipment tracking with WebSockets or Server-Sent Events
- [ ] Admin CMS for managing product listings and farmer onboarding
- [ ] Multi-currency pricing support
- [ ] Email notifications (Resend / SendGrid)
- [ ] Mobile app (React Native or Flutter) for farmer field agents
- [ ] Blockchain-based supply chain traceability layer

---

## 18. Contributing

1. **Fork** the repository
2. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. Make your changes — follow the existing code style (TypeScript, Tailwind utilities, no inline styles)
4. **Never commit** directly to `main`
5. Commit using conventional commits:
   ```bash
   git commit -m "feat: add farmer payout webhook handler"
   git commit -m "fix: correct sesame seeds image path on products page"
   git commit -m "chore: update README with admin panel routes"
   ```
6. Push and open a Pull Request against `main`

### Code Style Guidelines

- Use **TypeScript** — no `any` types unless absolutely unavoidable
- Use `@/` path aliases — never `../../` relative imports
- Use the `cn()` utility from `@/lib/utils` for conditional classNames
- Use the `<Button>` component — not raw `<button>` elements
- Use `<Image>` from `next/image` — not `<img>` tags
- Keep components focused — one responsibility per file
- All new pages must have a `<title>` and meta `description` for SEO

---

## License

MIT © Smarthub Agrochain
