import { prisma } from "@/lib/prisma";

export class OrderRepository {
  static async findById(id: string) {
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

  static async findLatestByBuyer(buyerId: string) {
    return prisma.order.findFirst({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateStatus(id: string, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
