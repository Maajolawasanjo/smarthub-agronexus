import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  getSession: vi.fn(),
  trustedOrigin: vi.fn(),
  getSettlementDTO: vi.fn(),
  getEscrowDetails: vi.fn(),
  executeEscrowRelease: vi.fn(),
  settleOrderPaymentFromGateway: vi.fn(),
  settleGatewayWalletDeposit: vi.fn(),
  executeWalletEscrowRefund: vi.fn(),
  executeGatewayCardRefund: vi.fn(),
  recordAuditEvent: vi.fn(),
  userFindUnique: vi.fn(),
  orderFindUnique: vi.fn(),
  orderUpdate: vi.fn(),
  orderUpdateMany: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentUpdate: vi.fn(),
  paymentUpdateMany: vi.fn(),
  walletFindUnique: vi.fn(),
  walletCreate: vi.fn(),
  walletUpdate: vi.fn(),
  walletUpdateMany: vi.fn(),
  walletTransactionFindUnique: vi.fn(),
  walletTransactionCreate: vi.fn(),
  walletTransactionUpdateMany: vi.fn(),
  sellerOrderUpdateMany: vi.fn(),
  inventoryUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: mock.getSession,
}));

vi.mock("@/lib/csrf", () => ({
  isTrustedMutationOrigin: mock.trustedOrigin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mock.userFindUnique },
    order: {
      findUnique: mock.orderFindUnique,
      update: mock.orderUpdate,
      updateMany: mock.orderUpdateMany,
    },
    payment: {
      findUnique: mock.paymentFindUnique,
      update: mock.paymentUpdate,
      updateMany: mock.paymentUpdateMany,
    },
    wallet: {
      findUnique: mock.walletFindUnique,
      create: mock.walletCreate,
      update: mock.walletUpdate,
      updateMany: mock.walletUpdateMany,
    },
    walletTransaction: {
      findUnique: mock.walletTransactionFindUnique,
      create: mock.walletTransactionCreate,
      updateMany: mock.walletTransactionUpdateMany,
    },
    sellerOrder: { updateMany: mock.sellerOrderUpdateMany },
    inventory: { updateMany: mock.inventoryUpdateMany },
    $transaction: mock.transaction,
  },
}));

vi.mock("@/services/wallet.service", () => ({
  WalletService: {
    getEscrowDetails: mock.getEscrowDetails,
    executeEscrowRelease: mock.executeEscrowRelease,
    settleOrderPaymentFromGateway: mock.settleOrderPaymentFromGateway,
    settleGatewayWalletDeposit: mock.settleGatewayWalletDeposit,
    executeWalletEscrowRefund: mock.executeWalletEscrowRefund,
    executeGatewayCardRefund: mock.executeGatewayCardRefund,
  },
}));

vi.mock("@/services/payment.service", () => ({
  getSettlementDTO: mock.getSettlementDTO,
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mock.recordAuditEvent,
}));

import { POST as releaseWalletEscrow } from "@/app/api/wallet/escrow/route";
import { POST as initializeFlutterwave } from "@/app/api/payments/flutterwave/initialize/route";
import { POST as flutterwaveWebhook } from "@/app/api/payments/flutterwave/webhook/route";
import { GET as getSettlement, POST as postSettlement } from "@/app/api/payments/settlement/[orderId]/route";

const ORIGIN = "https://www.smarthubagrochain.online";
let fetchMock: ReturnType<typeof vi.fn>;

function request(
  path: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = { Origin: ORIGIN }
) {
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function gatewayResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    json: async () => data,
  };
}

function gatewayVerifyPayload(txRef: string, overrides: Record<string, unknown> = {}) {
  return {
    event: "charge.completed",
    data: {
      status: "successful",
      id: 98765,
      tx_ref: txRef,
      amount: 1200,
      currency: "NGN",
      meta: {
        userId: "buyer-1",
        purpose: "ORDER_PAYMENT",
        orderId: "order-1",
        paymentId: "payment-1",
        ...overrides,
      },
    },
  };
}

function orderRecord(overrides: Record<string, any> = {}) {
  return {
    id: "order-1",
    orderNumber: "AGRO-001",
    totalAmount: 1200,
    status: "PENDING",
    buyer: { userId: "buyer-1" },
    payment: {
      id: "payment-1",
      orderId: "order-1",
      paymentMethod: "CARD",
      paymentStatus: "PENDING",
      amount: 1200,
      transactionRef: "REF-AGRO-001",
      gatewayTransactionId: null,
    },
    orderItems: [{ productId: "product-1", quantity: 1 }],
    sellerOrders: [],
    disputes: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("FLUTTERWAVE_SECRET_HASH", "test-webhook-hash");
  vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "test-api-key");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", ORIGIN);
  vi.stubEnv("NODE_ENV", "test");

  mock.getSession.mockResolvedValue({ userId: "buyer-1", role: "BUYER", email: "buyer@example.com" });
  mock.trustedOrigin.mockReturnValue(true);
  mock.getSettlementDTO.mockResolvedValue(null);
  mock.getEscrowDetails.mockResolvedValue({ orders: [] });
  mock.executeEscrowRelease.mockResolvedValue({ success: true, settledSellerOrdersCount: 1 });
  mock.settleOrderPaymentFromGateway.mockResolvedValue({ status: "SUCCESSFULLY_SETTLED" });
  mock.settleGatewayWalletDeposit.mockResolvedValue({ status: "SUCCESS" });
  mock.executeWalletEscrowRefund.mockResolvedValue({ alreadyRefunded: false });
  mock.executeGatewayCardRefund.mockResolvedValue({ gatewayRefunded: true });
  mock.recordAuditEvent.mockResolvedValue(undefined);

  mock.userFindUnique.mockResolvedValue({
    id: "buyer-1",
    email: "buyer@example.com",
    fullName: "Buyer One",
    isActive: true,
  });
  mock.orderFindUnique.mockResolvedValue(null);
  mock.orderUpdate.mockResolvedValue({ id: "order-1", status: "CANCELLED" });
  mock.orderUpdateMany.mockResolvedValue({ count: 1 });
  mock.paymentFindUnique.mockResolvedValue(null);
  mock.paymentUpdate.mockResolvedValue({ id: "payment-1", paymentStatus: "REFUNDED" });
  mock.paymentUpdateMany.mockResolvedValue({ count: 1 });
  mock.walletFindUnique.mockResolvedValue(null);
  mock.walletCreate.mockResolvedValue({ id: "wallet-1", userId: "buyer-1", balance: 0, escrow: 0 });
  mock.walletUpdate.mockResolvedValue({ id: "wallet-1" });
  mock.walletUpdateMany.mockResolvedValue({ count: 1 });
  mock.walletTransactionFindUnique.mockResolvedValue(null);
  mock.walletTransactionCreate.mockResolvedValue({ id: "wallet-tx-1" });
  mock.walletTransactionUpdateMany.mockResolvedValue({ count: 1 });
  mock.sellerOrderUpdateMany.mockResolvedValue({ count: 1 });
  mock.inventoryUpdateMany.mockResolvedValue({ count: 1 });

  const tx = {
    user: { findUnique: mock.userFindUnique },
    order: { findUnique: mock.orderFindUnique, update: mock.orderUpdate, updateMany: mock.orderUpdateMany },
    payment: { findUnique: mock.paymentFindUnique, update: mock.paymentUpdate, updateMany: mock.paymentUpdateMany },
    wallet: { findUnique: mock.walletFindUnique, create: mock.walletCreate, update: mock.walletUpdate, updateMany: mock.walletUpdateMany },
    walletTransaction: { findUnique: mock.walletTransactionFindUnique, create: mock.walletTransactionCreate, updateMany: mock.walletTransactionUpdateMany },
    sellerOrder: { updateMany: mock.sellerOrderUpdateMany },
    inventory: { updateMany: mock.inventoryUpdateMany },
  };
  mock.transaction.mockImplementation(async (arg: any) => {
    if (typeof arg === "function") return arg(tx);
    if (Array.isArray(arg)) return Promise.all(arg);
    throw new Error("Unexpected transaction shape");
  });

  vi.stubGlobal("fetch", vi.fn());
  fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("P0-C3 financial endpoint authorization and gateway intent verification", () => {
  describe("wallet escrow release", () => {
    it("rejects a different buyer before calling the settlement service", async () => {
      mock.orderFindUnique.mockResolvedValue(orderRecord({
        status: "DELIVERED",
        buyer: { userId: "another-buyer" },
        payment: { paymentStatus: "PAID" },
      }));

      const res = await releaseWalletEscrow(
        request("/api/wallet/escrow", "POST", { dbOrderId: "order-1" })
      );

      expect(res.status).toBe(403);
      expect(mock.executeEscrowRelease).not.toHaveBeenCalled();
    });

    it("rejects release before delivery even when payment is paid", async () => {
      mock.orderFindUnique.mockResolvedValue(orderRecord({
        status: "IN_TRANSIT",
        payment: { paymentStatus: "PAID" },
      }));

      const res = await releaseWalletEscrow(
        request("/api/wallet/escrow", "POST", { dbOrderId: "order-1" })
      );

      expect(res.status).toBe(409);
      expect(mock.executeEscrowRelease).not.toHaveBeenCalled();
    });

    it("rejects foreign browser origins before looking up an order", async () => {
      mock.trustedOrigin.mockReturnValue(false);

      const res = await releaseWalletEscrow(
        request("/api/wallet/escrow", "POST", { dbOrderId: "order-1" })
      );

      expect(res.status).toBe(403);
      expect(mock.orderFindUnique).not.toHaveBeenCalled();
    });

    it("freezes escrow when an active dispute exists", async () => {
      mock.orderFindUnique.mockResolvedValue(orderRecord({
        status: "DELIVERED",
        payment: { paymentStatus: "PAID" },
        disputes: [{ id: "dispute-1", status: "OPEN" }],
      }));

      const res = await releaseWalletEscrow(
        request("/api/wallet/escrow", "POST", { dbOrderId: "order-1" })
      );

      expect(res.status).toBe(409);
      expect(mock.executeEscrowRelease).not.toHaveBeenCalled();
    });

    it("releases only after owner, paid status, delivery and dispute checks pass", async () => {
      mock.orderFindUnique.mockResolvedValue(orderRecord({
        status: "DELIVERED",
        payment: { paymentStatus: "PAID" },
        disputes: [],
      }));

      const res = await releaseWalletEscrow(
        request("/api/wallet/escrow", "POST", { dbOrderId: "order-1" })
      );

      expect(res.status).toBe(200);
      expect(mock.executeEscrowRelease).toHaveBeenCalledWith("buyer-1", "order-1");
    });
  });

  describe("Flutterwave checkout initialization", () => {
    it("rejects anonymous initialization", async () => {
      mock.getSession.mockResolvedValue(null);

      const res = await initializeFlutterwave(
        request("/api/payments/flutterwave/initialize", "POST", { orderId: "order-1" })
      );

      expect(res.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects item-only checkout without a persisted order intent", async () => {
      const res = await initializeFlutterwave(
        request("/api/payments/flutterwave/initialize", "POST", {
          items: [{ productId: "product-1", quantity: 1 }],
          totalAmount: 1,
        })
      );

      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects payment initialization for another buyer's order", async () => {
      mock.orderFindUnique.mockResolvedValue(orderRecord({
        buyer: { userId: "different-buyer" },
      }));

      const res = await initializeFlutterwave(
        request("/api/payments/flutterwave/initialize", "POST", { orderId: "order-1", totalAmount: 1 })
      );

      expect(res.status).toBe(403);
      expect(mock.paymentUpdateMany).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("uses the persisted order amount rather than the client-supplied total", async () => {
      mock.orderFindUnique.mockResolvedValue(orderRecord());
      fetchMock.mockResolvedValue(gatewayResponse({ status: "success", data: { link: "https://checkout.example/pay" } }));

      const res = await initializeFlutterwave(
        request("/api/payments/flutterwave/initialize", "POST", { orderId: "order-1", totalAmount: 1 })
      );

      expect(res.status).toBe(200);
      const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(payload.amount).toBe(1200);
      expect(payload.currency).toBe("NGN");
      expect(payload.meta).toMatchObject({ userId: "buyer-1", purpose: "ORDER_PAYMENT", orderId: "order-1", paymentId: "payment-1" });
      expect(mock.paymentUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ id: "payment-1", paymentStatus: "PENDING", paymentMethod: "CARD" }),
        data: expect.objectContaining({ transactionRef: expect.stringMatching(/^AGRO-FLW-/) }),
      }));
    });

    it("creates a pending wallet funding intent before requesting the gateway link", async () => {
      mock.getSession.mockResolvedValue({ userId: "farmer-1", role: "FARMER", email: "farmer@example.com" });
      mock.userFindUnique.mockResolvedValue({
        id: "farmer-1", email: "farmer@example.com", fullName: "Farmer One", isActive: true,
      });
      mock.walletFindUnique.mockResolvedValue({ id: "wallet-farmer-1", userId: "farmer-1", balance: 0, escrow: 0 });
      fetchMock.mockResolvedValue(gatewayResponse({ status: "success", data: { link: "https://checkout.example/fund" } }));

      const res = await initializeFlutterwave(
        request("/api/payments/flutterwave/initialize", "POST", { purpose: "WALLET_FUNDING", totalAmount: 5000 })
      );

      expect(res.status).toBe(200);
      expect(mock.walletTransactionCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          walletId: "wallet-farmer-1",
          type: "DEPOSIT",
          amount: 5000,
          status: "PENDING",
          reference: expect.stringMatching(/^AGRO-FLW-/),
        }),
      }));
      const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(payload.meta).toMatchObject({ userId: "farmer-1", purpose: "WALLET_FUNDING" });
      expect(payload.meta.walletTransactionRef).toBe(payload.tx_ref);
    });
  });

  describe("Flutterwave webhook verification", () => {
    it("rejects invalid signatures without calling the gateway", async () => {
      const res = await flutterwaveWebhook(request(
        "/api/payments/flutterwave/webhook",
        "POST",
        { event: "charge.completed", data: {} },
        { "verif-hash": "attacker-value" }
      ));

      expect(res.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mock.settleOrderPaymentFromGateway).not.toHaveBeenCalled();
      expect(mock.settleGatewayWalletDeposit).not.toHaveBeenCalled();
    });

    it("fails closed when the Flutterwave API key is missing", async () => {
      vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "");

      const res = await flutterwaveWebhook(request(
        "/api/payments/flutterwave/webhook",
        "POST",
        gatewayVerifyPayload("AGRO-FLW-no-secret"),
        { "verif-hash": "test-webhook-hash" }
      ));

      expect(res.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mock.settleOrderPaymentFromGateway).not.toHaveBeenCalled();
    });

    it("rejects an amount mismatch even when the tx_ref is correct", async () => {
      const txRef = "AGRO-FLW-amount-mismatch";
      mock.paymentFindUnique.mockResolvedValue({ id: "payment-1", orderId: "order-1" });
      fetchMock.mockResolvedValue(gatewayResponse({
        status: "success",
        data: { id: 98765, status: "successful", tx_ref: txRef, amount: 1000, currency: "NGN" },
      }));

      const res = await flutterwaveWebhook(request(
        "/api/payments/flutterwave/webhook",
        "POST",
        gatewayVerifyPayload(txRef),
        { "verif-hash": "test-webhook-hash" }
      ));

      expect(res.status).toBe(400);
      expect(mock.settleOrderPaymentFromGateway).not.toHaveBeenCalled();
    });

    it("rejects verified data whose transaction reference differs from the signed callback", async () => {
      const txRef = "AGRO-FLW-callback-ref";
      mock.paymentFindUnique.mockResolvedValue({ id: "payment-1", orderId: "order-1" });
      fetchMock.mockResolvedValue(gatewayResponse({
        status: "success",
        data: { id: 98765, status: "successful", tx_ref: "another-ref", amount: 1200, currency: "NGN" },
      }));

      const res = await flutterwaveWebhook(request(
        "/api/payments/flutterwave/webhook",
        "POST",
        gatewayVerifyPayload(txRef),
        { "verif-hash": "test-webhook-hash" }
      ));

      expect(res.status).toBe(400);
      expect(mock.settleOrderPaymentFromGateway).not.toHaveBeenCalled();
    });

    it("settles only the exact pending order reference using verified amount and provider ID", async () => {
      const txRef = "AGRO-FLW-order-verified";
      mock.paymentFindUnique.mockResolvedValue({ id: "payment-1", orderId: "order-1" });
      fetchMock.mockResolvedValue(gatewayResponse({
        status: "success",
        data: { id: 98765, status: "successful", tx_ref: txRef, amount: 1200, currency: "NGN" },
      }));

      const res = await flutterwaveWebhook(request(
        "/api/payments/flutterwave/webhook",
        "POST",
        gatewayVerifyPayload(txRef),
        { "verif-hash": "test-webhook-hash" }
      ));

      expect(res.status).toBe(200);
      expect(mock.settleOrderPaymentFromGateway).toHaveBeenCalledWith("payment-1", txRef, 1200, "98765");
    });

    it("never turns an unmatched successful charge into a wallet deposit", async () => {
      const txRef = "AGRO-FLW-unmatched";
      mock.paymentFindUnique.mockResolvedValue(null);
      fetchMock.mockResolvedValue(gatewayResponse({
        status: "success",
        data: { id: 98765, status: "successful", tx_ref: txRef, amount: 1200, currency: "NGN" },
      }));

      const res = await flutterwaveWebhook(request(
        "/api/payments/flutterwave/webhook",
        "POST",
        gatewayVerifyPayload(txRef, { purpose: "ORDER_PAYMENT", walletTransactionRef: txRef }),
        { "verif-hash": "test-webhook-hash" }
      ));

      expect(res.status).toBe(404);
      expect(mock.settleGatewayWalletDeposit).not.toHaveBeenCalled();
    });

    it("settles wallet funding only against a matching persisted intent", async () => {
      const txRef = "AGRO-FLW-wallet-intent";
      mock.paymentFindUnique.mockResolvedValue(null);
      fetchMock.mockResolvedValue(gatewayResponse({
        status: "success",
        data: { id: 98765, status: "successful", tx_ref: txRef, amount: 1200, currency: "NGN" },
      }));

      const payload = gatewayVerifyPayload(txRef, {
        purpose: "WALLET_FUNDING",
        walletTransactionRef: txRef,
        userId: "buyer-1",
        orderId: undefined,
        paymentId: undefined,
      });
      const res = await flutterwaveWebhook(request(
        "/api/payments/flutterwave/webhook",
        "POST",
        payload,
        { "verif-hash": "test-webhook-hash" }
      ));

      expect(res.status).toBe(200);
      expect(mock.settleGatewayWalletDeposit).toHaveBeenCalledWith(txRef, 1200, "buyer-1");
    });
  });

  describe("settlement authorization and source-aware refunds", () => {
    it("scopes settlement reads to the authenticated viewer", async () => {
      mock.getSettlementDTO.mockResolvedValue(null);
      const res = await getSettlement(
        request("/api/payments/settlement/order-1", "GET"),
        { params: Promise.resolve({ orderId: "order-1" }) }
      );

      expect(res.status).toBe(404);
      expect(mock.getSettlementDTO).toHaveBeenCalledWith("order-1", { userId: "buyer-1", role: "BUYER" });
    });

    it("does not allow a buyer to execute a refund", async () => {
      const res = await postSettlement(
        request("/api/payments/settlement/order-1", "POST", { action: "REFUND" }),
        { params: Promise.resolve({ orderId: "order-1" }) }
      );

      expect(res.status).toBe(403);
      expect(mock.orderFindUnique).not.toHaveBeenCalled();
      expect(mock.executeWalletEscrowRefund).not.toHaveBeenCalled();
    });

    it("requires a verified gateway transaction ID before refunding a card payment", async () => {
      mock.getSession.mockResolvedValue({ userId: "admin-1", role: "ADMIN", email: "admin@example.com" });
      mock.orderFindUnique.mockResolvedValue(orderRecord({
        payment: {
          id: "payment-1",
          paymentMethod: "CARD",
          paymentStatus: "PAID",
          amount: 1200,
          transactionRef: "AGRO-FLW-ref",
          gatewayTransactionId: null,
        },
      }));

      const res = await postSettlement(
        request("/api/payments/settlement/order-1", "POST", { action: "REFUND" }),
        { params: Promise.resolve({ orderId: "order-1" }) }
      );

      expect(res.status).toBe(409);
      expect(mock.executeGatewayCardRefund).not.toHaveBeenCalled();
      expect(mock.transaction).not.toHaveBeenCalled();
    });

    it("refunds a wallet-paid pending order from escrow and persists cancellation only after success", async () => {
      mock.getSession.mockResolvedValue({ userId: "admin-1", role: "ADMIN", email: "admin@example.com" });
      mock.orderFindUnique.mockResolvedValue(orderRecord({
        payment: {
          id: "payment-1",
          paymentMethod: "WALLET",
          paymentStatus: "PAID",
          amount: 1200,
          transactionRef: "REF-AGRO-001",
          gatewayTransactionId: null,
        },
      }));

      const res = await postSettlement(
        request("/api/payments/settlement/order-1", "POST", { action: "REFUND", reason: "Stock issue" }),
        { params: Promise.resolve({ orderId: "order-1" }) }
      );

      expect(res.status).toBe(200);
      expect(mock.executeWalletEscrowRefund).toHaveBeenCalledWith("buyer-1", 1200, "order-1");
      expect(mock.orderUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "order-1", status: { in: ["PENDING", "CONFIRMED"] } },
        data: { status: "CANCELLED" },
      }));
      expect(mock.paymentUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "payment-1" },
        data: { paymentStatus: "REFUNDED" },
      }));
    });
  });
});
