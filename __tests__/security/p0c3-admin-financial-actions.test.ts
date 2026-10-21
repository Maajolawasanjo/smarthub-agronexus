import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  orderFindUnique: vi.fn(),
  transaction: vi.fn(),
  walletEscrowRefund: vi.fn(),
  gatewayCardRefund: vi.fn(),
  audit: vi.fn(),
  notifyOrderStateChange: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: mock.orderFindUnique },
    $transaction: mock.transaction,
  },
}));

vi.mock("@/lib/audit", () => ({ recordAuditEvent: mock.audit }));

vi.mock("@/services/wallet.service", () => ({
  WalletService: {
    executeWalletEscrowRefund: mock.walletEscrowRefund,
    executeGatewayCardRefund: mock.gatewayCardRefund,
    executeEscrowRelease: vi.fn(),
  },
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: mock.createNotification,
  notifyOrderStateChange: mock.notifyOrderStateChange,
}));

vi.mock("@/lib/fulfillment", () => ({
  isValidFulfillmentTransition: vi.fn(() => true),
  canReleaseEscrow: vi.fn(() => false),
  generateFulfillmentTimeline: vi.fn(() => []),
}));

import { AdminOrderService } from "@/services/admin-order.service";

function makeOrder(status: string) {
  return {
    id: "order-1",
    orderNumber: "AGRO-001",
    status,
    totalAmount: 25000,
    buyer: { userId: "buyer-1", user: { email: "buyer@example.com" } },
    shippingAddress: null,
    payment: {
      id: "payment-1",
      paymentMethod: "WALLET",
      paymentStatus: "PAID",
      amount: 25000,
    },
    orderItems: [],
  };
}

const actor = {
  orderId: "order-1",
  action: "CANCEL" as const,
  adminUserId: "admin-1",
  adminEmail: "admin@example.com",
};

describe("admin direct cancellation state gate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each(["PROCESSING", "READY_FOR_PICKUP", "IN_TRANSIT", "DELIVERED"])(
    "requires dispute arbitration for %s orders instead of refunding and restoring inventory",
    async (status) => {
      mock.orderFindUnique.mockResolvedValue(makeOrder(status));

      await expect(
        AdminOrderService.executeOrderAction(actor)
      ).rejects.toThrow("use the formal dispute workflow");

      expect(mock.walletEscrowRefund).not.toHaveBeenCalled();
      expect(mock.gatewayCardRefund).not.toHaveBeenCalled();
      expect(mock.transaction).not.toHaveBeenCalled();
      expect(mock.audit).not.toHaveBeenCalled();
    }
  );
});
