# SmartHub AgroChain — Performance & Scalability Report

Documenting database index coverage, query latency targets, EXPLAIN ANALYZE guidelines, and caching strategy for SmartHub AgroChain production release.

---

## 1. Latency Performance Budget Targets

* **Dashboard Hydration APIs (`/api/dashboard`):** < 150ms (p95)
* **Marketplace Search & Filter APIs (`/api/products`):** < 200ms (p95)
* **Fulfillment Tracking (`/api/fulfillment/[orderId]`):** < 100ms (p95)
* **Payment Webhook Processing (`/api/payments/webhook`):** < 100ms (p95)

---

## 2. PostgreSQL Database Index Strategy

| Table | Index Columns | Query Target |
| :--- | :--- | :--- |
| `Order` | `[buyerId]`, `[status]` | Accelerated buyer dashboard & fulfillment queries |
| `Payment` | `[transactionRef]` | O(1) Idempotency lookup on webhook execution |
| `Notification` | `[userId, isRead]` | Unread notification count calculations |
| `Verification` | `[farmerProfileId]` | Instant KYC verification lookup |
| `Product` | `[categoryId, status]` | Marketplace catalog filtering |

---

## 3. Query Execution Optimization (`EXPLAIN ANALYZE`) Guidelines

When auditing high-traffic endpoints, execute:
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM "Order"
WHERE "buyerId" = 'usr_123'
ORDER BY "createdAt" DESC;
```
Ensure query execution plans perform Index Scans rather than Sequential Scans (`Seq Scan`).

---

## 4. Caching & Resilience

* **Idempotency Keys:** Short-lived transaction references cached in memory / Redis.
* **Telemetry & Tracing:** Every HTTP response returns `x-trace-id`, `x-span-id`, and `x-response-time-ms`.
