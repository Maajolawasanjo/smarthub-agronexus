import { prisma } from "@/lib/prisma";
import { IPaymentRepository } from "../interfaces/IPaymentRepository";

export class PrismaPaymentRepository implements IPaymentRepository {
  async findByTransactionRef(transactionRef: string) {
    return prisma.payment.findUnique({
      where: { transactionRef },
      include: { order: true },
    });
  }

  async findByOrderId(orderId: string) {
    return prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });
  }
}
