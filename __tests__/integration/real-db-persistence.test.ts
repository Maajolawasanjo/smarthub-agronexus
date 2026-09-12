/**
 * P0-5: Real PostgreSQL Persistence Integration Test
 *
 * This test connects to the live Supabase PostgreSQL database and verifies
 * that core read operations work correctly against real persisted data.
 *
 * These tests are gated behind the REAL_DB_TESTS environment variable to
 * prevent accidental execution in CI without a live database connection.
 *
 * Run with: REAL_DB_TESTS=1 npx vitest run __tests__/integration/real-db-persistence.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const REAL_DB = process.env.REAL_DB_TESTS === "1";

describe.skipIf(!REAL_DB)("P0-5: Real PostgreSQL Persistence — Live Supabase Connection", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Database connection is alive (SELECT 1)", async () => {
    const result = await prisma.$queryRaw<[{ "?column?": number }]>`SELECT 1`;
    expect(result[0]["?column?"]).toBe(1);
  });

  it("Can read from User table without error", async () => {
    const count = await prisma.user.count();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("Can read from Product table — all readable products have required fields", async () => {
    const products = await prisma.product.findMany({
      take: 10,
      select: { id: true, name: true, status: true, isAvailable: true, price: true },
    });
    for (const product of products) {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(["PENDING_APPROVAL", "APPROVED", "REJECTED"]).toContain(product.status);
    }
  });

  it("Can read from Order table — no order has a null totalAmount", async () => {
    const orders = await prisma.order.findMany({
      take: 20,
      select: { id: true, totalAmount: true, status: true },
    });
    for (const order of orders) {
      expect(order.totalAmount).not.toBeNull();
      expect(Number(order.totalAmount)).toBeGreaterThan(0);
    }
  });

  it("Can read from SellerOrder table — subtotal field is populated", async () => {
    const sellerOrders = await prisma.sellerOrder.findMany({
      take: 10,
      select: { id: true, subtotal: true, totalAmount: true, shippingFee: true, status: true },
    });
    for (const so of sellerOrders) {
      // subtotal must not be null and must be >= 0
      expect(so.subtotal).not.toBeNull();
      expect(Number(so.subtotal)).toBeGreaterThanOrEqual(0);
    }
  });

  it("Can read from Wallet table — no wallet has negative balance", async () => {
    const wallets = await prisma.wallet.findMany({
      take: 20,
      select: { id: true, balance: true, escrow: true, pendingWithdrawal: true },
    });
    for (const wallet of wallets) {
      expect(Number(wallet.balance)).toBeGreaterThanOrEqual(0);
      expect(Number(wallet.escrow)).toBeGreaterThanOrEqual(0);
      expect(Number(wallet.pendingWithdrawal)).toBeGreaterThanOrEqual(0);
    }
  });

  it("WalletTransaction records have valid TransactionType and TxStatus", async () => {
    const validTypes = ["DEPOSIT", "WITHDRAWAL", "ESCROW_LOCK", "ESCROW_RELEASE", "REFUND"];
    const validStatuses = ["REQUESTED", "VALIDATED", "SUBMITTED_TO_FLUTTERWAVE", "PROCESSING", "SUCCESS", "FAILED", "REVERSED", "PENDING"];

    const txns = await prisma.walletTransaction.findMany({
      take: 20,
      select: { id: true, type: true, status: true, amount: true },
    });
    for (const tx of txns) {
      expect(validTypes).toContain(tx.type);
      expect(validStatuses).toContain(tx.status);
      expect(Number(tx.amount)).toBeGreaterThan(0);
    }
  });
});
