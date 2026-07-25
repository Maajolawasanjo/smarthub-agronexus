import { prisma } from "@/lib/prisma";
import { IOrderRepository } from "../interfaces/IOrderRepository";

export class PrismaOrderRepository implements IOrderRepository {
  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { include: { user: true } },
        orderItems: {
          include: {
            product: {
              include: {
                farmerProfile: true,
                category: true,
                images: true,
              },
            },
          },
        },
        payment: true,
        delivery: { include: { logisticsPartner: true } },
      },
    });
  }

  async findLatestByBuyer(buyerId: string) {
    return prisma.order.findFirst({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
