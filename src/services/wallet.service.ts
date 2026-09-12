import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { evaluateTrustPolicy } from "@/lib/trust";
import { publishAgroEvent } from "@/lib/events";
import { calculateSettlement } from "@/lib/settlement";
import {
  WalletPageDTO,
  WalletBalanceDTO,
  WalletSummaryDTO,
  WalletTransactionDTO,
  LinkedBankDTO,
  FundingInstructionsDTO,
  WithdrawalLimitDTO,
} from "@/types/wallet.dto";

export class WalletService {
  /**
   * Helper to format numbers in NGN currency format (e.g. ₦52,000.00)
   */
  public static formatNGN(amount: number): string {
    return `₦${Number(amount).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Get or create a user's wallet record in PostgreSQL
   */
  public static async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0.0,
          escrow: 0.0,
        },
      });
    }

    return wallet;
  }

  /**
   * Fetches the complete WalletPageDTO representing the single source of truth
   */
  public static async getWalletPageData(userId: string): Promise<WalletPageDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: true,
        farmerProfile: { include: { verification: true } },
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const wallet = await this.getOrCreateWallet(userId);
    // buyerProfileId is null for FARMER users — guard all buyer-centric aggregations below
    const buyerProfileId = user.buyerProfile?.id ?? null;

    // 1. Calculate Balances
    // The Wallet model is the cached ledger summary.
    // Each balance column is updated atomically in prisma.$transaction by the corresponding ledger operation.
    // Read from DB fields — do NOT re-aggregate on every request.
    const walletRecord = wallet as unknown as { balance: unknown; escrow?: unknown; pendingWithdrawal?: unknown; frozen?: unknown };
    const availableBalance   = Number(walletRecord.balance);
    const escrowBalance      = Number(walletRecord.escrow           ?? 0);
    const pendingWithdrawals = Number(walletRecord.pendingWithdrawal ?? 0);
    const frozenBalance      = Number(walletRecord.frozen            ?? 0);

    const balances: WalletBalanceDTO = {
      currency: "NGN",
      availableBalance,
      formattedAvailableBalance: this.formatNGN(availableBalance),
      escrowBalance,
      formattedEscrowBalance: this.formatNGN(escrowBalance),
      frozenBalance,
      formattedFrozenBalance: this.formatNGN(frozenBalance),
      pendingWithdrawals,
      formattedPendingWithdrawals: this.formatNGN(pendingWithdrawals),
    };

    // 2. Summary Aggregations — only meaningful for BUYER users with a buyerProfile
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let monthlySpend = 0;
    let lifetimeSpend = 0;

    if (buyerProfileId) {
      const monthlySpendAgg = await prisma.order.aggregate({
        where: {
          buyerId: buyerProfileId,
          status: { in: ["DELIVERED", "COMPLETED"] },
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      });
      monthlySpend = monthlySpendAgg._sum.totalAmount ? Number(monthlySpendAgg._sum.totalAmount) : 0.0;

      const lifetimeSpendAgg = await prisma.order.aggregate({
        where: {
          buyerId: buyerProfileId,
          status: { in: ["DELIVERED", "COMPLETED"] },
        },
        _sum: { totalAmount: true },
      });
      lifetimeSpend = lifetimeSpendAgg._sum.totalAmount ? Number(lifetimeSpendAgg._sum.totalAmount) : 0.0;
    }

    const totalDepositsAgg = await prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, type: "DEPOSIT", status: "SUCCESS" },
      _sum: { amount: true },
    });
    const totalDeposits = totalDepositsAgg._sum.amount ? Number(totalDepositsAgg._sum.amount) : 0.0;

    const totalWithdrawalsAgg = await prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, type: "WITHDRAWAL", status: "SUCCESS" },
      _sum: { amount: true },
    });
    const totalWithdrawals = totalWithdrawalsAgg._sum.amount ? Number(totalWithdrawalsAgg._sum.amount) : 0.0;

    const summary: WalletSummaryDTO = {
      monthlySpend,
      formattedMonthlySpend: this.formatNGN(monthlySpend),
      lifetimeSpend,
      formattedLifetimeSpend: this.formatNGN(lifetimeSpend),
      totalDeposits,
      formattedTotalDeposits: this.formatNGN(totalDeposits),
      totalWithdrawals,
      formattedTotalWithdrawals: this.formatNGN(totalWithdrawals),
    };

    // 3. Limits & Trust Evaluation
    const trustPolicy = evaluateTrustPolicy(user.farmerProfile?.verificationStatus);
    const monthlyLimit = trustPolicy.dailyWithdrawalLimit * 30; // Scale monthly limit
    const remainingLimit = Math.max(0, monthlyLimit - monthlySpend);

    const limits: WithdrawalLimitDTO = {
      tier: trustPolicy.badge.label,
      monthlyLimit,
      formattedMonthlyLimit: this.formatNGN(monthlyLimit),
      remainingLimit,
      formattedRemainingLimit: this.formatNGN(remainingLimit),
    };

    // 4. Funding Instructions
    const fundingInstructions: FundingInstructionsDTO = {
      flutterwaveCheckoutUrl: `/api/payments/flutterwave/initialize?userId=${userId}`,
      supportedMethods: ["FLUTTERWAVE", "VIRTUAL_ACCOUNT", "USSD", "CARD"],
    };

    // 5. Linked Bank Accounts
    const dbBankAccounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    const linkedBanks: LinkedBankDTO[] = dbBankAccounts.map((b) => ({
      id: b.id,
      bankName: b.bankName,
      bankCode: b.bankCode,
      accountNumber: b.accountNumber,
      accountName: b.accountName,
      isDefault: b.isDefault,
      isVerified: b.isVerified,
    }));

    // 6. Recent Transactions
    const dbTx = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const recentTransactions: WalletTransactionDTO[] = dbTx.map((tx) => ({
      id: tx.id,
      reference: tx.reference,
      type: tx.type as WalletTransactionDTO["type"],
      amount: Number(tx.amount),
      formattedAmount: `${tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "ESCROW_RELEASE" ? "+" : "-"}${this.formatNGN(Number(tx.amount))}`,
      status: tx.status as WalletTransactionDTO["status"],
      description: tx.description || "System transaction",
      date: new Date(tx.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
      method: tx.type === "DEPOSIT" ? "Bank Transfer / Flutterwave" : "Wallet Direct",
    }));

    return {
      userId,
      balances,
      summary,
      limits,
      fundingInstructions,
      linkedBanks,
      recentTransactions,
    };
  }

  /**
   * Executes atomic wallet credit upon webhook or bank transfer confirmation
   */
  public static async executeDeposit(userId: string, amount: number, reference: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const [updatedWallet, txRecord] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount,
          reference,
          description: `Wallet funded via Bank Transfer / Webhook (${reference})`,
          status: "SUCCESS",
        },
      }),
    ]);

    await publishAgroEvent("PAYMENT_COMPLETED", {
      userId,
      amount,
      remarks: `Deposit successful ref ${reference}`,
    });

    return { updatedWallet, txRecord };
  }

  /**
   * Executes atomic wallet payment for Checkout (Debits wallet & locks escrow)
   * Ledger: ESCROW_LOCK — balance decrements, escrow increments atomically.
   */
  public static async executeWalletPayment(userId: string, amount: number, orderId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const currentBalance = Number(wallet.balance);

    if (currentBalance < amount) {
      throw new Error(`INSUFFICIENT_FUNDS: Required ${this.formatNGN(amount)}, available ${this.formatNGN(currentBalance)}`);
    }

    const txRef = `PAY-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const [updatedWallet, txRecord] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          escrow:  { increment: amount },  // ← Maintain escrow column atomically
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ESCROW_LOCK",
          amount,
          reference: txRef,
          description: `Escrow payment locked for Order #${orderId.slice(0, 8)}`,
          status: "SUCCESS",
        },
      }),
    ]);

    return { updatedWallet, txRecord };
  }

  /**
   * Executes atomic withdrawal request.
   * Ledger: WITHDRAWAL (PENDING) — balance decrements, pendingWithdrawal increments.
   * Finalised by transfer.completed webhook via handleTransferWebhook().
   */
  /**
   * Executes formal withdrawal state machine:
   * REQUESTED → VALIDATED → SUBMITTED_TO_FLUTTERWAVE → PROCESSING → SUCCESS (or FAILED → REVERSED)
   * Ledger: WITHDRAWAL — balance decrements, pendingWithdrawal increments atomically.
   */
  public static async executeWithdrawal(userId: string, amount: number, bankAccountId: string) {
    // ── 1. REQUESTED State Validation ──
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND");

    if (!user.isActive) {
      throw new Error("ACCOUNT_FROZEN: Withdrawals are disabled for suspended accounts.");
    }

    const wallet = await this.getOrCreateWallet(userId);
    const currentBalance = Number(wallet.balance);

    if (amount > currentBalance) {
      throw new Error(`INSUFFICIENT_FUNDS: Requested ${this.formatNGN(amount)} exceeds available balance of ${this.formatNGN(currentBalance)}`);
    }

    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, userId },
    });

    if (!bankAccount) {
      throw new Error("INVALID_BANK_ACCOUNT: Bank account not found or unverified.");
    }

    const txRef = `WD-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const bankDesc = `${bankAccount.bankName} (${bankAccount.accountNumber})`;

    // ── 2. VALIDATED State — Ledger lock: shift available balance → pendingWithdrawal ──
    const [updatedWallet, txRecord] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          pendingWithdrawal: { increment: amount },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAWAL",
          amount,
          reference: txRef,
          description: `[VALIDATED] Payout initiated to ${bankDesc}`,
          status: "VALIDATED",
        },
      }),
    ]);

    // ── 3. SUBMITTED_TO_FLUTTERWAVE State ──
    await prisma.walletTransaction.update({
      where: { id: txRecord.id },
      data: {
        status: "SUBMITTED_TO_FLUTTERWAVE",
        description: `[SUBMITTED] Transferred to Flutterwave API (${bankAccount.bankName})`,
      },
    });

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
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
            narration: `SmartHub AgroChain Payout ${txRef}`,
            currency: "NGN",
            reference: txRef,
          }),
        });

        const flwData = await flwRes.json();
        if (!flwRes.ok || flwData.status !== "success") {
          console.error("[FLUTTERWAVE_TRANSFER_REJECTED]", flwData);

          // ── FAILED → REVERSED State Transition ──
          await prisma.$transaction([
            prisma.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: { increment: amount },
                pendingWithdrawal: { decrement: amount },
              },
            }),
            prisma.walletTransaction.update({
              where: { id: txRecord.id },
              data: {
                status: "REVERSED",
                description: `[REVERSED] Gateway rejected: ${flwData.message || "Transfer error"}`,
              },
            }),
          ]);

          throw new Error(`BANK_TRANSFER_FAILED: ${flwData.message || "Banking payout gateway rejected transfer."}`);
        }

        // ── 4. PROCESSING State — Transfer accepted by gateway, pending webhook settlement ──
        await prisma.walletTransaction.update({
          where: { id: txRecord.id },
          data: {
            status: "PROCESSING",
            description: `[PROCESSING] Flutterwave payout pending bank settlement (ID: ${flwData.data?.id || txRef})`,
          },
        });
      } catch (err: unknown) {
        const error = err as { message?: string };
        if (error.message?.startsWith("BANK_TRANSFER_FAILED")) throw err;
        // Network / runtime exception — rollback pendingWithdrawal so funds are not trapped
        console.error("[FLUTTERWAVE_TRANSFER_EXCEP] Network exception during transfer, rolling back:", err);
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: amount },
              pendingWithdrawal: { decrement: amount },
            },
          }),
          prisma.walletTransaction.update({
            where: { id: txRecord.id },
            data: {
              status: "FAILED",
              description: `[FAILED] Network exception during Flutterwave transfer (funds restored to balance): ${(err as Error).message || "Unknown error"}`,
            },
          }),
        ]);
        throw new Error(`WITHDRAWAL_NETWORK_ERROR: Transfer attempt failed. Funds have been restored to your wallet balance.`);
      }
    } else if (process.env.NODE_ENV === "production") {
      // Production without key is a critical financial misconfiguration: restore funds and fail immediately
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: amount },
            pendingWithdrawal: { decrement: amount },
          },
        }),
        prisma.walletTransaction.update({
          where: { id: txRecord.id },
          data: {
            status: "FAILED",
            description: "[FAILED] Payout gateway unconfigured in production environment.",
          },
        }),
      ]);
      throw new Error("GATEWAY_UNCONFIGURED: Banking payout service is not configured in production.");
    } else {
      // In development/test mode without API key, set to PROCESSING with clear notice
      await prisma.walletTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: "PROCESSING",
          description: `[DEV_MODE] Mock transfer accepted without gateway key (${txRef})`,
        },
      });
    }

    await publishAgroEvent("PAYMENT_COMPLETED", {
      userId,
      amount,
      remarks: `Withdrawal submitted ref ${txRef}`,
    });

    return { updatedWallet, txRecord, transactionRef: txRef, status: "PROCESSING" };
  }

  /**
   * Processes Flutterwave Transfer Webhook callbacks (transfer.completed)
   * Enforces state machine transition to SUCCESS or REVERSED.
   */
  public static async handleTransferWebhook(txRef: string, isSuccessful: boolean, failureReason?: string) {
    const tx = await prisma.walletTransaction.findUnique({
      where: { reference: txRef },
      include: { wallet: true },
    });

    const activePendingStates = ["PENDING", "VALIDATED", "SUBMITTED_TO_FLUTTERWAVE", "PROCESSING"];

    if (!tx || tx.type !== "WITHDRAWAL" || !activePendingStates.includes(tx.status)) {
      console.log(`[TRANSFER_WEBHOOK_SKIP] Transaction ${txRef} not in an active pending state (current: ${tx?.status}).`);
      return;
    }

    const amount = Number(tx.amount);

    if (isSuccessful) {
      // ── PROCESSING → SUCCESS Transition ──
      await prisma.$transaction([
        prisma.walletTransaction.update({
          where: { id: tx.id },
          data: { status: "SUCCESS", description: `[SUCCESS] Bank transfer settled (${txRef})` },
        }),
        prisma.wallet.update({
          where: { id: tx.walletId },
          data: {
            pendingWithdrawal: { decrement: amount },
          },
        }),
      ]);
      console.log(`[TRANSFER_WEBHOOK_SUCCESS] Withdrawal ${txRef} of ₦${amount} confirmed by recipient bank.`);
    } else {
      // ── PROCESSING → REVERSED Transition ──
      await prisma.$transaction([
        prisma.walletTransaction.update({
          where: { id: tx.id },
          data: { status: "REVERSED", description: `[REVERSED] Transfer failed: ${failureReason || "Returned by bank"}` },
        }),
        prisma.wallet.update({
          where: { id: tx.walletId },
          data: {
            pendingWithdrawal: { decrement: amount },
            balance: { increment: amount },
          },
        }),
      ]);
      console.log(`[TRANSFER_WEBHOOK_REVERSED] Withdrawal ${txRef} failed. ₦${amount} restored to available balance.`);
    }
  }

  /**
   * Executes atomic order cancellation refund back to buyer wallet.
   * Ledger: REFUND — escrow decrements safely (never negative), balance increments.
   * If escrow is 0 (e.g. card order refunded as platform store credit), funds balance directly without negative escrow.
   */
  public static async executeRefund(userId: string, amount: number, orderId: string, isStoreCredit: boolean = false) {
    const wallet = await this.getOrCreateWallet(userId);
    const txRef = `REF-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const currentEscrow = Number(wallet.escrow);
    // Escrow decrement is safely clamped to available escrow so it NEVER goes negative
    const escrowDecrement = isStoreCredit ? 0 : Math.min(currentEscrow, amount);

    const orderRef = String(orderId || "").slice(0, 8);

    const [updatedWallet, txRecord] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          escrow:  { decrement: escrowDecrement },  // ← Safe release: never negative
          balance: { increment: amount },           // ← Return to buyer's available balance
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount,
          reference: txRef,
          description: escrowDecrement > 0
            ? `Refund credited for cancelled Order #${orderRef} (Escrow released: ₦${escrowDecrement})`
            : `Store credit refund for cancelled Order #${orderRef}`,
          status: "SUCCESS",
        },
      }),
    ]);

    return { updatedWallet, txRecord };
  }

  /**
   * Dedicated wallet-source refund: unlocks buyer escrow back to available balance.
   */
  public static async executeWalletEscrowRefund(userId: string, amount: number, orderId: string) {
    return this.executeRefund(userId, amount, orderId, false);
  }

  /**
   * Dedicated card/gateway refund.
   * SUCCESS path: Flutterwave refunds the card — we record the audit entry and return.
   * FAILURE path: We persist REQUIRES_MANUAL_REVIEW and throw — we NEVER mint internal wallet
   *               balance as implicit compensation for a failed card refund.
   * To explicitly grant store credit, call executeStoreCreditRefund() separately.
   */
  public static async executeGatewayCardRefund(
    userId: string,
    orderId: string,
    transactionRef: string,
    amount: number
  ) {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (secretKey && transactionRef) {
      try {
        const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionRef}/refund`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount }),
        });
        const flwData = await flwRes.json();
        if (flwRes.ok && flwData.status === "success") {
          // Gateway refund accepted — record audit ledger entry, do NOT touch wallet balance
          const wallet = await this.getOrCreateWallet(userId);
          await prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "REFUND",
              amount,
              reference: `FLW-REFUND-${transactionRef}`,
              description: `Gateway card refund processed for Order #${orderId} via Flutterwave`,
              status: "SUCCESS",
            },
          });
          console.log(`[FLUTTERWAVE_REFUND_SUCCESS] Refunded ₦${amount} to card for Order #${orderId}`);
          return { gatewayRefunded: true, transactionRef };
        }

        // Gateway returned non-success status
        const errMsg = flwData?.message || "Gateway returned non-success status";
        console.error(`[FLUTTERWAVE_REFUND_FAILED] Order #${orderId}: ${errMsg}`);
        await this.persistManualReviewFlag(userId, orderId, amount, `Gateway rejection: ${errMsg}`);
        throw new Error(`CARD_REFUND_FAILED: ${errMsg}. Manual review required.`);

      } catch (err: unknown) {
        const error = err as { message?: string };
        // Re-throw expected failures without masking
        if (error.message?.startsWith("CARD_REFUND_FAILED")) throw err;
        // Network / runtime exception — flag for manual review, do NOT mint balance
        const networkMsg = error.message || "Unknown network error";
        console.error("[FLUTTERWAVE_REFUND_EXCEPTION] Network error during card refund:", networkMsg);
        await this.persistManualReviewFlag(userId, orderId, amount, `Network exception: ${networkMsg}`);
        throw new Error(`CARD_REFUND_FAILED: Network exception during gateway refund. Manual review required.`);
      }
    }

    // No gateway key configured — flag immediately for manual review
    await this.persistManualReviewFlag(userId, orderId, amount, "Gateway not configured (missing FLUTTERWAVE_SECRET_KEY)");
    throw new Error("CARD_REFUND_FAILED: Gateway not configured. Manual review required.");
  }

  /**
   * Persist a REQUIRES_MANUAL_REVIEW ledger entry for a failed card refund.
   * This is a private helper; call executeStoreCreditRefund() to explicitly grant store credit.
   */
  private static async persistManualReviewFlag(
    userId: string,
    orderId: string,
    amount: number,
    reason: string
  ) {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount,
          reference: `MANUAL-${orderId}-${Date.now()}`,
          description: `[REQUIRES_MANUAL_REVIEW] Card refund failed for Order #${orderId}. Reason: ${reason}`,
          status: "FAILED",
        },
      });
    } catch (flagErr) {
      console.error("[MANUAL_REVIEW_FLAG_ERROR] Failed to persist manual review flag:", flagErr);
    }
  }

  /**
   * Explicitly grant store credit (wallet balance) to a buyer.
   * Must only be called after admin authorisation, NOT as an automatic fallback for gateway failures.
   */
  public static async executeStoreCreditRefund(
    userId: string,
    amount: number,
    orderId: string,
    adminNotes: string
  ) {
    return this.executeRefund(userId, amount, orderId, true);
  }


  /**
   * Fetch active Escrow orders and calculations from PostgreSQL
   */
  public static async getEscrowDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true, farmerProfile: true },
    });
    const buyerProfileId = user?.buyerProfile?.id || userId;

    const orders = await prisma.order.findMany({
      where: {
        buyerId: buyerProfileId,
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "IN_TRANSIT"] },
      },
      include: {
        orderItems: { include: { product: true } },
        delivery: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalLockedEscrow = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const mappedOrders = orders.map((o) => {
      const firstProduct = o.orderItems[0]?.product?.name || "Agro Produce Shipment";
      const totalItems = o.orderItems.reduce((acc, item) => acc + item.quantity, 0);
      const deliveryStatus = o.delivery?.deliveryStatus || "PENDING";
      
      let progress = 25;
      if (deliveryStatus === "PICKED_UP") progress = 50;
      if (deliveryStatus === "IN_TRANSIT") progress = 75;
      if (deliveryStatus === "DELIVERED") progress = 100;

      return {
        orderId: o.orderNumber,
        dbOrderId: o.id,
        produce: `${firstProduct} (${totalItems} items)`,
        farmer: "Verified Agro Supplier",
        amount: Number(o.totalAmount),
        formattedAmount: this.formatNGN(Number(o.totalAmount)),
        status: o.status,
        deliveryStatus,
        logisticsProgress: progress,
        deliveryEta: o.delivery?.estimatedDelivery
          ? new Date(o.delivery.estimatedDelivery).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
          : "In Transit",
        milestone: `Logistics Checkpoint: ${deliveryStatus}`,
        canRelease: o.status === "IN_TRANSIT" || deliveryStatus === "DELIVERED",
      };
    });

    return {
      totalLockedEscrow,
      formattedTotalLockedEscrow: this.formatNGN(totalLockedEscrow),
      activeProtectedOrdersCount: mappedOrders.length,
      nextScheduledRelease: mappedOrders[0]?.formattedAmount || "₦0.00",
      orders: mappedOrders,
    };
  }

  /**
   * Release Escrow funds to farmer wallet(s) upon confirmed delivery.
   * Multi-vendor hardened:
   * - If the order contains multiple SellerOrders, settles EACH farmer independently
   *   based on their specific subtotal and items.
   * - Atomically credits each farmer's wallet with (grossAmount - commission - VAT).
   * - Creates distinct ESCROW_RELEASE transactions for each seller sub-order.
   * - Decrements buyer's escrow by the exact aggregate settled (never negative).
   * - Marks SellerOrders and parent Order as COMPLETED.
   */
  public static async executeEscrowRelease(
    userIdOrOrderId: string,
    maybeOrderId?: string,
    targetSellerOrderId?: string
  ) {
    const effectiveOrderId = maybeOrderId || userIdOrOrderId;
    const order = await prisma.order.findUnique({
      where: { id: effectiveOrderId },
      include: {
        buyer: true,
        sellerOrders: {
          include: {
            farmerProfile: {
              include: { user: true },
            },
          },
        },
        orderItems: {
          include: {
            product: {
              include: { farmerProfile: true },
            },
          },
        },
      },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    const buyerUserId = order.buyer?.userId || (maybeOrderId ? userIdOrOrderId : (order as any).buyerId);
    const buyerWallet = await this.getOrCreateWallet(buyerUserId);

    // Determine seller orders to settle
    let sellerOrdersToSettle = order.sellerOrders || [];
    if (targetSellerOrderId) {
      sellerOrdersToSettle = sellerOrdersToSettle.filter((so) => so.id === targetSellerOrderId);
      if (sellerOrdersToSettle.length === 0) {
        throw new Error("SELLER_ORDER_NOT_FOUND");
      }
    } else {
      // Settle all uncompleted seller orders
      sellerOrdersToSettle = sellerOrdersToSettle.filter((so) => so.status !== "COMPLETED");
    }

    // Legacy fallback if no SellerOrders exist on order
    if (sellerOrdersToSettle.length === 0 && (!order.sellerOrders || order.sellerOrders.length === 0)) {
      const farmerMap = new Map<string, number>();
      for (const item of order.orderItems) {
        const fUserId = item.product.farmerProfile?.userId;
        if (fUserId) {
          const sub = Number(item.subtotal);
          farmerMap.set(fUserId, (farmerMap.get(fUserId) || 0) + sub);
        }
      }

      let totalGrossSettled = 0;
      const settlementOps: any[] = [];

      for (const [farmerUserId, grossAmount] of farmerMap.entries()) {
        const { netFarmerPayout, platformFee } = calculateSettlement(grossAmount);
        totalGrossSettled += grossAmount;
        const farmerWallet = await this.getOrCreateWallet(farmerUserId);
        const txRef = `REL-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        settlementOps.push(
          prisma.wallet.update({
            where: { id: farmerWallet.id },
            data: { balance: { increment: netFarmerPayout } },
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: farmerWallet.id,
              type: "ESCROW_RELEASE",
              amount: netFarmerPayout,
              reference: txRef,
              description: `Escrow released for Order #${order.orderNumber} (Gross: ₦${grossAmount}, Fee: ₦${platformFee})`,
              status: "SUCCESS",
            },
          })
        );
      }

      const currentEscrow = Number(buyerWallet.escrow);
      const escrowDecrement = Math.min(currentEscrow, totalGrossSettled);

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED" },
        }),
        prisma.wallet.update({
          where: { id: buyerWallet.id },
          data: { escrow: { decrement: escrowDecrement } },
        }),
        ...settlementOps,
      ]);

      return { success: true, settledCount: farmerMap.size, totalGrossSettled };
    }

    if (sellerOrdersToSettle.length === 0) {
      return { success: true, message: "All seller sub-orders already settled.", totalGrossSettled: 0 };
    }

    // MULTI-VENDOR SETTLEMENT VIA SELLER_ORDERS:
    // - grossAmount (subtotal): commodity value only — used for commission calculation
    // - fullOrderAmount (totalAmount): commodity + shipping — used to drain buyer's locked escrow
    let totalGrossSettled = 0;    // commissionable gross (subtotal only)
    let totalEscrowToRelease = 0; // full amount to drain from buyer escrow (includes shipping pass-through)
    const settlementOps: any[] = [];
    const settledSellerOrderIds: string[] = [];

    for (const sellerOrder of sellerOrdersToSettle) {
      const farmerUserId = sellerOrder.farmerProfile?.userId;
      if (!farmerUserId) continue;

      const grossAmount = Number(sellerOrder.subtotal);       // Commission base: commodity only
      const fullOrderAmount = Number(sellerOrder.totalAmount); // Includes shipping pass-through
      const { netFarmerPayout, platformFee } = calculateSettlement(grossAmount);
      totalGrossSettled += grossAmount;
      totalEscrowToRelease += fullOrderAmount; // Release full locked amount from buyer escrow
      settledSellerOrderIds.push(sellerOrder.id);

      const farmerWallet = await this.getOrCreateWallet(farmerUserId);
      const txRef = `REL-${sellerOrder.sellerOrderNumber}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      // 1. Mark SellerOrder as COMPLETED
      settlementOps.push(
        prisma.sellerOrder.update({
          where: { id: sellerOrder.id },
          data: {
            status: "COMPLETED",
            deliveredAt: sellerOrder.deliveredAt || new Date(),
          },
        })
      );

      // 2. Credit farmer wallet with net payout (commodity settlement; shipping is a pass-through)
      settlementOps.push(
        prisma.wallet.update({
          where: { id: farmerWallet.id },
          data: { balance: { increment: netFarmerPayout } },
        })
      );

      // 3. Ledger entry on farmer's wallet
      settlementOps.push(
        prisma.walletTransaction.create({
          data: {
            walletId: farmerWallet.id,
            type: "ESCROW_RELEASE",
            amount: netFarmerPayout,
            reference: txRef,
            description: `Escrow payout for Sub-Order #${sellerOrder.sellerOrderNumber} (Order #${order.orderNumber}). Commodity gross: ₦${grossAmount}, Fee: ₦${platformFee}`,
            status: "SUCCESS",
          },
        })
      );
    }

    // 4. Decrement buyer's escrow column safely (full locked amount including shipping)
    const currentEscrow = Number(buyerWallet.escrow);
    const escrowDecrement = Math.min(currentEscrow, totalEscrowToRelease);


    settlementOps.push(
      prisma.wallet.update({
        where: { id: buyerWallet.id },
        data: { escrow: { decrement: escrowDecrement } },
      })
    );

    // 5. If all seller orders for this order are completed, mark master Order as COMPLETED
    const allSellerOrders = order.sellerOrders || [];
    const remainingPending = allSellerOrders.filter(
      (so) => !settledSellerOrderIds.includes(so.id) && so.status !== "COMPLETED"
    );

    if (remainingPending.length === 0) {
      settlementOps.push(
        prisma.order.update({
          where: { id: effectiveOrderId },
          data: { status: "COMPLETED" },
        })
      );
    }

    await prisma.$transaction(settlementOps);

    console.log(
      `[MULTI_VENDOR_ESCROW_RELEASE] Order #${order.orderNumber}: Settled ${settledSellerOrderIds.length} seller orders. Total Gross: ₦${totalGrossSettled}`
    );

    return {
      success: true,
      settledSellerOrdersCount: settledSellerOrderIds.length,
      totalGrossSettled,
    };
  }

  /**
   * Fetch live Dispute Claims from PostgreSQL
   */
  public static async getDisputesData(userId: string) {
    const disputes = await prisma.dispute.findMany({
      where: { userId },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });

    const activeTickets = disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW");
    const resolvedTickets = disputes.filter((d) => d.status === "RESOLVED");

    const frozenDisputeFunds = activeTickets.reduce(
      (sum, d) => sum + (d.order ? Number(d.order.totalAmount) : 0),
      0
    );

    const totalRefunded = resolvedTickets.reduce(
      (sum, d) => sum + (d.order ? Number(d.order.totalAmount) : 0),
      0
    );

    const mappedDisputes = disputes.map((d) => ({
      ticketId: `DSP-${d.id.slice(0, 6).toUpperCase()}`,
      id: d.id,
      orderId: d.order?.orderNumber || "ORD-GENERAL",
      subject: d.title,
      description: d.description,
      amount: d.order ? Number(d.order.totalAmount) : 0,
      formattedAmount: this.formatNGN(d.order ? Number(d.order.totalAmount) : 0),
      status: d.status,
      resolution: d.resolution || "Case in review by admin arbitrator.",
      date: new Date(d.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
      lastUpdate: d.closedAt ? `Closed on ${new Date(d.closedAt).toLocaleDateString()}` : "Under active review",
    }));

    return {
      frozenDisputeFunds,
      formattedFrozenDisputeFunds: this.formatNGN(frozenDisputeFunds),
      activeTicketsCount: activeTickets.length,
      totalRefunded,
      formattedTotalRefunded: this.formatNGN(totalRefunded),
      disputes: mappedDisputes,
    };
  }

  /**
   * Create a new dispute claim in PostgreSQL
   */
  public static async createDispute(userId: string, orderId: string, title: string, description: string) {
    // Find order if orderNumber passed
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND: Valid order ID or number required to lodge claim.");
    }

    const dispute = await prisma.dispute.create({
      data: {
        userId,
        orderId: order.id,
        title,
        description,
        status: "OPEN",
      },
    });

    return dispute;
  }

  /**
   * Fetch Tax & Annual Accounting Statements from PostgreSQL
   */
  public static async getTaxStatementsData(userId: string, yearStr: string = "2026") {
    const year = parseInt(yearStr) || new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true },
    });
    const buyerProfileId = user?.buyerProfile?.id || userId;

    const completedOrders = await prisma.order.findMany({
      where: {
        buyerId: buyerProfileId,
        status: { in: ["DELIVERED", "COMPLETED"] },
        createdAt: { gte: startOfYear, lte: endOfYear },
      },
    });

    const totalTradeVolume = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const vatRate = 0.075; // 7.5% Nigerian VAT rate
    const totalVatRemitted = totalTradeVolume * vatRate;

    // Monthly breakdown
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthlyStatements = months.map((monthName, idx) => {
      const monthOrders = completedOrders.filter((o) => new Date(o.createdAt).getMonth() === idx);
      const volume = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const vat = volume * vatRate;

      return {
        month: `${monthName} ${year}`,
        period: `${monthName.slice(0, 3)} 01 - ${monthName.slice(0, 3)} 30, ${year}`,
        volume,
        formattedVolume: this.formatNGN(volume),
        vat,
        formattedVat: this.formatNGN(vat),
        status: volume > 0 ? "READY" : "NO_ACTIVITY",
      };
    }).filter((m, idx) => m.volume > 0 || idx === new Date().getMonth());

    return {
      year,
      totalTradeVolume,
      formattedTotalTradeVolume: this.formatNGN(totalTradeVolume),
      totalVatRemitted,
      formattedTotalVatRemitted: this.formatNGN(totalVatRemitted),
      monthlyStatements,
    };
  }

  /**
   * Settles an order payment received from an authoritative gateway webhook (PAY-004).
   * Atomically:
   * 1. Verifies pending Payment record and matches amounts & currencies.
   * 2. Marks Payment as PAID and sets transactionRef.
   * 3. Updates Order status to CONFIRMED.
   * 4. Locks funds in Buyer's escrow column.
   * 5. Creates WalletTransaction record for ESCROW_LOCK with uniqueness enforcement.
   */
  public static async settleOrderPaymentFromGateway(
    orderIdOrPaymentId: string,
    transactionRef: string,
    paidAmount: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Locate Payment by orderId, paymentId, or transactionRef
      const payment = await tx.payment.findFirst({
        where: {
          OR: [
            { orderId: orderIdOrPaymentId },
            { id: orderIdOrPaymentId },
            { transactionRef: transactionRef },
          ],
        },
        include: {
          order: {
            include: {
              buyer: { include: { user: true } },
            },
          },
        },
      });

      if (!payment) {
        throw new Error(`PAYMENT_NOT_FOUND: No payment record found for "${orderIdOrPaymentId}".`);
      }

      // Idempotency: If already paid, return safely without mutating balances again
      if (payment.paymentStatus === "PAID") {
        return { status: "ALREADY_SETTLED", payment };
      }

      const expectedAmount = Number(payment.amount);
      if (Math.abs(paidAmount - expectedAmount) > 0.01) {
        throw new Error(
          `AMOUNT_MISMATCH: Gateway paid amount (₦${paidAmount}) does not match expected order amount (₦${expectedAmount}).`
        );
      }

      // 2. Locate or create buyer wallet
      const buyerUserId = payment.order.buyer.userId;
      let buyerWallet = await tx.wallet.findUnique({
        where: { userId: buyerUserId },
      });

      if (!buyerWallet) {
        buyerWallet = await tx.wallet.create({
          data: { userId: buyerUserId, balance: 0, escrow: 0 },
        });
      }

      // 3. Mark Payment as PAID
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: "PAID",
          transactionRef,
          paidAt: new Date(),
        },
      });

      // 4. Confirm Order status
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      });

      // 5. Lock funds in Buyer Escrow
      await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: {
          escrow: { increment: paidAmount },
        },
      });

      // 6. Record WalletTransaction (Enforces unique reference)
      const txRecord = await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: "ESCROW_LOCK",
          amount: paidAmount,
          reference: transactionRef,
          description: `Gateway payment confirmed & escrow locked for Order #${payment.order.orderNumber}`,
          status: "SUCCESS",
        },
      });

      return { status: "SUCCESSFULLY_SETTLED", payment: updatedPayment, txRecord };
    });
  }
}

