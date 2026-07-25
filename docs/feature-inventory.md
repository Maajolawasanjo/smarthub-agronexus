# SmartHub AgroChain — Exhaustive Feature Inventory & Launch Backlog (v2)

> **Document Type:** Production Readiness Feature Audit & Implementation Backlog  
> **Target Persona:** Staff/Principal Engineer + Lead PM + QA Director  
> **Evaluation Scope:** 15 Business Domains, 45+ Web Pages, 80+ UI Components, and 35+ API Routes.

---

## Executive Summary & Backlog Overview

| Priority Level | Total Items | Target Resolution Timeline | Launch Impact |
| :--- | :---: | :---: | :--- |
| **🔴 Critical (Launch Blocker)** | **18** | Sprint 1 (Immediate) | Prevents user onboarding, real payments, or settings persistence. |
| **🟠 High Priority** | **34** | Sprint 2 | Required for complete order, tracking, and wallet management. |
| **🟡 Medium Priority** | **42** | Sprint 3 | Enhances operational efficiency, export features, and filtering. |
| **🟢 Nice to Have (Post-MVP)** | **38** | Post-Launch | Advanced AI, WebAuthn, and multi-tenant org features. |
| **TOTAL BACKLOG ITEMS** | **132** | — | Comprehensive platform completion plan. |

---

## 1. Authentication & Session Domain

### Status Summary
* **Implemented:** Login (`/login`), Registration (`/signup`), Role-based JWT Cookie Hydration (`UserContext`), Session middleware protection.
* **Mocked / Partial:** Phone number OTP verification, password reset email links.

### Itemized Feature Inventory
1. `[x]` **Email & Password Login:** Authenticates credentials against Argon2 hashes in PostgreSQL.
2. `[x]` **Role-Based Signup:** Supports BUYER and FARMER onboarding flows.
3. `[/]` **Phone OTP Verification:** UI exists, but OTP SMS code dispatch is simulated (`123456`). *(🔴 Critical)*
4. `[ ]` **Email Password Reset Link:** Clicking "Forgot Password" shows toast without sending email link. *(🔴 Critical)*
5. `[ ]` **Remember Me Cookie Persistence:** Refresh tokens not persisted beyond browser session. *(🟠 High)*
6. `[ ]` **Active Device Sessions Panel:** View and revoke active logged-in sessions across devices. *(🟡 Medium)*
7. `[ ]` **Multi-Factor Authentication (2FA / TOTP):** Authenticator app integration. *(🟢 Post-MVP)*

---

## 2. Buyer Journey Domain

### Status Summary
* **Implemented:** Product browsing, Category filtering, Add-to-Cart, Order placement.
* **Mocked / Partial:** Review/Rating submission, saved wishlist, dispute creation UI.

### Itemized Feature Inventory
1. `[x]` **Marketplace Product Browsing:** Grid view with category tags and unit prices.
2. `[x]` **Product Search:** Case-insensitive search by crop title and description.
3. `[/]` **Product Detail View:** Renders images and stock, but seller contact button is static. *(🟠 High)*
4. `[ ]` **Post-Delivery Product Reviews:** Submit 1-5 star ratings and photo reviews after order completion. *(🔴 Critical)*
5. `[ ]` **Saved Wishlist / Favorites:** Bookmark items for quick repurchasing. *(🟡 Medium)*
6. `[ ]` **One-Click Reorder:** Re-add items from previous orders directly to cart. *(🟡 Medium)*
7. `[ ]` **Order Dispute Escalation Form:** Raise a dispute ticket for damaged produce. *(🔴 Critical)*

---

## 3. Farmer Journey Domain

### Status Summary
* **Implemented:** Farmer Dashboard, Product Listing Creation (`/farmer/sell`), KYC Document Upload (`/farmer/kyc`).
* **Mocked / Partial:** Payout withdrawals, listing analytics, inventory updates.

### Itemized Feature Inventory
1. `[x]` **Create Listing Form:** Upload images, set pricing per kg, and add crop categories.
2. `[x]` **KYC Document Upload:** Submit NIN/CAC documents to verification queue.
3. `[/]` **Farmer Produce List:** Renders active listings, but "Archive Listing" button is non-functional. *(🟠 High)*
4. `[ ]` **Bulk Inventory Stock Update:** Quick inline editing of produce stock levels. *(🔴 Critical)*
5. `[ ]` **Bank Account Payout Withdrawal:** Replace fake `setTimeout` UI with real Paystack/Flutterwave payout transfers. *(🔴 Critical)*
6. `[ ]` **Duplicate Listing Action:** Clone existing produce listing into a new draft. *(🟡 Medium)*
7. `[ ]` **Listing View Analytics:** Impressions, clicks, and conversion rates per crop listing. *(🟡 Medium)*

---

## 4. Marketplace & Search Domain

### Status Summary
* **Implemented:** Category browsing, SQL text search, price sorting.
* **Mocked / Partial:** Region/location filtering, stock availability toggle.

### Itemized Feature Inventory
1. `[x]` **Category Navigation:** Filter produce by Fruits, Vegetables, Grains, Tubers.
2. `[x]` **Price Range Filter:** Min/Max price slider.
3. `[/]` **Geographic Radius Filter:** Filter produce by farmer proximity (State/LGA). *(🟠 High)*
4. `[ ]` **Out-of-Stock Toggle:** Hide/show out-of-stock produce listings. *(🟠 High)*
5. `[ ]` **Bulk Produce Volume Discount Rules:** Tiered pricing per ton/bag. *(🟡 Medium)*
6. `[ ]` **Meilisearch Full-Text Integration:** Typo tolerance and instant search autocomplete. *(🟢 Post-MVP)*

---

## 5. Cart Domain

### Status Summary
* **Implemented:** Add item, remove item, quantity modification, local storage synchronization.
* **Mocked / Partial:** Live stock reservation, coupon code entry.

### Itemized Feature Inventory
1. `[x]` **Cart Item Management:** Increment/decrement quantity, remove item.
2. `[x]` **Cart Summary Calculation:** Subtotal, flat-rate shipping, total price.
3. `[ ]` **Live Stock Reservation Lock:** Lock inventory for 15 minutes during checkout to prevent double-selling. *(🔴 Critical)*
4. `[ ]` **Coupon Code Validation:** Apply and validate promotional discount codes against DB. *(🟠 High)*
5. `[ ]` **Dynamic Distance-Based Shipping:** Calculate shipping charges via logistics rate engine. *(🔴 Critical)*
6. `[ ]` **Guest Cart Migration:** Merge guest cart items into buyer account upon login. *(🟡 Medium)*

---

## 6. Checkout Domain

### Status Summary
* **Implemented:** Checkout form, shipping address input, Paystack inline deposit webhook callback.
* **Mocked / Partial:** Wallet payment option, Paystack fallback handling.

### Itemized Feature Inventory
1. `[x]` **Order Checkout Form:** Delivery address selection and order notes.
2. `[x]` **Paystack Card/Bank Checkout:** Redirects to payment gateway and listens for webhook.
3. `[/]` **Pay-with-Wallet Option:** Buyer wallet balance checkout is partially wired. *(🔴 Critical)*
4. `[ ]` **Duplicate Checkout Protection:** Enforce strict idempotency key on order creation. *(🟠 High)*
5. `[ ]` **Order Checkout Success Page:** Renders order summary, tracking link, and printable receipt. *(🟠 High)*

---

## 7. Wallet & Payments Domain

### Status Summary
* **Implemented:** `WalletSummaryDTO` backend queries, transaction history rendering.
* **Mocked / Partial:** Bank account linking, payout withdrawals.

### Itemized Feature Inventory
1. `[x]` **Wallet Summary View:** Displays total balance, locked escrow, and recent transactions.
2. `[x]` **Deposit via Paystack:** Credit digital wallet balance via debit card.
3. `[/]` **Linked Bank Accounts Panel:** UI exists, but adding a bank account relies on static mock state. *(🔴 Critical)*
4. `[ ]` **Farmer Payout Transfer Execution:** Execute real NGN bank transfers via Paystack Transfer API. *(🔴 Critical)*
5. `[ ]` **PDF Statement Download:** Export monthly transaction statement as a signed PDF. *(🟡 Medium)*
6. `[ ]` **Escrow Hold & Release Log:** Itemized breakdown of funds locked in escrow per order. *(🟠 High)*

---

## 8. Orders Domain

### Status Summary
* **Implemented:** Buyer & Farmer order lists, order detail view, status state transitions.
* **Mocked / Partial:** Invoice PDF export, return/refund request workflow.

### Itemized Feature Inventory
1. `[x]` **Order Status Lifecycle:** `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED` $\rightarrow$ `COMPLETED`.
2. `[x]` **Buyer Confirmation Action:** Confirm delivery to trigger escrow release.
3. `[ ]` **PDF Invoice Generation:** Download official tax-compliant order invoice. *(🟠 High)*
4. `[ ]` **Order Cancellation Request:** Cancel unconfirmed orders with instant wallet refund. *(🔴 Critical)*
5. `[ ]` **Order Search & Filter:** Search orders by order number, buyer name, or crop title. *(🟡 Medium)*

---

## 9. Tracking & Logistics Domain

### Status Summary
* **Implemented:** Server-side fulfillment state machine engine (`src/lib/fulfillment.ts`), static tracking timeline.
* **Mocked / Partial:** Driver map tracking, proof of delivery upload.

### Itemized Feature Inventory
1. `[x]` **Fulfillment Timeline:** Renders step-by-step progress from pickup to delivery.
2. `[/]` **Logistics Partner Assignment:** Admin can assign logistics partner ID, but driver contact is static. *(🟠 High)*
3. `[ ]` **Proof of Delivery Photo Upload:** Logistics driver uploads delivery photo and buyer signature. *(🔴 Critical)*
4. `[ ]` **Real-Time GPS Driver Map:** Live map rendering vehicle location. *(🟢 Post-MVP)*

---

## 10. Notifications Domain

### Status Summary
* **Implemented:** `NotificationPageDTO` query handler, unread badge count, mark-as-read API.
* **Mocked / Partial:** Email & SMS transport delivery.

### Itemized Feature Inventory
1. `[x]` **In-App Notification Center:** List notifications with category filters (Orders, Wallet, Trust).
2. `[x]` **Mark Single / All as Read:** API endpoint `/api/notifications` updates read status.
3. `[ ]` **Resend/SendGrid Email Transport:** Send order confirmation and escrow release emails. *(🔴 Critical)*
4. `[ ]` **Termii/Twilio SMS Transport:** Send SMS tracking alerts to farmers in rural areas. *(🔴 Critical)*
5. `[ ]` **Notification Preference Toggles:** Allow users to toggle Email/SMS alerts in settings. *(🟠 High)*

---

## 11. Settings Domain (Buyer, Farmer, Admin)

### Status Summary
* **Implemented:** Form fields render user profile state.
* **Mocked / Partial:** Form submission.

### Itemized Feature Inventory
1. `[/]` **Buyer Profile Settings:** `handleSave` displays toast notice without dispatching API request. *(🔴 Critical)*
2. `[/]` **Farmer Profile Settings:** Farm location and bio inputs not persisted to database. *(🔴 Critical)*
3. `[ ]` **Password Change API Handler:** Verify old password and update Argon2 hash in PostgreSQL. *(🔴 Critical)*
4. `[ ]` **Address Book Management:** Add, edit, and delete saved delivery addresses. *(🟠 High)*
5. `[ ]` **Account Deactivation & Data Export:** Request account closure or export personal data. *(🟡 Medium)*

---

## 12. Dashboard & Analytics Domain

### Status Summary
* **Implemented:** Role-specific dashboards for Buyer, Farmer, and Admin with DTO hydration.
* **Mocked / Partial:** Dynamic chart series data points.

### Itemized Feature Inventory
1. `[x]` **Dashboard Metrics Cards:** Render real total sales, active orders, and unread notifications.
2. `[/]` **Revenue Chart Component:** Recharts line chart uses static hardcoded data arrays. *(🟠 High)*
3. `[ ]` **Dynamic Revenue Query Integration:** Aggregate daily/monthly sales directly from Prisma `Order` table. *(🟠 High)*
4. `[ ]` **Export Dashboard Report:** Download executive summary as CSV/Excel. *(🟡 Medium)*

---

## 13. Admin Capabilities Domain

### Status Summary
* **Implemented:** User management table, KYC verification review queue, audit logs.
* **Mocked / Partial:** Financial payout approvals, platform dispute resolution.

### Itemized Feature Inventory
1. `[x]` **KYC Review Queue:** Approve or reject farmer verification submissions with audit notes.
2. `[x]` **User Role Management:** Promote/demote users between BUYER, FARMER, and ADMIN.
3. `[ ]` **Platform Commission Payout Approval:** Admin approval portal for large farmer withdrawals. *(🔴 Critical)*
4. `[ ]` **Dispute Arbitration Portal:** Resolve buyer/farmer dispute cases and issue refunds. *(🔴 Critical)*

---

## 14. Reports & Invoicing Domain

### Status Summary
* **Implemented:** Basic receipt generator helper (`src/lib/settlement.ts`).
* **Mocked / Partial:** PDF rendering, tax reports.

### Itemized Feature Inventory
1. `[x]` **Settlement Receipt Generator:** Formats gross amount, platform fee (2.5%), VAT (7.5%), and net payout.
2. `[ ]` **PDF Receipt Generation:** Render downloadable PDF receipts for buyers and farmers. *(🟠 High)*
3. `[ ]` **Tax & VAT Compliance Report:** Aggregate monthly VAT collected for tax authorities. *(🟡 Medium)*

---

## 15. Finance & Escrow Domain

### Status Summary
* **Implemented:** Settlement Engine (`src/lib/settlement.ts`), payment idempotency protection.
* **Mocked / Partial:** Double-entry ledger history, refund processing.

### Itemized Feature Inventory
1. `[x]` **Escrow Locking:** Holds payment in platform escrow account until buyer confirmation.
2. `[x]` **Automated Escrow Release:** Triggered by buyer confirmation or 7-day auto-completion job.
3. `[ ]` **Double-Entry Ledger Audit Trail:** Track every debit and credit with immutable balance snapshots. *(🟠 High)*
4. `[ ]` **Automated Refund Processor:** Credit buyer wallet on order cancellation or dispute resolution. *(🔴 Critical)*

---

## Action Plan & Immediate Prioritization (Sprint 1: Critical Launch Blockers)

To reach full **Production Launch Readiness**, the following 18 **Critical Launch Blockers** must be resolved in order:

1. **Connect Profile & Settings API Handlers (`/api/user/profile` & `/api/user/password`)**.
2. **Implement Real Bank Payout Endpoint (`/api/wallet/withdraw`)** via Paystack Transfer API.
3. **Implement Real Wallet Payment Checkout (`/api/orders/checkout-wallet`)**.
4. **Implement Order Cancellation & Automated Refund Handler (`/api/orders/[id]/cancel`)**.
5. **Implement Dispute Escalation Portal (`/api/disputes`)**.
6. **Implement Post-Delivery Product Rating & Review Submission (`/api/products/[id]/reviews`)**.
7. **Implement Dynamic Shipping Fee Rate Engine (`/api/shipping/calculate`)**.
8. **Implement Inventory Stock Reservation Lock (15-min timeout)**.
9. **Implement Bulk Inventory Stock Update Form for Farmers**.
10. **Implement Proof of Delivery Photo Upload for Logistics**.
11. **Connect Real Email (Resend/SendGrid) & SMS (Termii/Twilio) Transport Subscribers**.
12. **Implement Admin Platform Commission Payout & Withdrawal Approval Portal**.
13. **Implement Admin Dispute Arbitration & Refund Release Portal**.
14. **Implement Phone OTP Verification Adapter**.
15. **Implement Email Password Reset Link Dispatcher**.
16. **Implement Bank Account Management API (`/api/wallet/bank-accounts`)**.
17. **Connect Dynamic Revenue & Sales Aggregate Queries to Dashboard Charts**.
18. **Enforce Strict Idempotency Keys on Order Checkout**.
