import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { Role } from "@prisma/client";

export interface CreateAdminUserInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password?: string;
  role: "BUYER" | "FARMER" | "ADMIN";
  // Farmer specific
  farmName?: string;
  farmDescription?: string;
  farmAddress?: string;
  state?: string;
  lga?: string;
  // Buyer specific
  address?: string;
  // Admin audit info
  adminUserId: string;
  adminEmail: string;
  req?: Request;
}

export class AdminUserService {
  /**
   * Authoritatively creates a persistent User and associated Profile in PostgreSQL.
   * Derives admin actor identity from DB-validated session and writes an immutable audit record.
   */
  public static async createUser(input: CreateAdminUserInput) {
    const email = input.email.trim().toLowerCase();
    const phoneNumber = input.phoneNumber.trim();
    const fullName = input.fullName.trim();

    if (!fullName || !email || !phoneNumber) {
      throw new Error("Full name, email address, and phone number are required.");
    }

    // 1. Uniqueness checks
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new Error(`Email address "${email}" is already registered.`);
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber },
    });
    if (existingPhone) {
      throw new Error(`Phone number "${phoneNumber}" is already registered.`);
    }

    // 2. Secure password preparation
    const rawPassword = input.password?.trim() || crypto.randomBytes(8).toString("hex") + "A1!";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 3. Atomic multi-table insertion
    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          phoneNumber,
          password: hashedPassword,
          role: input.role as Role,
          isActive: true,
        },
      });

      // Role-specific profile initialization
      if (input.role === "FARMER") {
        await tx.farmerProfile.create({
          data: {
            userId: user.id,
            farmName: input.farmName?.trim() || `${fullName}'s Farm`,
            farmDescription: input.farmDescription?.trim() || null,
            farmAddress: input.farmAddress?.trim() || input.address?.trim() || "Farm Premises",
            state: input.state?.trim() || "Kano",
            lga: input.lga?.trim() || "Municipal",
            verificationStatus: "PENDING",
          },
        });
      } else if (input.role === "BUYER") {
        await tx.buyerProfile.create({
          data: {
            userId: user.id,
            address: input.address?.trim() || null,
            state: input.state?.trim() || null,
            lga: input.lga?.trim() || null,
          },
        });
      }

      // Initial empty wallet
      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
          escrow: 0.0,
          pendingWithdrawal: 0.0,
          frozen: 0.0,
        },
      });

      return user;
    });

    // 4. Audit Log
    await recordAuditEvent({
      category: "USER",
      severity: "INFO",
      action: "ADMIN_USER_CREATED",
      actorId: input.adminUserId,
      actorEmail: input.adminEmail,
      resourceType: "User",
      resourceId: createdUser.id,
      metadata: {
        createdUserId: createdUser.id,
        createdUserEmail: createdUser.email,
        role: createdUser.role,
      },
      req: input.req,
    });

    // 5. Sanitized response (zero credential leakage)
    return {
      id: createdUser.id,
      fullName: createdUser.fullName,
      email: createdUser.email,
      phoneNumber: createdUser.phoneNumber,
      role: createdUser.role,
      isActive: createdUser.isActive,
      createdAt: createdUser.createdAt,
    };
  }
}
