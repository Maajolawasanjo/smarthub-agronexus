# SmartHub AgroChain — End-to-End User Journey Audit & 7-Sprint Product Completion Backlog

> **Document Type:** Production Readiness End-to-End Journey & Sprint Execution Roadmap  
> **Directive:** Freeze Architecture Work. Shift 100% Focus to Product Engineering, UI Wiring, End-to-End Journeys, and Sprint Backlog Execution.  
> **Target File:** `docs/end-to-end-journey-audit.md`

---

## Executive Summary: Architecture vs. Product Completeness

| Evaluation Axis | Score | Status | Description |
| :--- | :---: | :---: | :--- |
| **Backend Architecture** | **10 / 10** | ✅ Production Ready | DTOs, Domain Services, Repositories, Event Bus, Tracing, CI/CD, OpenAPI specs. |
| **Code Quality & Typing** | **9.8 / 10** | ✅ Production Ready | Strict TypeScript, zero lint errors, centralized error handling, and response envelopes. |
| **Database & Schema Design** | **9.8 / 10** | ✅ Production Ready | Production Prisma ORM models, indexes, transactions, and migration support. |
| **Product Completeness** | **6.5 / 10** | ⚠️ Gaps Identified | UI forms, settings mutations, payout withdrawals, and filters retain mock state. |
| **End-to-End User Journey Readiness** | **6.0 / 10** | 🔴 Incomplete | Critical breaks exist in user journeys (e.g. withdrawal `setTimeout`, settings toast-only). |

---

## 1. END-TO-END BUSINESS JOURNEYS AUDIT

We evaluated the three core persona journeys step-by-step from beginning to end to identify where real users hit broken links or mock dead ends.

---

### **1.1 End-to-End Buyer Journey Audit**

```text
Step 1: Sign Up / Login ──► Step 2: Browse & Search ──► Step 3: Cart & Shipping ──► Step 4: Checkout & Payment
       (PASS - 100%)              (PARTIAL - 70%)               (PARTIAL - 75%)               (PARTIAL - 70%)
                                                                                                    │
Step 8: Product Review ◄── Step 7: Confirm Delivery ◄── Step 6: Live Tracking ◄── Step 5: Order Creation ◄┘
       (BROKEN - 0%)              (PASS - 100%)                (PARTIAL - 60%)              (PASS - 100%)
```

* **Step 1 (Registration & Login):** **PASS**. User can register as BUYER, store token cookie, and hydrate `UserContext`.
* **Step 2 (Browse & Search):** **PARTIAL**. Browsing and category filters work. **DEAD END**: Search bar typing does not execute live query filtering.
* **Step 3 (Cart & Shipping):** **PARTIAL**. Add/remove item and subtotal calculation work. **DEAD END**: Shipping fee is flat-rate; live stock reservation timer is missing.
* **Step 4 (Checkout & Payment):** **PARTIAL**. Paystack debit card checkout works. **DEAD END**: Pay-with-Wallet balance deduction is missing.
* **Step 5 (Order Creation):** **PASS**. Order is created in PostgreSQL in `PENDING` state.
* **Step 6 (Live Tracking):** **PARTIAL**. Timeline renders state transitions. **DEAD END**: Interactive GPS map and driver contact are static graphics.
* **Step 7 (Confirm Delivery):** **PASS**. Buyer can click "Confirm Delivery", triggering escrow release to farmer.
* **Step 8 (Product Review & Rating):** **BROKEN**. No review form or star rating submission exists on completed orders.

**Buyer Journey Verdict:** 🔴 **Incomplete (Broken at Search, Wallet Pay, and Post-Delivery Reviews)**.

---

### **1.2 End-to-End Farmer Journey Audit**

```text
Step 1: Sign Up / KYC ──► Step 2: Create Listing ──► Step 3: Manage Inventory ──► Step 4: Receive Order
       (PASS - 100%)             (PASS - 100%)                 (BROKEN - 20%)               (PASS - 100%)
                                                                                                  │
Step 8: Bank Withdrawal ◄── Step 7: Receive Payout ◄── Step 6: Escrow Release ◄── Step 5: Fulfill Order ◄┘
       (BROKEN - 0%)               (PASS - 100%)               (PASS - 100%)               (PASS - 100%)
```

* **Step 1 (Sign Up & KYC):** **PASS**. Farmer registers, submits NIN/CAC documents to verification queue.
* **Step 2 (Create Listing):** **PASS**. Farmer can create produce listings with title, price/kg, images, and category.
* **Step 3 (Manage Inventory):** **BROKEN**. No bulk inventory or price update table. Farmers cannot pause or archive listings cleanly.
* **Step 4 (Receive Order):** **PASS**. Order appears on farmer dashboard in `PENDING` state.
* **Step 5 (Fulfill Order):** **PASS**. Farmer can transition order to `CONFIRMED`, `PROCESSING`, and `READY_FOR_PICKUP`.
* **Step 6 (Escrow Release):** **PASS**. Upon buyer confirmation, escrow balance is released to farmer wallet.
* **Step 7 (Receive Payout):** **PASS**. Net payout (after 2.5% platform fee) is credited to farmer wallet balance.
* **Step 8 (Bank Withdrawal):** **BROKEN (CRITICAL DEAD END)**. Farmer clicks "Withdraw Funds". Form displays hardcoded `$42,850.00` balance, runs `setTimeout(1500)`, and shows toast notice. **No money is transferred to the farmer's bank account.**

**Farmer Journey Verdict:** 🔴 **Incomplete (Critical Dead End at Bank Account Payout Withdrawal)**.

---

### **1.3 End-to-End Admin Journey Audit**

```text
Step 1: Admin Login ──► Step 2: KYC Verification ──► Step 3: Platform Analytics ──► Step 4: Dispute Resolution
      (PASS - 100%)            (PASS - 100%)                (BROKEN - 30%)                (BROKEN - 20%)
```

* **Step 1 (Admin Login):** **PASS**. Authenticates admin session and hydrates admin dashboard.
* **Step 2 (KYC Verification):** **PASS**. Admin views submitted farmer identity documents and approves/rejects with notes.
* **Step 3 (Platform Analytics):** **BROKEN**. Executive revenue line charts use hardcoded static arrays (`[4000, 6000, 8000, 10000]`).
* **Step 4 (Dispute Resolution):** **BROKEN**. Admin can view dispute page, but has no controls to execute refund or release escrow.

**Admin Journey Verdict:** 🔴 **Incomplete (Broken at Analytics Data & Dispute Resolution Actions)**.

---

## 2. THE 7 PRODUCT COMPLETION SPRINTS

To achieve full production launch readiness, all development work is organized into **7 Product Completion Sprints**.

---

### **Sprint 1 — Launch Blockers (🔴 Critical)**
*Goal: Every core money flow, settings mutation, and critical backend integration works end-to-end.*

1. `[ ]` **`/api/wallet/withdraw` Endpoint:** Connect `TransferTab` to real Paystack Bank Transfer API.
2. `[ ]` **`/api/wallet/bank-accounts` Endpoint:** Paystack Name Enquiry & Bank Account CRUD operations.
3. `[ ]` **`/api/user/profile` Endpoint:** Persist Buyer & Farmer name, address, and phone updates.
4. `[ ]` **`/api/user/password` Endpoint:** Validate old password and update Argon2 hash in PostgreSQL.
5. `[ ]` **`/api/orders/checkout-wallet` Handler:** Deduct buyer wallet balance on order checkout.
6. `[ ]` **`/api/orders/[id]/cancel` Handler:** Process buyer order cancellations and issue automated wallet refunds.
7. `[ ]` **Dispute Submission Form & API (`/api/disputes`)**: Allow buyers to submit damage tickets with photos.
8. `[ ]` **Coupon Validation Engine (`/api/coupons/validate`)**: Validate discount codes against database rules.
9. `[ ]` **Distance-Based Shipping Engine (`/api/shipping/calculate`)**: Dynamic rate calculation by LGA distance and weight.
10. `[ ]` **Notification Preference Persistence**: Save email/SMS alert toggles to `User` table.

---

### **Sprint 2 — Commerce Completion**
*Goal: Complete every buyer and seller commerce user flow.*

11. `[ ]` **Order Search Handler**: Enable live text search by order number and product name on `/dashboard/orders`.
12. `[ ]` **Order Status Filter Handler**: Connect status dropdown filters (`PENDING`, `DELIVERED`, `CANCELLED`) to API queries.
13. `[ ]` **PDF Invoice Download Generator**: Generate downloadable tax-compliant PDF invoices.
14. `[ ]` **PDF Payment Receipt Download**: Render downloadable payment receipt files.
15. `[ ]` **One-Click Reorder Action**: Re-add items from previous orders directly to cart.
16. `[ ]` **Return Request Workflow**: Submit produce return claims within 48 hours of delivery.
17. `[ ]` **Contact Farmer Action Modal**: Direct contact link between buyer and farmer for active orders.
18. `[ ]` **Contact Logistics Action Modal**: Direct contact link to assigned logistics partner.
19. `[ ]` **Printable Invoice CSS Layout (`/orders/[id]/print`)**: Clean browser printing layout.
20. `[ ]` **Post-Delivery Product Rating & Review System (`/api/products/[id]/reviews`)**.

---

### **Sprint 3 — Farmer Operations**
*Goal: Provide farmers with complete daily produce management capabilities.*

21. `[ ]` **Farmer Bulk Inventory Editor**: Table UI allowing farmers to inline update crop stock in kg.
22. `[ ]` **Farmer Bulk Price Editor**: Table UI allowing farmers to update pricing per kg across multiple crops.
23. `[ ]` **Pause Listing Availability**: Temporarily hide listings without deleting them.
24. `[ ]` **Archive & Restore Listing Actions**: Move listings to archive and restore them on demand.
25. `[ ]` **Clone Listing Action**: Duplicate existing crop listings into new drafts.
26. `[ ]` **Product Image Manager**: Delete individual produce images and set primary cover thumbnail.
27. `[ ]` **Produce Listing Analytics**: Render real impression counts, clicks, and sales per listing.

---

### **Sprint 4 — Wallet & Financial Completion**
*Goal: Provide complete financial auditing, bank management, and statement exports.*

28. `[ ]` **Monthly PDF Statement Exporter**: Download signed monthly wallet statements.
29. `[ ]` **Transaction History CSV Exporter**: Export filtered transaction logs to CSV.
30. `[ ]` **Withdrawal History Audit View**: Display pending, completed, and failed bank payouts.
31. `[ ]` **Failed Withdrawal Retry Handler**: Allow farmers to retry failed payouts to corrected bank accounts.
32. `[ ]` **Escrow Lock & Release Timeline**: Detailed audit view of locked funds per order.
33. `[ ]` **Transaction Search & Filter**: Search transactions by reference number, date, or type.

---

### **Sprint 5 — Dashboard Completion**
*Goal: Replace every fake mock chart with real PostgreSQL aggregation queries.*

34. `[ ]` **Dynamic Revenue Graph Aggregation**: Replace static Recharts arrays with daily/monthly SQL queries.
35. `[ ]` **Dynamic Sales Volume Graph Aggregation**: Aggregate crop volume sold over time.
36. `[ ]` **Weekly & Monthly Trendline Metrics**: Compute real percentage growth rates.
37. `[ ]` **Top Performing Products Widget**: Query top 5 selling crops by total revenue.
38. `[ ]` **Top Performing Farmers Widget**: Query top rated farmers by completed orders.
39. `[ ]` **Dashboard Table Pagination & "View All" Navigation**.
40. `[ ]` **Empty State Illustrations & Call-to-Action Buttons** for zero-data states.

---

### **Sprint 6 — Settings Completion**
*Goal: Guarantee full Read -> Edit -> Validate -> Save -> Refresh -> Persist cycle across all roles.*

41. `[ ]` **Buyer Profile & Delivery Address Mutations**.
42. `[ ]` **Farmer Farm Name, Bio, and LGA Location Mutations**.
43. `[ ]` **Admin Platform Fee & VAT Percentage Rate Mutations**.
44. `[ ]` **Address Book Management**: Multi-address creation, edit, and deletion.
45. `[ ]` **Password Change API Validation**: Argon2 hashing & current password verification.
46. `[ ]` **Account Deactivation & Data Export Requests**.

---

### **Sprint 7 — Tracking & Logistics Completion**
*Goal: Finalize physical fulfillment proof and tracking operational capabilities.*

47. `[ ]` **Logistics Driver Details Data Binding**: Driver photo, vehicle license plate, and phone.
48. `[ ]` **Proof of Delivery Photo Upload**: Driver uploads dropoff photo and buyer signature.
49. `[ ]` **Delivery Attempt & Reschedule History Log**.
50. `[ ]` **Real-Time Fulfillment Polling**: Auto-revalidate tracking timeline status.

---

## 3. Product Engineering Definition of Done

A feature is considered **100% Complete** only when it satisfies all 6 operational conditions:

1. **DB Persistence:** All form edits mutate real records in PostgreSQL via Prisma ORM.
2. **Zero Mock Data:** No hardcoded arrays, `setTimeout` simulations, or fake balances remain.
3. **End-to-End Flow:** The user can navigate from trigger $\rightarrow$ action $\rightarrow$ feedback $\rightarrow$ refresh without dead ends.
4. **Validation & Errors:** Invalid inputs return clear domain errors via standard API envelopes.
5. **UI Revalidation:** Submitting a form automatically revalidates local state and updates DTOs.
6. **Clean Build:** `npm run build` exits with code 0.
