import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  getSession: vi.fn(),
  trustedOrigin: vi.fn(),
  buyerProfileFindUnique: vi.fn(),
  productFindUnique: vi.fn(),
  executeRaw: vi.fn(),
  walletFindUnique: vi.fn(),
  walletUpdateMany: vi.fn(),
  walletTransactionCreate: vi.fn(),
  orderCreate: vi.fn(),
  sellerOrderCreate: vi.fn(),
  orderItemUpdateMany: vi.fn(),
  transaction: vi.fn(),
  recordAuditEvent: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: mock.getSession }));
vi.mock("@/lib/csrf", () => ({ isTrustedMutationOrigin: mock.trustedOrigin }));
vi.mock("@/lib/audit", () => ({ recordAuditEvent: mock.recordAuditEvent }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    buyerProfile: { findUnique: mock.buyerProfileFindUnique },
    $transaction: mock.transaction,
  },
}));

import { POST as createOrder } from "@/app/api/orders/route";

describe("wallet checkout concurrent-debit guard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mock.getSession.mockResolvedValue({ userId: "buyer-1", role: "BUYER", email: "buyer@example.com" });
    mock.trustedOrigin.mockReturnValue(true);
    mock.buyerProfileFindUnique.mockResolvedValue({ id: "buyer-profile-1", userId: "buyer-1" });
    mock.productFindUnique.mockResolvedValue({
      id: "product-1",
      name: "Yam",
      price: 200,
      isAvailable: true,
      farmerProfileId: "farmer-profile-1",
      inventory: { availableQty: 10 },
    });
    mock.executeRaw.mockResolvedValue(1);
    mock.walletFindUnique.mockResolvedValue({
      id: "wallet-1",
      userId: "buyer-1",
      balance: 500,
      escrow: 0,
    });
    // Simulate a concurrent request consuming the balance after the initial read.
    mock.walletUpdateMany.mockResolvedValue({ count: 0 });
    mock.walletTransactionCreate.mockResolvedValue({ id: "ledger-1" });
    mock.orderCreate.mockResolvedValue({ id: "order-1" });
    mock.sellerOrderCreate.mockResolvedValue({ id: "seller-order-1" });
    mock.orderItemUpdateMany.mockResolvedValue({ count: 1 });

    mock.transaction.mockImplementation(async (callback: unknown) => {
      if (typeof callback !== "function") throw new Error("Expected an interactive transaction");
      return (callback as (tx: unknown) => unknown)({
        product: { findUnique: mock.productFindUnique },
        $executeRaw: mock.executeRaw,
        wallet: { findUnique: mock.walletFindUnique, updateMany: mock.walletUpdateMany },
        walletTransaction: { create: mock.walletTransactionCreate },
        order: { create: mock.orderCreate },
        sellerOrder: { create: mock.sellerOrderCreate },
        orderItem: { updateMany: mock.orderItemUpdateMany },
      });
    });
  });

  it("does not create an order or ledger entry when the conditional wallet debit loses a race", async () => {
    const req = new Request("https://www.smarthubagrochain.online/api/orders", {
      method: "POST",
      headers: {
        Origin: "https://www.smarthubagrochain.online",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ productId: "product-1", quantity: 2 }],
        paymentMethod: "WALLET",
        shippingAddress: "Lagos",
      }),
    });

    const response = await createOrder(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("INSUFFICIENT_FUNDS");
    expect(mock.walletUpdateMany).toHaveBeenCalledWith({
      where: { id: "wallet-1", balance: { gte: 400 } },
      data: {
        balance: { decrement: 400 },
        escrow: { increment: 400 },
      },
    });
    expect(mock.walletTransactionCreate).not.toHaveBeenCalled();
    expect(mock.orderCreate).not.toHaveBeenCalled();
    expect(mock.sellerOrderCreate).not.toHaveBeenCalled();
    expect(mock.recordAuditEvent).not.toHaveBeenCalled();
  });
});
