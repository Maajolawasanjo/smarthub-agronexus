# Verified Farmer Auto-Publish & Admin Post-Moderation Suite
**Document Version:** 1.0.0  
**Target Milestone:** Phase 2 Market Execution  
**Project:** SmartHub AgroChain (`Maajolawasanjo/smarthub-agronexus`)  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Business Rationale
In agricultural commodity marketplaces handling perishable harvests, requiring manual pre-approval by a single admin for every produce listing creates an operational bottleneck. If an admin is away or unavailable:
1. Fresh produce risks spoiling before going live, prompting farmers to abandon the platform.
2. The showroom and buyer marketplace become stagnant, driving away buyers.

### Proposed Architecture: Post-Moderation Model
- **Pre-Approval Barrier (1-time)**: Initial farmer identity and farm verification (`verificationStatus === "APPROVED"`).
- **Autonomous Publishing**: Any verified farmer's produce automatically publishes directly to the showroom upon submission.
- **Admin Post-Moderation Control**: Admin retains complete lifecycle authority to **Inspect**, **Suspend**, **Reinstate**, and **Safe Delete / Archive** any product listing at any time directly from the Admin Portal.

---

## 2. Technical Architecture & Invariants

### 2.1 Produce Submission Lifecycle (`/farmer/sell` & `POST /api/farmer/produce`)
- **Farmer Profile Verification Check**:
  ```ts
  const isFarmerVerified = farmerProfile.verificationStatus === "APPROVED";
  const initialStatus = isFarmerVerified ? "APPROVED" : "PENDING_APPROVAL";
  const initialAvailability = isFarmerVerified;
  ```
- If the farmer is verified:
  - Product is saved with `status: "APPROVED"`, `isAvailable: true`.
  - Immediately discoverable by buyers via `GET /api/products`.
- If the farmer is pending verification:
  - Product is saved with `status: "PENDING_APPROVAL"`, `isAvailable: false`.
  - Displayed in farmer dashboard as "Under Verification Review".

---

### 2.2 Admin Post-Moderation Actions (`src/app/api/admin/products/[id]/approve/route.ts`)
The admin moderation API will support standard lifecycle actions:
| Action | Status | `isAvailable` | Behavior |
| :--- | :--- | :--- | :--- |
| **`APPROVE`** | `APPROVED` | `true` | Publishes pending listing to showroom |
| **`SUSPEND`** | `SUSPENDED` | `false` | Immediately removes listing from showroom; notifies farmer |
| **`REINSTATE`**| `APPROVED` | `true` | Restores suspended listing back to active showroom |
| **`REJECT`** | `REJECTED` | `false` | Marks listing as rejected with specific remarks |

#### Safe Deletion Handler (`DELETE /api/admin/products/[id]/approve`)
To protect relational data integrity and historical order records:
1. Query `prisma.orderItem.count({ where: { productId: id } })`.
2. **If `orderCount === 0` (Zero Orders)**:
   - Hard delete linked `ProductImage` records.
   - Hard delete linked `Inventory` record.
   - Hard delete `Product` record.
3. **If `orderCount > 0` (Historical Orders Exist)**:
   - Soft-delete: update `Product` with `status: "ARCHIVED"`, `isAvailable: false`.
   - Prevents foreign key constraint errors and preserves buyer order receipts and financial ledger history.
4. Record an immutable `AuditEvent` (`action: "PRODUCT_DELETED"` or `"PRODUCT_ARCHIVED"`).

---

### 2.3 Admin Portal UI Enhancements (`src/app/admin/products/page.tsx`)
1. **Filter Tabs**:
   - `All Listings`
   - `Live / Approved`
   - `Pending Review`
   - `Suspended`
   - `Rejected`
2. **Table Action Buttons**:
   - **For Live Produce**: `[Inspect]` | `[Suspend]` (yellow pause/warning icon) | `[Delete]` (red trash icon).
   - **For Suspended Produce**: `[Inspect]` | `[Reinstate]` (green check icon) | `[Delete]`.
   - **For Pending Produce**: `[Inspect]` | `[Approve]` | `[Reject]`.
3. **Inspect Quality Audit Modal**:
   - Full-fidelity display: commodity photo, inventory available, price, unit, moisture level, origin state/LGA, farmer full name, email, phone number, and verified status badge.
   - Modal action buttons allowing immediate Suspend/Reinstate/Delete directly from the modal view.

---

## 3. Files to Modify

| File Path | Description |
| :--- | :--- |
| `src/app/api/farmer/produce/route.ts` | Update product creation logic to auto-publish for verified farmers. |
| `src/app/api/admin/products/[id]/approve/route.ts` | Add SUSPEND, REINSTATE, REJECT, and safe DELETE handlers with Audit logging. |
| `src/app/admin/products/page.tsx` | Update moderation UI with status tabs, suspend/reinstate/delete actions, and upgraded inspect modal. |

---

## 4. Tomorrow's Execution Checklist
- [ ] Implement verified farmer auto-publish in `farmer/produce/route.ts`.
- [ ] Implement suspend, reinstate, and safe delete in `admin/products/[id]/approve/route.ts`.
- [ ] Implement UI buttons and filter tabs in `admin/products/page.tsx`.
- [ ] Run type-checking (`tsc --noEmit`) and Vitest test suite (`npx vitest run`).
- [ ] Run live end-to-end verification (Submit produce -> verify live on `/products` -> suspend -> verify removed -> reinstate -> delete).
- [ ] Commit and push to `main`.
