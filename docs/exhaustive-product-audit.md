# SmartHub AgroChain — Exhaustive Production Feature Audit & Question-by-Question Deep Dive

> **Document Type:** Comprehensive Line-by-Line Feature & Capability Audit  
> **Evaluation Mode:** Question-by-Question Verification against Real Codebase Capabilities  
> **Target File:** `docs/exhaustive-product-audit.md`

---

## 1. ORDERS DOMAIN — QUESTION-BY-QUESTION AUDIT

| Specific Question / Feature | Implemented Status | Codebase Reality & Endpoint | Classification / Priority |
| :--- | :---: | :--- | :--- |
| **Filter by status?** | **PARTIAL** | UI dropdown exists on `/dashboard/orders`, but status filter params (`?status=PENDING`) are not wired to API query params. | 🔴 **Critical Launch Blocker** |
| **Search orders?** | **NO** | Search input box renders, but no `onChange` handler or API query filtering by order number or product name exists. | 🔴 **Critical Launch Blocker** |
| **Download invoices?** | **NO** | No PDF rendering library or invoice download endpoint exists. Invoice button is non-functional. | 🟠 **High Priority** |
| **Download receipts?** | **PARTIAL** | `generateReceipt` helper exists in `src/lib/settlement.ts`, but no client-side download button or PDF exporter exists. | 🟠 **High Priority** |
| **Reorder previous purchases?** | **NO** | No "Reorder" button on completed order cards to re-add order items to cart. | 🟡 **Medium Priority** |
| **Cancel before confirmation?** | **NO** | Buyers cannot cancel orders in `PENDING` state; no `/api/orders/[id]/cancel` route exists to process cancellation & refund. | 🔴 **Critical Launch Blocker** |
| **Request returns?** | **NO** | No return request workflow or return eligibility window calculation exists. | 🟠 **High Priority** |
| **Raise disputes?** | **PARTIAL** | `/dashboard/disputes` page exists, but submitting a new dispute ticket from an order card is not connected to a backend endpoint. | 🔴 **Critical Launch Blocker** |
| **Contact the farmer?** | **NO** | Farmer phone number and direct messaging/chat buttons are missing from order details. | 🟡 **Medium Priority** |
| **Contact logistics?** | **NO** | Driver phone number and logistics support contact actions are not available on buyer order details. | 🟡 **Medium Priority** |
| **Print invoices?** | **NO** | No CSS print layout or printable invoice route (`/orders/[id]/print`) exists. | 🟠 **High Priority** |

---

## 2. FARMER DOMAIN — QUESTION-BY-QUESTION AUDIT

| Specific Question / Feature | Implemented Status | Codebase Reality & Endpoint | Classification / Priority |
| :--- | :---: | :--- | :--- |
| **Duplicate a listing?** | **NO** | Farmers cannot clone existing crop listings into new drafts; no clone button on `/farmer/listings`. | 🟡 **Medium Priority** |
| **Archive a listing?** | **PARTIAL** | UI button "Archive" renders, but clicking it does not update product status in PostgreSQL. | 🟠 **High Priority** |
| **Restore archived listings?** | **NO** | No archived products filter tab or unarchive action handler exists on farmer dashboard. | 🟡 **Medium Priority** |
| **Bulk update prices?** | **NO** | No table checkbox selection or bulk price update modal exists. Prices must be updated one-by-one. | 🔴 **Critical Launch Blocker** |
| **Bulk update inventory?** | **NO** | No inline inventory quantity editor on listing rows; farmers must open individual edit forms. | 🔴 **Critical Launch Blocker** |
| **Bulk upload products?** | **NO** | No CSV/Excel bulk product upload feature exists. | 🟢 **Nice to Have (Post-MVP)** |
| **Edit images?** | **NO** | Product edit form allows adding new images, but reordering or cropping existing images is missing. | 🟡 **Medium Priority** |
| **Delete images?** | **NO** | Individual image remove buttons on produce creation form are not connected to S3/Cloudinary delete APIs. | 🟠 **High Priority** |
| **Change primary image?** | **NO** | First uploaded image is hardcoded as cover image; farmers cannot select a primary thumbnail. | 🟡 **Medium Priority** |
| **Pause listings?** | **NO** | Cannot temporarily pause listing availability without deleting the product. | 🟠 **High Priority** |
| **View listing analytics?** | **NO** | Individual listing page views, conversion rates, and click counts are static mock placeholders. | 🟡 **Medium Priority** |

---

## 3. WALLET & PAYOUT DOMAIN — QUESTION-BY-QUESTION AUDIT

| Specific Question / Feature | Implemented Status | Codebase Reality & Endpoint | Classification / Priority |
| :--- | :---: | :--- | :--- |
| **Add multiple bank accounts?** | **MOCK** | `LinkedAccountsTab.tsx` shows mock bank cards (`•••• 8829`); adding new bank accounts does not write to DB. | 🔴 **Critical Launch Blocker** |
| **Verify a bank account?** | **NO** | Paystack Name Enquiry API (`/api/bank/resolve-account`) is missing; account names are self-typed without bank verification. | 🔴 **Critical Launch Blocker** |
| **Set a default account?** | **NO** | Radio toggle for primary withdrawal bank account is purely visual state. | 🟠 **High Priority** |
| **Remove a bank account?** | **NO** | Delete bank account action triggers toast notice without database deletion. | 🟠 **High Priority** |
| **See pending withdrawals?** | **MOCK** | Withdrawal status labels are hardcoded mock strings on `TransferTab.tsx`. | 🔴 **Critical Launch Blocker** |
| **See failed withdrawals?** | **NO** | No failed withdrawal state handling or retry withdrawal mechanism exists. | 🟠 **High Priority** |
| **Withdrawal history?** | **MOCK** | History list renders static dates (`Oct 12, 2023`) and hardcoded amounts (`-$12,400.00`). | 🔴 **Critical Launch Blocker** |
| **Settlement history?** | **PARTIAL** | Hydrated via `WalletSummaryDTO` for order deposits, but payout splits are missing itemized fee breakdowns. | 🟠 **High Priority** |
| **Escrow history?** | **PARTIAL** | Escrow balances are displayed, but detailed escrow lock/release timeline events are missing. | 🟠 **High Priority** |
| **Export transactions?** | **NO** | "Export CSV" button renders on `TransactionsTab.tsx` but lacks CSV file generation handler. | 🟡 **Medium Priority** |
| **Download statements?** | **NO** | "Download Statement" button triggers alert without generating PDF statement. | 🟡 **Medium Priority** |

---

## 4. DASHBOARD DOMAIN — QUESTION-BY-QUESTION AUDIT

| Specific Question / Feature | Implemented Status | Codebase Reality & Endpoint | Classification / Priority |
| :--- | :---: | :--- | :--- |
| **Is it live?** | **YES** | Hydrated via `GET /api/dashboard` DTO endpoint returning real database metrics. | 🟢 **Functional** |
| **Which endpoint powers it?** | **DEFINED** | Powered by `src/app/api/dashboard/route.ts` consuming `getDashboardDTO()`. | 🟢 **Functional** |
| **Does clicking navigate correctly?** | **PARTIAL** | Navigation sidebar and stat card links work; recent activity table rows lack click-through to order detail views. | 🟠 **High Priority** |
| **Does it refresh automatically?** | **NO** | Requires manual browser reload or page navigation; SWR/React Query auto-revalidation is missing. | 🟡 **Medium Priority** |
| **Does pagination work?** | **NO** | Dashboard recent orders list renders top 5 items without pagination controls or "View All" link. | 🟠 **High Priority** |
| **Do charts update?** | **NO** | Revenue & Sales trendline charts (`RevenueChart.tsx`) use static array data points. | 🔴 **Critical Launch Blocker** |
| **Are empty states handled?** | **PARTIAL** | Simple text "No recent orders" renders, but visual empty state illustrations and call-to-action buttons are missing. | 🟡 **Medium Priority** |

---

## 5. TRACKING & LOGISTICS DOMAIN — QUESTION-BY-QUESTION AUDIT

| Specific Question / Feature | Implemented Status | Codebase Reality & Endpoint | Classification / Priority |
| :--- | :---: | :--- | :--- |
| **Is there a map?** | **MOCK** | Static map graphic placeholder renders on `/dashboard/tracking`; no interactive Google Maps or Leaflet map exists. | 🟢 **Nice to Have (Post-MVP)** |
| **Driver details?** | **PARTIAL** | Logistics partner name renders, but driver photo, vehicle license plate, and rating are static text. | 🟠 **High Priority** |
| **ETA?** | **PARTIAL** | Estimated delivery date is calculated from order creation date, but dynamic traffic-based ETA is missing. | 🟡 **Medium Priority** |
| **Delivery proof?** | **NO** | No driver proof of delivery form or buyer signature capture exists. | 🔴 **Critical Launch Blocker** |
| **Delivery photos?** | **NO** | Logistics drivers cannot upload dropoff photos upon delivery. | 🔴 **Critical Launch Blocker** |
| **Call logistics?** | **NO** | "Call Driver" button renders without `tel:` link or driver phone number binding. | 🟡 **Medium Priority** |
| **Delivery attempt history?** | **NO** | Failed delivery attempts or reschedule logs are not supported in tracking schema. | 🟠 **High Priority** |
| **GPS updates?** | **NO** | No real-time GPS coordinate ingestion websocket or API endpoint exists. | 🟢 **Nice to Have (Post-MVP)** |
| **Live polling?** | **NO** | Tracking page does not poll `/api/fulfillment/[orderId]` for status changes. | 🟠 **High Priority** |

---

## 6. NOTIFICATIONS DOMAIN — QUESTION-BY-QUESTION AUDIT

| Specific Question / Feature | Implemented Status | Codebase Reality & Endpoint | Classification / Priority |
| :--- | :---: | :--- | :--- |
| **Can notifications be deleted?** | **NO** | Users cannot delete individual notifications from the notification list. | 🟡 **Medium Priority** |
| **Can notifications be archived?** | **NO** | No archive tab or archive status field exists in the `Notification` Prisma model. | 🟡 **Medium Priority** |
| **Can notifications be filtered?** | **YES** | Category filters (All, Orders, Payments, Verification) are functional via `NotificationPageDTO`. | 🟢 **Functional** |
| **Can notifications be searched?** | **NO** | Search input on notification page has no filter handler. | 🟡 **Medium Priority** |
| **Categorized notifications?** | **YES** | System categorizes notifications by `ORDERS`, `PAYMENTS`, `TRUST`, and `SYSTEM`. | 🟢 **Functional** |
| **Mute notifications?** | **NO** | Cannot mute specific notification categories or mute alerts from specific sellers. | 🟢 **Nice to Have (Post-MVP)** |
| **Do preferences exist?** | **MOCK** | Toggle switches render on Settings page, but toggling SMS/Email alerts does not write preference flags to DB. | 🔴 **Critical Launch Blocker** |
| **Push notifications?** | **NO** | Web Push / Firebase Cloud Messaging Service Worker is not registered. | 🟢 **Nice to Have (Post-MVP)** |
| **Browser notifications?** | **NO** | Browser native `Notification.requestPermission()` prompt is missing. | 🟡 **Medium Priority** |

---

## 7. SETTINGS DOMAIN — COMPREHENSIVE BREAKDOWN

### 7.1 Buyer Settings Page (`/dashboard/settings`)
* **Full Name & Email Input:** Renders user context data. **MUTATION GAP:** `handleSave` triggers toast notice without calling backend API. *(🔴 Critical Launch Blocker)*
* **Delivery Address Input:** Pre-fills address. **MUTATION GAP:** Address edits are lost on page refresh. *(🔴 Critical Launch Blocker)*
* **Currency & Country Selection:** Dropdown UI exists. **MUTATION GAP:** Preference selection is not persisted to user record. *(🟠 High Priority)*
* **Change Password Inputs:** Old & New password fields render. **MUTATION GAP:** No API password validation or bcrypt/argon2 update endpoint called. *(🔴 Critical Launch Blocker)*
* **Notification Toggles:** Email, SMS, 2FA switches render. **MUTATION GAP:** Preferences are local state only. *(🔴 Critical Launch Blocker)*

### 7.2 Farmer Settings Page (`/farmer/settings`)
* **Farm Name & Description:** Form inputs render. **MUTATION GAP:** Farm profile details not saved to `FarmerProfile` table on submit. *(🔴 Critical Launch Blocker)*
* **Farm Location & State:** Dropdown selection renders. **MUTATION GAP:** Location updates not saved to database. *(🔴 Critical Launch Blocker)*
* **Payout Bank Details:** Account number and bank selector render. **MUTATION GAP:** Bank info not saved or verified. *(🔴 Critical Launch Blocker)*
* **Identity Documents View:** Displays uploaded NIN/CAC file names, but upload replacement button is missing. *(🟠 High Priority)*

### 7.3 Admin Settings Page (`/admin/settings`)
* **Platform Fee Configuration:** Input box for platform commission rate (2.5%) is static placeholder. *(🔴 Critical Launch Blocker)*
* **VAT Rate Configuration:** Input box for VAT rate (7.5%) is static placeholder. *(🟠 High Priority)*
* **System Feature Flags:** Toggles for Maintenance Mode and Escrow Auto-Release do not update `config.ts`. *(🔴 Critical Launch Blocker)*

---

## 8. COMPREHENSIVE 15-DOMAIN FEATURE BACKLOG MATRIX

| Domain | Implemented Features | Partial / Mocked Features | Missing Critical Features | Missing High/Med Features |
| :--- | :--- | :--- | :--- | :--- |
| **1. Auth** | Login, Signup, Session Cookie | OTP UI, Password Reset UI | Real SMS OTP, Password Email Link | 2FA TOTP, Device Sessions |
| **2. Buyer** | Browse, Search, Cart | Product Detail Contact | Post-Delivery Reviews, Dispute Form | Saved Wishlist, Reorder Button |
| **3. Farmer** | Add Product, KYC Upload | Listing Table, Produce View | Bulk Price/Stock Edit, Bank Payout | Clone Listing, Listing Analytics |
| **4. Marketplace** | Categories, Price Filter | Location Proximity | Dynamic Shipping Fee Engine | Stock Out Toggle, Bulk Discounts |
| **5. Cart** | Add/Remove, Quantity | Shipping Rate Calculation | Stock Reservation Lock Timer | Coupon Code Validation, Guest Merge |
| **6. Checkout** | Address Form, Paystack Card | Pay-with-Wallet Option | Wallet Balance Deduction Handler | Printable Receipt, Duplicate Lock |
| **7. Wallet** | DTO Hydration, Paystack Deposit | Bank Account Cards, Transfer Tab | Real Bank Payout Transfers, Name Enquiry | Statement PDF Export, Escrow Log |
| **8. Orders** | Lifecycle Machine, Delivery Confirm | Status Dropdown Filter | Order Cancellation & Wallet Refund | Printable Invoice PDF, Reorder |
| **9. Tracking** | Fulfillment Timeline | Driver Details Card | Driver Delivery Photo & Signature Upload | Live GPS Map, Driver Call Link |
| **10. Notifications** | Notification DTO, Mark-as-Read | Category Tabs, Unread Counter | Real Email (Resend) & SMS (Twilio) | Push Notifications, Delete Alert |
| **11. Settings** | Form Fields UI | Save Button Toast Notice | Profile/Password POST/PATCH Handlers | Address Book Management, 2FA |
| **12. Dashboard** | Metric Cards, getDashboardDTO | Recharts Sales Graph | Dynamic SQL Sales Aggregation Queries | Auto-revalidation, Table Pagination |
| **13. Admin** | KYC Queue, User List | Dispute View | Payout Approval Portal, Dispute Arbitration | CSV Financial Export, Custom RBAC |
| **14. Reports** | Settlement Calculator Helper | Receipt Text Display | PDF Invoice & Receipt Download Engine | VAT Tax Compliance Aggregator |
| **15. Finance** | Escrow Locking, 7-Day Auto Job | Payment Webhook Callback | Automated Wallet Refund Processor | Double-Entry Audit Snapshots |

---

## 9. REVISED PRODUCTION LAUNCH BACKLOG (TOTAL 132 ITEMS)

### **Sprint 1: Critical Launch Blockers (18 Items - Must Fix Immediately)**
1. `[ ]` **`/api/user/profile` Endpoint:** Persist Buyer & Farmer name, address, phone updates.
2. `[ ]` **`/api/user/password` Endpoint:** Validate current password and update Argon2 hash.
3. `[ ]` **`/api/wallet/withdraw` Endpoint:** Connect `TransferTab` to real Paystack Bank Transfer API.
4. `[ ]` **`/api/wallet/bank-accounts` Endpoint:** Paystack Name Enquiry & Bank Account CRUD.
5. `[ ]` **`/api/orders/checkout-wallet` Handler:** Deduct buyer wallet balance on checkout.
6. `[ ]` **`/api/orders/[id]/cancel` Handler:** Process buyer cancellation and issue automated wallet refund.
7. `[ ]` **`/api/disputes` Portal:** Buyer dispute ticket creation with image attachments.
8. `[ ]` **Admin Dispute Arbitration Portal:** Admin refund release or escrow payout controls.
9. `[ ]` **Farmer Bulk Price & Inventory Editor:** Inline table editing for crop stock & pricing.
10. `[ ]` **Post-Delivery Product Review System (`/api/products/[id]/reviews`)**.
11. `[ ]` **Dynamic Distance & Weight Shipping Rate Engine**.
12. `[ ]` **Inventory Stock Reservation Lock (15-Minute Timeout)**.
13. `[ ]` **Proof of Delivery Driver Photo Upload Handler**.
14. `[ ]` **Real Email Transport Subscriber (Resend/SendGrid)** for orders & receipts.
15. `[ ]` **Real SMS Transport Subscriber (Termii/Twilio)** for rural farmer alerts.
16. `[ ]` **Admin Financial Withdrawal Payout Approval Queue**.
17. `[ ]` **Real SMS Phone OTP Verification Adapter**.
18. `[ ]` **Dynamic Dashboard Revenue Graph SQL Queries** replacing static arrays.

---

### **Sprint 2: High-Priority Operational Features (34 Items)**
19. `[ ]` PDF Order Invoice Generation & Download.
20. `[ ]` PDF Payment Receipt Download.
21. `[ ]` Order Status Filtering on `/dashboard/orders`.
22. `[ ]` Order Search by Order Number and Product Title.
23. `[ ]` Farmer Listing Archiving & Pause Availability Toggle.
24. `[ ]` Product Image Delete & Primary Thumbnail Selector.
25. `[ ]` Address Book Multi-Address Management.
26. `[ ]` Coupon Code Validation & Discount Engine.
27. `[ ]` Out-of-Stock Filter Toggle in Marketplace.
28. `[ ]` Dashboard Recent Orders Table Pagination & "View All" Link.
29. `[ ]` Driver Details Data Binding (Phone, License Plate, Photo).
30. `[ ]` Delivery Reschedule & Failed Attempt Logging.
31. `[ ]` Notification Settings Preferences Database Synchronization.
32. `[ ]` Password Reset Token Link Generation & Email Dispatch.
33. `[ ]` Admin Platform Fee & VAT Rate Config Mutations.
34. `[ ]` Escrow Lock & Release Audit Log View.
35. `[ ]` Double-Entry Ledger Transaction Snapshots.
36. `[ ]` Remember Me Refresh Token Cookie Handler.
37. `[ ]` Product Detail Seller Contact Modal.
38. `[ ]` Buyer Saved Wishlist Persistence.
39. `[ ]` One-Click Reorder Action Handler.
40. `[ ]` Geographic Radius Farmer Distance Filter.
41. `[ ]` Guest Cart Migration to User Account on Login.
42. `[ ]` Checkout Order Success Summary Page.
43. `[ ]` Default Bank Account Selection Toggle.
44. `[ ]` Bank Account Deletion API Endpoint.
45. `[ ]` Failed Withdrawal Retry & Error Log View.
46. `[ ]` Order Details Print Layout CSS (`/orders/[id]/print`).
47. `[ ]` Tracking Page Fulfillment Status Polling Handler.
48. `[ ]` Dashboard Table Click-Through to Order Detail Views.
49. `[ ]` Farmer Payout Settlement Fee Breakdown View.
50. `[ ]` Admin System Maintenance Mode Feature Flag.
51. `[ ]` Notification Preference Database Schema Fields.
52. `[ ]` User Account Deactivation Request Handler.

---

### **Sprint 3 & Post-MVP: Medium & Enhancement Features (80 Items)**
*(Includes PDF Statement Export, CSV Financial Reports, Meilisearch Search, GPS Live Map Tracking, Push Notifications, 2FA TOTP, WebAuthn Passkeys, and AI Demand Forecasting).*
