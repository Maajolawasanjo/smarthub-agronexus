import { randomUUID } from "crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { WalletService } from "@/services/wallet.service";

const enabled = process.env.REAL_DB_TESTS === "1";

describe.skipIf(!enabled)("PostgreSQL financial state compare-and-set", () => {
  const suffix = randomUUID();
  let buyerUserId = "";
  let farmerUserId = "";
  let orderId = "";
  let buyerWalletId = "";
  let farmerWalletId = "";

  afterAll(async () => {
    if (orderId) await prisma.order.deleteMany({ where: { id: orderId } });
    const walletIds = [buyerWalletId, farmerWalletId].filter(Boolean);
    if (walletIds.length) await prisma.wallet.deleteMany({ where: { id: { in: walletIds } } });
    const userIds = [buyerUserId, farmerUserId].filter(Boolean);
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("allows only one real WalletService refund or escrow release to commit", async () => {
    const buyerUser = await prisma.user.create({
      data: {
        fullName: "Financial State CI Buyer",
        email: `financial-state-buyer-${suffix}@example.invalid`,
        phoneNumber: `buyer-${suffix}`,
        password: "not-a-real-login-secret",
        role: "BUYER",
      },
    });
    buyerUserId = buyerUser.id;

    const farmerUser = await prisma.user.create({
      data: {
        fullName: "Financial State CI Farmer",
        email: `financial-state-farmer-${suffix}@example.invalid`,
        phoneNumber: `farmer-${suffix}`,
        password: "not-a-real-login-secret",
        role: "FARMER",
      },
    });
    farmerUserId = farmerUser.id;

    const buyer = await prisma.buyerProfile.create({ data: { userId: buyerUser.id } });
    const farmer = await prisma.farmerProfile.create({
      data: {
        userId: farmerUser.id,
        farmName: "Financial State Test Farm",
        farmAddress: "CI Test Address",
        state: "Lagos",
        lga: "Ikeja",
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `CI-FIN-STATE-${suffix}`,
        buyerId: buyer.id,
        totalAmount: 1000,
        status: "DELIVERED",
      },
    });
    orderId = order.id;

    const paymentReference = `CI-FIN-LOCK-${suffix}`;
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 1000,
        paymentMethod: "WALLET",
        paymentStatus: "PAID",
        transactionRef: paymentReference,
        financialState: "ESCROWED",
      },
    });

    const sellerOrder = await prisma.sellerOrder.create({
      data: {
        sellerOrderNumber: `CI-FIN-SELLER-${suffix}`,
        orderId: order.id,
        farmerProfileId: farmer.id,
        subtotal: 1000,
        shippingFee: 0,
        totalAmount: 1000,
        status: "DELIVERED",
      },
    });

    const buyerWallet = await prisma.wallet.create({
      data: { userId: buyerUser.id, balance: 0, escrow: 1000 },
    });
    buyerWalletId = buyerWallet.id;
    const farmerWallet = await prisma.wallet.create({
      data: { userId: farmerUser.id, balance: 0, escrow: 0 },
    });
    farmerWalletId = farmerWallet.id;

    await prisma.walletTransaction.create({
      data: {
        walletId: buyerWallet.id,
        type: "ESCROW_LOCK",
        amount: 1000,
        reference: paymentReference,
        description: "Isolated PostgreSQL financial state test escrow lock",
        status: "SUCCESS",
      },
    });

    // Race the production service paths, not hand-written CAS statements.
    const [release, refund] = await Promise.allSettled([
      WalletService.executeEscrowRelease(buyerUser.id, order.id),
      WalletService.executeWalletEscrowRefund(buyerUser.id, 1000, order.id),
    ]);

    const releaseWon = release.status === "fulfilled";
    const refundWon = refund.status === "fulfilled";
    expect(Number(releaseWon) + Number(refundWon)).toBe(1);

    const [persistedPayment, persistedOrder, persistedSellerOrder, persistedBuyerWallet, persistedFarmerWallet, ledger] =
      await Promise.all([
        prisma.payment.findUniqueOrThrow({ where: { orderId: order.id } }),
        prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
        prisma.sellerOrder.findUniqueOrThrow({ where: { id: sellerOrder.id } }),
        prisma.wallet.findUniqueOrThrow({ where: { id: buyerWallet.id } }),
        prisma.wallet.findUniqueOrThrow({ where: { id: farmerWallet.id } }),
        prisma.walletTransaction.findMany({
          where: { walletId: { in: [buyerWallet.id, farmerWallet.id] } },
        }),
      ]);

    expect(Number(persistedBuyerWallet.escrow)).toBe(0);

    if (releaseWon) {
      expect(persistedPayment.financialState).toBe("SETTLED");
      expect(persistedPayment.paymentStatus).toBe("PAID");
      expect(persistedOrder.status).toBe("COMPLETED");
      expect(persistedSellerOrder.status).toBe("COMPLETED");
      expect(Number(persistedBuyerWallet.balance)).toBe(0);
      expect(Number(persistedFarmerWallet.balance)).toBeCloseTo(946.25, 2);
      expect(ledger.some((entry) => entry.reference === `WALLET-REFUND-${order.id}`)).toBe(false);
      expect(ledger.some((entry) => entry.reference === `REL-${sellerOrder.sellerOrderNumber}`)).toBe(true);
      expect(ledger.some((entry) => entry.reference === `ESCROW-DRAIN-${sellerOrder.sellerOrderNumber}`)).toBe(true);
    } else {
      expect(refund.status).toBe("fulfilled");
      expect(persistedPayment.financialState).toBe("REFUNDED");
      expect(persistedPayment.paymentStatus).toBe("REFUNDED");
      expect(persistedOrder.status).toBe("DELIVERED");
      expect(persistedSellerOrder.status).toBe("DELIVERED");
      expect(Number(persistedBuyerWallet.balance)).toBe(1000);
      expect(Number(persistedFarmerWallet.balance)).toBe(0);
      expect(ledger.some((entry) => entry.reference === `WALLET-REFUND-${order.id}` && entry.status === "SUCCESS")).toBe(true);
      expect(ledger.some((entry) => entry.reference === `REL-${sellerOrder.sellerOrderNumber}`)).toBe(false);
      expect(ledger.some((entry) => entry.reference === `ESCROW-DRAIN-${sellerOrder.sellerOrderNumber}`)).toBe(false);
    }
  });
});
