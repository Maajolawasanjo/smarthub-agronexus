import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  orderFindMany: vi.fn(),
  paymentAggregate: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  publishAgroEvent: vi.fn(),
  executeEscrowRelease: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findMany: mock.orderFindMany },
    payment: { aggregate: mock.paymentAggregate },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: mock.info, error: mock.error },
}));

vi.mock("@/lib/events", () => ({
  publishAgroEvent: mock.publishAgroEvent,
}));

vi.mock("@/lib/config", () => ({
  config: { timeouts: { orderAutoCompletionDays: 7 } },
}));

vi.mock("@/services/wallet.service", () => ({
  WalletService: { executeEscrowRelease: mock.executeEscrowRelease },
}));

import { runAutoCompleteDeliveredOrdersJob } from "@/jobs";

const oldDeliveredOrder = {
  id: "order-delivered-1",
  orderNumber: "AGRO-AUTO-001",
  totalAmount: 25000,
  status: "DELIVERED",
  buyer: { userId: "buyer-1" },
  payment: { id: "payment-1", paymentStatus: "PAID" },
  delivery: { deliveryStatus: "DELIVERED" },
};

describe("automatic completion must be backed by escrow settlement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mock.orderFindMany.mockResolvedValue([oldDeliveredOrder]);
    mock.executeEscrowRelease.mockResolvedValue({
      success: true,
      settledSellerOrdersCount: 1,
      totalEscrowReleased: 25000,
    });
    mock.publishAgroEvent.mockResolvedValue(undefined);
    mock.paymentAggregate.mockResolvedValue({ _sum: { amount: 0 } });
  });

  it("filters for paid, delivered orders without active disputes and delegates the release to WalletService", async () => {
    const result = await runAutoCompleteDeliveredOrdersJob();

    expect(mock.orderFindMany).toHaveBeenCalledWith({
      where: {
        status: "DELIVERED",
        updatedAt: expect.objectContaining({ lte: expect.any(Date) }),
        payment: { is: { paymentStatus: "PAID" } },
        disputes: { none: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
      },
      include: { buyer: true, payment: true, delivery: true },
    });
    expect(mock.executeEscrowRelease).toHaveBeenCalledTimes(1);
    expect(mock.executeEscrowRelease).toHaveBeenCalledWith("buyer-1", "order-delivered-1");
    expect(mock.publishAgroEvent).toHaveBeenCalledWith("ESCROW_RELEASED", {
      userId: "buyer-1",
      orderId: "order-delivered-1",
      orderNumber: "AGRO-AUTO-001",
      amount: 25000,
    });
    expect(result).toEqual({ processed: 1, completed: 1 });
  });

  it("does not publish completion or count an order when the escrow release fails", async () => {
    mock.executeEscrowRelease.mockRejectedValue(new Error("ESCROW_NOT_FUNDED"));

    const result = await runAutoCompleteDeliveredOrdersJob();

    expect(result).toEqual({ processed: 1, completed: 0 });
    expect(mock.publishAgroEvent).not.toHaveBeenCalled();
    expect(mock.error).toHaveBeenCalledWith(
      expect.stringContaining("escrow release was not confirmed"),
      expect.objectContaining({ message: "ESCROW_NOT_FUNDED" })
    );
  });

  it("does not attempt settlement when there are no eligible orders", async () => {
    mock.orderFindMany.mockResolvedValue([]);

    const result = await runAutoCompleteDeliveredOrdersJob();

    expect(result).toEqual({ processed: 0, completed: 0 });
    expect(mock.executeEscrowRelease).not.toHaveBeenCalled();
    expect(mock.publishAgroEvent).not.toHaveBeenCalled();
  });
});
