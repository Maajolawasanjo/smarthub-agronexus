import { prisma } from "@/lib/prisma";

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        farmerProfile: true,
        buyerProfile: true,
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static async findFarmerProfileByUserId(userId: string) {
    return prisma.farmerProfile.findUnique({
      where: { userId },
      include: { user: true, verification: true },
    });
  }

  static async findBuyerProfileByUserId(userId: string) {
    return prisma.buyerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }
}
