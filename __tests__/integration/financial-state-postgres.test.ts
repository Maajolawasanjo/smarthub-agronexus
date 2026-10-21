import { randomUUID } from "crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

const enabled = process.env.REAL_DB_TESTS === "1";

describe.skipIf(!enabled)("PostgreSQL financial state compare-and-set", () => {
  const suffix = randomUUID();
  let userId = "";
  let buyerProfileId = "";
  let orderId = "";
  let paymentId = "";

  afterAll(async () => {
    if (paymentId) await prisma.payment.deleteMany({ where: { id: paymentId } });
    if (orderId) await prisma.order.deleteMany({ where: { id: orderId } });
    if (buyerProfileId) await prisma.buyerProfile.deleteMany({ where: { id: buyerProfileId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("allows exactly one concurrent escrow-release or refund claim", async () => {
    const user = await prisma.user.create({
      data: {
        fullName: "Financial State CI Test",
        email: `financial-state-${suffix}@example.invalid`,
        phoneNumber: `ci-${suffix}`,
        password: "not-a-real-login-secret",
        role: "BUYER",
      },
    });
    userId = user.id;

    const buyer = await prisma.buyerProfile.create({
      data: { userId: user.id },
    });
    buyerProfileId = buyer.id;

    const order = await prisma.order.create({
      data: {
        orderNumber: `CI-FIN-STATE-${suffix}`,
        buyerId: buyer.id,
        totalAmount: 1000,
        status: "DELIVERED",
      },
    });
    orderId = order.id;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 1000,
        paymentMethod: "CARD",
        paymentStatus: "PAID",
        transactionRef: `CI-FIN-REF-${suffix}`,
        financialState: "ESCROWED",
      },
    });
    paymentId = payment.id;

    const [releaseClaim, refundClaim] = await Promise.all([
      prisma.payment.updateMany({
        where: { id: payment.id, financialState: "ESCROWED" },
        data: { financialState: "SETTLING" },
      }),
      prisma.payment.updateMany({
        where: { id: payment.id, financialState: "ESCROWED" },
        data: { financialState: "REFUNDING" },
      }),
    ]);

    expect(releaseClaim.count + refundClaim.count).toBe(1);

    const persisted = await prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
      select: { financialState: true },
    });
    expect(["SETTLING", "REFUNDING"]).toContain(persisted.financialState);

    const losingClaim = await prisma.payment.updateMany({
      where: { id: payment.id, financialState: "ESCROWED" },
      data: { financialState: releaseClaim.count === 1 ? "REFUNDING" : "SETTLING" },
    });
    expect(losingClaim.count).toBe(0);
  });
});
