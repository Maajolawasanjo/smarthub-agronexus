import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { evaluateTrustPolicy } from "@/lib/trust";
import { publishAgroEvent } from "@/lib/events";
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
    const buyerProfileId = user.buyerProfile?.id || userId;

    // 1. Calculate Balances
    // The Wallet model is the cached ledger summary.
    // Each balance column is updated atomically in prisma.$transaction by the corresponding ledger operation.
    // Read from DB fields — do NOT re-aggregate on every request.
    const availableBalance   = Number(wallet.balance);
    const escrowBalance      = Number((wallet as any).escrow           ?? 0);
    const pendingWithdrawals = Number((wallet as any).pendingWithdrawal ?? 0);
    const frozenBalance      = Number((wallet as any).frozen            ?? 0);

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

    // 2. Summary Aggregations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlySpendAgg = await prisma.order.aggregate({
      where: {
        buyerId: buyerProfileId,
        status: { in: ["DELIVERED", "COMPLETED"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    });
    const monthlySpend = monthlySpendAgg._sum.totalAmount ? Number(monthlySpendAgg._sum.totalAmount) : 0.0;

    const lifetimeSpendAgg = await prisma.order.aggregate({
      where: {
        buyerId: buyerProfileId,
        status: { in: ["DELIVERED", "COMPLETED"] },
      },
      _sum: { totalAmount: true },
    });
    const lifetimeSpend = lifetimeSpendAgg._sum.totalAmount ? Number(lifetimeSpendAgg._sum.totalAmount) : 0.0;

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
      supportedMethods: ["FLUTTERWAVE", "USSD", "CARD"],
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
      type: tx.type as any,
      amount: Number(tx.amount),
      formattedAmount: `${tx.type === "DEPOSIT" || tx.type === "REFUND" || tx.type === "ESCROW_RELEASE" ? "+" : "-"}${this.formatNGN(Number(tx.amount))}`,
      status: tx.status as any,
      description: tx.description || "System transaction",
      date: new Date(tx.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
      method: tx.type === "DEPOSIT" ? "Bank Transfer / Paystack" : "Wallet Direct",
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

    const txRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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

    const txRef = `WD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
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
      } catch (err: any) {
        if (err.message?.startsWith("BANK_TRANSFER_FAILED")) throw err;
        console.error("[FLUTTERWAVE_TRANSFER_EXCEP]", err);
      }
    } else {
      // In development/test mode without API key, set to PROCESSING
      await prisma.walletTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: "PROCESSING",
          description: `[PROCESSING] Mock transfer accepted, pending webhook callback (${txRef})`,
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
   * Ledger: REFUND — escrow decrements, balance increments (returns locked funds to buyer).
   */
  public static async executeRefund(userId: string, amount: number, orderId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const txRef = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const [updatedWallet, txRecord] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          escrow:  { decrement: amount },  // ← Release from escrow
          balance: { increment: amount },   // ← Return to buyer's available balance
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount,
          reference: txRef,
          description: `Refund credited for cancelled Order #${orderId.slice(0, 8)}`,
          status: "SUCCESS",
        },
      }),
    ]);

    return { updatedWallet, txRecord };
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
   * Release Escrow funds to farmer wallet upon confirmed delivery.
   * Ledger: ESCROW_RELEASE — buyer escrow decrements, farmer wallet balance increments (minus platform fee).
   * Flutterwave is NOT called here. Farmer controls when to bank-withdraw.
   */
  public static async executeEscrowRelease(userId: string, dbOrderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: dbOrderId },
      include: { orderItems: { include: { product: { include: { farmerProfile: true } } } } },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    const totalAmount = Number(order.totalAmount);
    const PLATFORM_FEE_PCT = config.fees.platformFeeRate; // Single Source of Truth
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PCT * 100) / 100;
    const farmerAmount = totalAmount - platformFee;

    const farmerUserId = order.orderItems[0]?.product?.farmerProfile?.userId;
    const buyerWallet = await this.getOrCreateWallet(userId);

    if (farmerUserId) {
      const farmerWallet = await this.getOrCreateWallet(farmerUserId);
      const txRef = `REL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await prisma.$transaction([
        // Mark order as completed
        prisma.order.update({
          where: { id: dbOrderId },
          data: { status: "COMPLETED" },
        }),
        // Decrement buyer's escrow column (money leaves escrow)
        prisma.wallet.update({
          where: { id: buyerWallet.id },
          data: { escrow: { decrement: totalAmount } },
        }),
        // Credit farmer wallet with amount minus platform commission
        prisma.wallet.update({
          where: { id: farmerWallet.id },
          data: { balance: { increment: farmerAmount } },
        }),
        // Ledger entry on farmer's wallet
        prisma.walletTransaction.create({
          data: {
            walletId: farmerWallet.id,
            type: "ESCROW_RELEASE",
            amount: farmerAmount,
            reference: txRef,
            description: `Escrow released for Order #${order.orderNumber} (${config.fees.platformFeeRate * 100}% fee: ${this.formatNGN(platformFee)} retained)`,
            status: "SUCCESS",
          },
        }),
      ]);

      console.log(`[ESCROW_RELEASE] Order #${order.orderNumber}: ₦${farmerAmount} → Farmer Wallet | ₦${platformFee} → Platform Revenue`);
    }

    return { success: true };
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
    let targetOrderId = orderId;
    
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
    }).filter((m) => m.volume > 0 || m.month.includes(new Date().toLocaleDateString("en-US", { month: "long" })));

    return {
      year,
      totalTradeVolume,
      formattedTotalTradeVolume: this.formatNGN(totalTradeVolume),
      totalVatRemitted,
      formattedTotalVatRemitted: this.formatNGN(totalVatRemitted),
      monthlyStatements,
    };
  }
}

