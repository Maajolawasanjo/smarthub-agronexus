import { prisma } from "@/lib/prisma";

export class PaymentRepository {
  static async findByTransactionRef(transactionRef: string) {
    return prisma.payment.findUnique({
      where: { transactionRef },
      include: { order: true },
    });
  }

  static async findByOrderId(orderId: string) {
    return prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });
  }
}
