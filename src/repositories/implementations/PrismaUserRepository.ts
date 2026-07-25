import { prisma } from "@/lib/prisma";
import { IUserRepository } from "../interfaces/IUserRepository";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        farmerProfile: true,
        buyerProfile: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findFarmerProfileByUserId(userId: string) {
    return prisma.farmerProfile.findUnique({
      where: { userId },
      include: { user: true, verification: true },
    });
  }

  async findBuyerProfileByUserId(userId: string) {
    return prisma.buyerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }
}
