import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  getSession: vi.fn(),
  trustedOrigin: vi.fn(),
  orderFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  paymentUpdate: vi.fn(),
  executeEscrowRelease: vi.fn(),
  getSettlementDTO: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: mock.getSession }));
vi.mock("@/lib/csrf", () => ({ isTrustedMutationOrigin: mock.trustedOrigin }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: mock.orderFindUnique },
    user: { findUnique: mock.userFindUnique },
    payment: { update: mock.paymentUpdate },
  },
}));
vi.mock("@/services/wallet.service", () => ({
  WalletService: { executeEscrowRelease: mock.executeEscrowRelease },
}));
vi.mock("@/services/payment.service", () => ({
  getSettlementDTO: mock.getSettlementDTO,
}));

import { POST as initializeFlutterwave } from "@/app/api/payments/flutterwave/initialize/route";
import { POST as releaseWalletEscrow } from "@/app/api/wallet/escrow/route";
import { GET as getSettlement, POST as postSettlement } from "@/app/api/payments/settlement/[orderId]/route";

const buyerSession = { userId: "buyer_1", email: "buyer@example.test", role: "BUYER" as const };
const orderFixture = () => ({
  id: "order_1",
  orderNumber: "AGRO-000001",
  status: "PENDING",
  totalAmount: 1250,
  buyer: { userId: "buyer_1" },
  payment: {
    id: "payment_1",
    orderId: "order_1",
    amount: 1250,
    paymentMethod: "CARD",
    paymentStatus: "PENDING",
    transactionRef: "REF-AGRO-000001",
  },
  delivery: { deliveryStatus: "PENDING" },
  sellerOrders: [{ status: "PENDING" }],
  disputes: [],
});

function request(url: string, method: string, body?: unknown, origin = "https://www.smarthubagrochain.online") {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("P0-C3 financial endpoint authorization and payment binding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "test-gateway-secret");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.smarthubagrochain.online");
    mock.getSession.mockResolvedValue(buyerSession);
    mock.trustedOrigin.mockReturnValue(true);
    mock.orderFindUnique.mockResolvedValue(orderFixture());
    mock.userFindUnique.mockResolvedValue({ email: "buyer@example.test", fullName: "Buyer One" });
    mock.paymentUpdate.mockResolvedValue({});
    mock.executeEscrowRelease.mockResolvedValue({ success: true });
    mock.getSettlementDTO.mockResolvedValue({ orderId: "order_1" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: { link: "https://checkout.example.test/pay" } }),
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not initialize Flutterwave checkout without an authenticated session", async () => {
    mock.getSession.mockResolvedValue(null);
    const response = await initializeFlutterwave(request("https://www.smarthubagrochain.online/api/payments/flutterwave/initialize", "POST", { orderId: "order_1" }));
    expect(response.status).toBe(401);
    expect(mock.orderFindUnique).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects non-Buyer sessions and untrusted origins before reading an order", async () => {
    mock.getSession.mockResolvedValue({ ...buyerSession, role: "FARMER" });
    const roleResponse = await initializeFlutterwave(request("https://www.smarthubagrochain.online/api/payments/flutterwave/initialize", "POST", { orderId: "order_1" }));
    expect(roleResponse.status).toBe(403);
    expect(mock.orderFindUnique).not.toHaveBeenCalled();

    mock.getSession.mockResolvedValue(buyerSession);
    mock.trustedOrigin.mockReturnValue(false);
    const originResponse = await initializeFlutterwave(request("https://www.smarthubagrochain.online/api/payments/flutterwave/initialize", "POST", { orderId: "order_1" }));
    expect(originResponse.status).toBe(403);
    expect(mock.orderFindUnique).not.toHaveBeenCalled();
  });

  it("rejects item-only checkout so there is no unbound payment intent", async () => {
    const response = await initializeFlutterwave(request("https://www.smarthubagrochain.online/api/payments/flutterwave/initialize", "POST", {
      items: [{ productId: "product_1", quantity: 1 }],
      totalAmount: 1,
    }));
    expect(response.status).toBe(400);
    expect(mock.orderFindUnique).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects payment initialization for another buyer's order", async () => {
    mock.orderFindUnique.mockResolvedValue({ ...orderFixture(), buyer: { userId: "buyer_2" } });
    const response = await initializeFlutterwave(request("https://www.smarthubagrochain.online/api/payments/flutterwave/initialize", "POST", { orderId: "order_1" }));
    expect(response.status).toBe(403);
    expect(mock.paymentUpdate).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses the persisted order amount and a payment-bound reference, not the caller's total", async () => {
    const response = await initializeFlutterwave(request("https://www.smarthubagrochain.online/api/payments/flutterwave/initialize", "POST", {
      orderId: "order_1",
      totalAmount: 1,
      items: [{ productId: "untrusted_product", quantity: 999 }],
    }));
    expect(response.status).toBe(200);
    expect(mock.paymentUpdate).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: { transactionRef: "AGRO-FLW-payment_1" },
    });
    const call = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(call[1]?.body));
    expect(payload.amount).toBe(1250);
    expect(payload.tx_ref).toBe("AGRO-FLW-payment_1");
    expect(payload.meta.orderId).toBe("order_1");
    expect(payload.meta.paymentId).toBe("payment_1");
  });

  it("blocks escrow release when the order belongs to another buyer", async () => {
    mock.orderFindUnique.mockResolvedValue({ ...orderFixture(), buyer: { userId: "buyer_2" } });
    const response = await releaseWalletEscrow(request("https://www.smarthubagrochain.online/api/wallet/escrow", "POST", { dbOrderId: "order_1" }));
    expect(response.status).toBe(403);
    expect(mock.executeEscrowRelease).not.toHaveBeenCalled();
  });

  it("requires settled payment, confirmed delivery, and no active dispute before escrow release", async () => {
    mock.orderFindUnique.mockResolvedValue({ ...orderFixture(), payment: { ...orderFixture().payment, paymentStatus: "PENDING" } });
    const unpaid = await releaseWalletEscrow(request("https://www.smarthubagrochain.online/api/wallet/escrow", "POST", { dbOrderId: "order_1" }));
    expect(unpaid.status).toBe(409);
    expect(mock.executeEscrowRelease).not.toHaveBeenCalled();

    mock.orderFindUnique.mockResolvedValue({
      ...orderFixture(),
      payment: { ...orderFixture().payment, paymentStatus: "PAID" },
    });
    const undelivered = await releaseWalletEscrow(request("https://www.smarthubagrochain.online/api/wallet/escrow", "POST", { dbOrderId: "order_1" }));
    expect(undelivered.status).toBe(409);
    expect(mock.executeEscrowRelease).not.toHaveBeenCalled();

    mock.orderFindUnique.mockResolvedValue({
      ...orderFixture(),
      payment: { ...orderFixture().payment, paymentStatus: "PAID" },
      delivery: { deliveryStatus: "DELIVERED" },
      disputes: [{ status: "OPEN" }],
    });
    const disputed = await releaseWalletEscrow(request("https://www.smarthubagrochain.online/api/wallet/escrow", "POST", { dbOrderId: "order_1" }));
    expect(disputed.status).toBe(409);
    expect(mock.executeEscrowRelease).not.toHaveBeenCalled();
  });

  it("only allows an order-owning Buyer to view settlement details", async () => {
    mock.orderFindUnique.mockResolvedValue({ ...orderFixture(), buyer: { userId: "buyer_2" } });
    const response = await getSettlement(request("https://www.smarthubagrochain.online/api/payments/settlement/order_1", "GET"), {
      params: Promise.resolve({ orderId: "order_1" }),
    });
    expect(response.status).toBe(403);
    expect(mock.getSettlementDTO).not.toHaveBeenCalled();
  });

  it("does not let a Buyer execute a refund through the settlement endpoint", async () => {
    const response = await postSettlement(request("https://www.smarthubagrochain.online/api/payments/settlement/order_1", "POST", { action: "REFUND" }), {
      params: Promise.resolve({ orderId: "order_1" }),
    });
    expect(response.status).toBe(403);
    expect(mock.orderFindUnique).not.toHaveBeenCalled();
  });

  it("fails closed instead of marking an admin refund complete without a source-aware refund", async () => {
    mock.getSession.mockResolvedValue({ userId: "admin_1", email: "admin@example.test", role: "ADMIN" });
    const response = await postSettlement(request("https://www.smarthubagrochain.online/api/payments/settlement/order_1", "POST", { action: "REFUND" }), {
      params: Promise.resolve({ orderId: "order_1" }),
    });
    expect(response.status).toBe(409);
    expect(mock.paymentUpdate).not.toHaveBeenCalled();
  });
});
