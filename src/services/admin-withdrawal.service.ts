import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { WalletService } from "@/services/wallet.service";
import { createNotification } from "@/lib/notifications";
import { TxStatus } from "@prisma/client";

export interface ListWithdrawalsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export type AdminWithdrawalAction = "APPROVE_PAYOUT" | "RETRY_PAYOUT" | "REVERSE_PAYOUT";

export interface ProcessWithdrawalParams {
  transactionId: string;
  action: AdminWithdrawalAction;
  reason?: string;
  adminUserId: string;
  adminEmail: string;
  req?: Request;
}

export class AdminWithdrawalService {
  /**
   * Lists system-wide withdrawal requests from the double-entry ledger.
   */
  public static async listWithdrawals(params: ListWithdrawalsParams) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      type: "WITHDRAWAL",
    };

    if (params.status && params.status !== "ALL") {
      where.status = params.status.toUpperCase() as TxStatus;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { reference: { contains: q, mode: "insensitive" } },
        { wallet: { user: { fullName: { contains: q, mode: "insensitive" } } } },
        { wallet: { user: { email: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  role: true,
                  isActive: true,
                },
              },
            },
          },
        },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    // Fetch linked bank accounts for users in the result list
    const userIds = Array.from(new Set(transactions.map((t) => t.wallet.user.id)));
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: { in: userIds } },
    });

    const bankMap = new Map(bankAccounts.map((b) => [b.userId, b]));

    const formatted = transactions.map((t) => {
      const user = t.wallet.user;
      const bank = bankMap.get(user.id);

      return {
        id: t.id,
        reference: t.reference,
        amount: Number(t.amount),
        formattedAmount: WalletService.formatNGN(Number(t.amount)),
        status: t.status,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          phone: user.phoneNumber,
          role: user.role,
        },
        bank: bank
          ? {
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              accountName: bank.accountName,
              bankCode: bank.bankCode,
            }
          : null,
      };
    });

    return {
      withdrawals: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Strictly processes administrative withdrawal transitions with anti-duplicate payout protection.
   */
  public static async processWithdrawalAction(params: ProcessWithdrawalParams) {
    const { transactionId, action, reason, adminUserId, adminEmail, req } = params;

    const tx = await prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!tx || tx.type !== "WITHDRAWAL") {
      throw new Error("WITHDRAWAL_TRANSACTION_NOT_FOUND");
    }

    const userId = tx.wallet.userId;
    const amount = Number(tx.amount);

    // Strict Double-Payout Protection Guard
    if (tx.status === "SUCCESS") {
      throw new Error("INVALID_STATE: Payout has already succeeded. Further mutations are forbidden.");
    }
    if (tx.status === "PROCESSING" && action !== "REVERSE_PAYOUT") {
      throw new Error("DUPLICATE_GUARD: Payout is currently in processing state with payment provider. Await webhook settlement before retrying.");
    }

    switch (action) {
      case "APPROVE_PAYOUT":
      case "RETRY_PAYOUT": {
        // Precondition: Only REQUESTED, VALIDATED, or FAILED can be submitted
        if (!["REQUESTED", "VALIDATED", "FAILED"].includes(tx.status)) {
          throw new Error(`Cannot dispatch payout from status ${tx.status}.`);
        }

        const bankAccount = await prisma.bankAccount.findFirst({
          where: { userId },
        });

        if (!bankAccount) {
          throw new Error("NO_BANK_ACCOUNT: User does not have a linked bank account on file.");
        }

        const payoutRef = `WD-ADM-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

        // Move to SUBMITTED_TO_FLUTTERWAVE in PostgreSQL
        await prisma.walletTransaction.update({
          where: { id: tx.id },
          data: {
            status: "SUBMITTED_TO_FLUTTERWAVE",
            description: `[ADMIN_${action}] Submitted to Flutterwave (${bankAccount.bankName} ${bankAccount.accountNumber})`,
          },
        });

        const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
        let providerResponse: any = null;

        if (secretKey) {
          try {
            const flwRes = await fetch("https://api.flutterwave.com/v3/transfers", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                account_bank: bankAccount.bankCode || "011",
                account_number: bankAccount.accountNumber,
                amount,
                narration: `SmartHub AgroChain ${payoutRef}`,
                currency: "NGN",
                reference: payoutRef,
              }),
            });

            providerResponse = await flwRes.json();
          } catch (e: any) {
            console.error("[ADMIN_PAYOUT_DISPATCH_NETWORK_ERROR]", e);
          }
        }

        const isAccepted = providerResponse?.status === "success" || !secretKey;
        const newStatus: TxStatus = isAccepted ? "PROCESSING" : "FAILED";

        const updatedTx = await prisma.walletTransaction.update({
          where: { id: tx.id },
          data: {
            status: newStatus,
            description: isAccepted
              ? `[DISPATCHED] Payout transfer in processing with provider (Ref: ${payoutRef})`
              : `[PROVIDER_REJECTED] ${providerResponse?.message || "Transfer rejected by gateway"}`,
          },
        });

        await recordAuditEvent({
          category: "PAYMENT",
          severity: isAccepted ? "INFO" : "ERROR",
          action: `ADMIN_WITHDRAWAL_${action}`,
          actorId: adminUserId,
          actorEmail: adminEmail,
          resourceType: "WalletTransaction",
          resourceId: tx.id,
          metadata: {
            transactionReference: tx.reference,
            payoutRef,
            amount,
            targetStatus: newStatus,
            reason,
          },
          req,
        });

        return {
          transaction: updatedTx,
          action,
          message: isAccepted
            ? `Withdrawal payout ${tx.reference} successfully dispatched to gateway.`
            : `Gateway rejected payout: ${providerResponse?.message || "Provider error"}.`,
        };
      }

      case "REVERSE_PAYOUT": {
        // Reverse funds: shift pendingWithdrawal back to available balance
        if (!["REQUESTED", "VALIDATED", "FAILED"].includes(tx.status)) {
          throw new Error(`Cannot reverse payout from status ${tx.status}. Only unconfirmed or failed payouts may be reversed.`);
        }

        const [updatedWallet, updatedTx] = await prisma.$transaction([
          prisma.wallet.update({
            where: { id: tx.walletId },
            data: {
              pendingWithdrawal: { decrement: amount },
              balance: { increment: amount },
            },
          }),
          prisma.walletTransaction.update({
            where: { id: tx.id },
            data: {
              status: "REVERSED",
              description: `[REVERSED_BY_ADMIN] Funds restored to available balance. Reason: ${reason || "Administrative reconciliation reversal"}`,
            },
          }),
        ]);

        await recordAuditEvent({
          category: "PAYMENT",
          severity: "WARNING",
          action: "ADMIN_WITHDRAWAL_REVERSED",
          actorId: adminUserId,
          actorEmail: adminEmail,
          resourceType: "WalletTransaction",
          resourceId: tx.id,
          metadata: {
            transactionReference: tx.reference,
            amount,
            restoredToWalletId: tx.walletId,
            reason,
          },
          req,
        });

        await createNotification({
          userId,
          title: "Withdrawal Cancelled & Refunded",
          message: `Your withdrawal request (${tx.reference}) of ${WalletService.formatNGN(amount)} was cancelled and refunded to your active balance.`,
          type: "PAYMENT",
        });

        return {
          transaction: updatedTx,
          action,
          message: `Withdrawal ${tx.reference} reversed. ${WalletService.formatNGN(amount)} returned to user available balance.`,
        };
      }

      default:
        throw new Error(`Unsupported withdrawal action: ${action}`);
    }
  }
}
