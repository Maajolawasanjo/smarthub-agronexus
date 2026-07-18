# SMARTHUB AGROCHAIN — BACKEND IMPLEMENTATION SPECIFICATION & CONTRACT

## 1. Core Architecture & Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Neon Serverless DB)
- **ORM**: Prisma 6
- **Auth**: API-based session auth with `bcrypt` (10 rounds) password hashing
- **Payments**: Escrow ledger with Paystack / Stripe webhook integration

---

## 2. Implemented Database Models (`prisma/schema.prisma`)
1. **User**: `id`, `email`, `password`, `role` (`BUYER`, `FARMER`, `ADMIN`), `createdAt`, `updatedAt`
2. **FarmerProfile**: `id`, `userId`, `farmName`, `cooperativeRegNo`, `farmAddress`, `state`, `isVerified`
3. **BuyerProfile**: `id`, `userId`, `companyName`, `cacNumber`, `country`, `isVerified`
4. **Product**: `id`, `farmerProfileId`, `categoryId`, `name`, `description`, `price`, `moq`, `unit`, `grade`, `isAvailable`
5. **Category**: `id`, `name`, `description`
6. **ProductImage**: `id`, `productId`, `url`, `isPrimary`
7. **Inventory**: `id`, `productId`, `quantity`, `location`
8. **Order**: `id`, `orderNumber`, `buyerId`, `totalAmount`, `status` (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `COMPLETED`, `CANCELLED`)
9. **OrderItem**: `id`, `orderId`, `productId`, `quantity`, `unitPrice`, `totalPrice`
10. **Payment**: `id`, `orderId`, `amount`, `paymentMethod`, `status` (`PENDING`, `COMPLETED`, `FAILED`), `transactionRef`
11. **Delivery**: `id`, `orderId`, `trackingNumber`, `carrier`, `status`
12. **Dispute**: `id`, `orderId`, `reason`, `status` (`OPEN`, `RESOLVED`, `CLOSED`)

---

## 3. Core API Endpoints Implemented

### Auth Module
- `POST /api/auth/register`: Atomic user + profile registration
- `POST /api/auth/login`: Credential validation & profile retrieval

### Produce Catalogue Module
- `GET /api/products`: Live catalog search, category filtering & pagination
- `GET /api/products/[id]`: Detailed produce metrics & inventory status
- `POST /api/farmer/produce`: Produce submission pending admin inspection
- `GET /api/farmer/produce`: Farmer's produce listings
- `PUT /api/admin/products/[id]/approve`: Quality moderation & publishing

### Orders & Escrow Module
- `POST /api/orders`: Order creation, inventory reservation & escrow initialization
- `GET /api/orders`: Order history for buyers and farmers
- `GET /api/orders/[id]`: Order detail & tracking status
- `PUT /api/orders/[id]`: Order status update & escrow release
- `POST /api/wallet/deposit`: Paystack / Stripe checkout URL generation
- `POST /api/payments/webhook`: Payment gateway HMAC signature webhook handler

### Verification, Analytics & Disputes Module
- `POST /api/kyc/upload`: Farmer/Buyer document upload & verification status
- `GET /api/analytics`: Trade volume, active farmers & platform metrics
- `POST /api/disputes` & `GET /api/disputes`: Dispute creation and arbitration
