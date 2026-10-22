import crypto from "crypto";
import { Prisma, TxStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
  /**
   * Compatibility entry point for a wallet deposit. It may settle only a previously
   * persisted PENDING deposit intent; it cannot create balance from an arbitrary reference.
   */
  public static async executeDeposit(userId: string, amount: number, reference: string) {
    const result = await this.settleGatewayWalletDeposit(reference, amount, userId);
    const updatedWallet = "wallet" in result
      ? result.wallet
      : await prisma.wallet.findUnique({ where: { userId } });

    return {
      updatedWallet,
      txRecord: result.transaction,
      alreadySettled: result.status === "ALREADY_SETTLED",
    };
  }

  /**
   * Settle a previously persisted Flutterwave wallet-funding intent.
   * The intent's unique reference, owner, amount and PENDING state are authoritative;
   * webhook metadata alone can never create a wallet credit.
   */
  public static async settleGatewayWalletDeposit(
    reference: string,
    paidAmount: number,
    expectedUserId: string
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const intent = await tx.walletTransaction.findUnique({
        where: { reference },
        include: { wallet: true },
      });

      if (!intent || intent.type !== "DEPOSIT") {
        throw new Error("WALLET_FUNDING_INTENT_NOT_FOUND");
      }
      if (intent.wallet.userId !== expectedUserId) {
        throw new Error("WALLET_FUNDING_OWNER_MISMATCH");
      }
      if (Math.abs(Number(intent.amount) - paidAmount) > 0.01) {
        throw new Error("WALLET_FUNDING_AMOUNT_MISMATCH");
      }
      if (intent.status === "SUCCESS") {
        return { status: "ALREADY_SETTLED" as const, transaction: intent };
      }
      if (intent.status !== "PENDING") {
        throw new Error("WALLET_FUNDING_INTENT_NOT_PENDING");
      }

      const claimed = await tx.walletTransaction.updateMany({
        where: { id: intent.id, type: "DEPOSIT", status: "PENDING" },
        data: {
          status: "SUCCESS",
          description: `Wallet funded through verified Flutterwave transaction (${reference})`,
        },
      });

      if (claimed.count !== 1) {
        const current = await tx.walletTransaction.findUnique({ where: { reference } });
        if (current?.status === "SUCCESS") {
          return { status: "ALREADY_SETTLED" as const, transaction: current };
        }
        throw new Error("WALLET_FUNDING_INTENT_STATE_CONFLICT");
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: intent.walletId },
        data: { balance: { increment: paidAmount } },
      });

      const updatedTransaction = await tx.walletTransaction.findUnique({ where: { reference } });
      return {
        status: "SUCCESS" as const,
        wallet: updatedWallet,
        transaction: updatedTransaction,
      };
    });

    if (result.status === "SUCCESS") {
      await publishAgroEvent("PAYMENT_COMPLETED", {
        userId: expectedUserId,
        amount: paidAmount,
        remarks: `Verified Flutterwave wallet funding ref ${reference}`,
      });
    }

    return result;
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
  public static async executeWithdrawal(
    userId: string,
    amount: number,
    bankAccountId: string,
    idempotencyKey?: string
  ) {
    const requestedAmount = Number(amount);
    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0 ||
      Math.abs(requestedAmount * 100 - Math.round(requestedAmount * 100)) > 0.000001
    ) {
      throw new Error("INVALID_AMOUNT: Withdrawal amount must be a positive NGN amount with at most two decimal places.");
    }
    const normalizedAmount = Math.round(requestedAmount * 100) / 100;
    const requestKey = typeof idempotencyKey === "string" && idempotencyKey.trim()
      ? idempotencyKey.trim()
      : crypto.randomUUID();
    if (requestKey.length > 200) {
      throw new Error("INVALID_IDEMPOTENCY_KEY");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND");
    if (!user.isActive) {
      throw new Error("ACCOUNT_FROZEN: Withdrawals are disabled for suspended accounts.");
    }

    const wallet = await this.getOrCreateWallet(userId);
    const currentBalance = Number(wallet.balance);
    if (normalizedAmount > currentBalance) {
      throw new Error(`INSUFFICIENT_FUNDS: Requested ${this.formatNGN(normalizedAmount)} exceeds available balance of ${this.formatNGN(currentBalance)}`);
    }

    // The same user/key always resolves to the same persisted reference. The raw
    // client key is never stored or exposed. A DB unique constraint makes concurrent
    // retries converge on one withdrawal record.
    const txRef = `WD-${crypto.createHash("sha256").update(`${userId}:${requestKey}`).digest("hex").slice(0, 32).toUpperCase()}`;
    const getCurrentResult = async (
      record: Prisma.WalletTransactionGetPayload<{ include: { wallet: true } }>,
      alreadyProcessed = true
    ) => {
      if (
        record.type !== "WITHDRAWAL" ||
        record.walletId !== wallet.id ||
        record.bankAccountId !== bankAccountId ||
        Math.abs(Number(record.amount) - normalizedAmount) > 0.01
      ) {
        throw new Error("IDEMPOTENCY_KEY_REUSED: This key was already used with a different withdrawal request.");
      }
      if (record.status === "FAILED" || record.status === "REVERSED") {
        throw new Error(`WITHDRAWAL_IDEMPOTENCY_TERMINAL: This withdrawal already ended as ${record.status}. Use a new idempotency key for a new attempt.`);
      }
      const latestWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
      return {
        updatedWallet: latestWallet || wallet,
        txRecord: record,
        transactionRef: txRef,
        status: record.status,
        alreadyProcessed,
        reconciliationRequired: String(record.description || "").includes("[MANUAL_REVIEW]"),
      };
    };

    const existing = await prisma.walletTransaction.findUnique({
      where: { reference: txRef },
      include: { wallet: true },
    });
    if (existing) return getCurrentResult(existing);

    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, userId, isVerified: true },
    });
    if (!bankAccount) {
      throw new Error("INVALID_BANK_ACCOUNT: Verified bank account not found for this user.");
    }

    const bankDesc = `${bankAccount.bankName} (${bankAccount.accountNumber})`;
    let initial: {
      updatedWallet: Prisma.WalletGetPayload<true>;
      txRecord: Prisma.WalletTransactionGetPayload<true>;
    };
    try {
      initial = await prisma.$transaction(async (tx) => {
        // Compare-and-set is the authoritative funds check. A prior balance read is
        // not enough: two concurrent requests must never debit the same available funds.
        const debit = await tx.wallet.updateMany({
          where: { id: wallet.id, balance: { gte: normalizedAmount } },
          data: {
            balance: { decrement: normalizedAmount },
            pendingWithdrawal: { increment: normalizedAmount },
          },
        });
        if (debit.count !== 1) {
          throw new Error("INSUFFICIENT_FUNDS: Available balance changed before withdrawal reservation.");
        }

        const txRecord = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL",
            amount: normalizedAmount,
            reference: txRef,
            bankAccountId,
            description: `[VALIDATED] Payout initiated to ${bankDesc}`,
            status: "VALIDATED",
          },
        });
        const updatedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
        return { updatedWallet: updatedWallet || wallet, txRecord };
      });
    } catch (error: unknown) {
      // If another identical request won the unique-reference race, return its
      // persisted state. Its transaction rollback also rolls back this request's debit.
      if ((error as { code?: string })?.code === "P2002") {
        const concurrent = await prisma.walletTransaction.findUnique({
          where: { reference: txRef },
          include: { wallet: true },
        });
        if (concurrent) return getCurrentResult(concurrent);
      }
      throw error;
    }

    const txRecord = initial.txRecord;
    const rollbackReservedFunds = async (reason: string, allowedStates: TxStatus[]) => {
      await prisma.$transaction(async (tx) => {
        const claim = await tx.walletTransaction.updateMany({
          where: { id: txRecord.id, status: { in: allowedStates } },
          data: { status: "REVERSED", description: `[REVERSED] ${reason} (funds restored to available balance).` },
        });
        if (claim.count !== 1) throw new Error("WITHDRAWAL_STATE_CONFLICT: Cannot reverse a withdrawal that has already changed state.");

        const restored = await tx.wallet.updateMany({
          where: { id: wallet.id, pendingWithdrawal: { gte: normalizedAmount } },
          data: {
            balance: { increment: normalizedAmount },
            pendingWithdrawal: { decrement: normalizedAmount },
          },
        });
        if (restored.count !== 1) {
          throw new Error("WITHDRAWAL_ROLLBACK_CONFLICT: Could not safely restore the reserved withdrawal amount.");
        }
      });
    };

    const markOutcomeUnknown = async (reason: string) => {
      // A timeout or malformed response does not prove that Flutterwave rejected the
      // transfer. Keep funds in pendingWithdrawal to prevent a payout + wallet refund.
      await prisma.walletTransaction.updateMany({
        where: { id: txRecord.id, status: "SUBMITTED_TO_FLUTTERWAVE" },
        data: {
          status: "PROCESSING",
          description: `[MANUAL_REVIEW] Flutterwave transfer outcome is unknown; funds remain pending. Reference: ${txRef}. Reason: ${reason}`,
        },
      });
      const latest = await prisma.walletTransaction.findUnique({
        where: { reference: txRef },
        include: { wallet: true },
      });
      if (!latest) throw new Error("WITHDRAWAL_STATE_CONFLICT: Withdrawal record disappeared during reconciliation.");
      return latest;
    };

    // No gateway request is made until the persisted record has entered its submission state.
    const submitted = await prisma.walletTransaction.updateMany({
      where: { id: txRecord.id, status: "VALIDATED" },
      data: {
        status: "SUBMITTED_TO_FLUTTERWAVE",
        description: `[SUBMITTED] Transfer request prepared for ${bankDesc} (${bankAccountId})`,
      },
    });
    if (submitted.count !== 1) {
      await rollbackReservedFunds("Unable to persist gateway submission state", ["VALIDATED"]);
      throw new Error("WITHDRAWAL_STATE_CONFLICT: Could not prepare withdrawal submission.");
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (secretKey) {
      let flwRes: Response;
      let flwData: {
        status?: string;
        message?: string;
        data?: { id?: string | number };
      };
      try {
        flwRes = await fetch("https://api.flutterwave.com/v3/transfers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_bank: bankAccount.bankCode || "011",
            account_number: bankAccount.accountNumber,
            amount: normalizedAmount,
            narration: `SmartHub AgroChain Payout ${txRef}`,
            currency: "NGN",
            reference: txRef,
          }),
        });
        flwData = await flwRes.json() as typeof flwData;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown network/response error";
        const latest = await markOutcomeUnknown(message);
        const latestWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
        await publishAgroEvent("WITHDRAWAL_SUBMITTED", {
          userId,
          amount: normalizedAmount,
          remarks: `${txRef} pending reconciliation`,
        }).catch((eventError) => console.error("[WITHDRAWAL_EVENT_PUBLISH_FAILED]", eventError));
        return {
          updatedWallet: latestWallet || initial.updatedWallet,
          txRecord: latest,
          transactionRef: txRef,
          status: latest.status,
          alreadyProcessed: false,
          reconciliationRequired: String(latest.description || "").includes("[MANUAL_REVIEW]"),
        };
      }

      if (flwRes.ok && flwData?.status === "success") {
        const accepted = await prisma.walletTransaction.updateMany({
          where: { id: txRecord.id, status: "SUBMITTED_TO_FLUTTERWAVE" },
          data: {
            status: "PROCESSING",
            description: `[PROCESSING] Flutterwave payout pending bank settlement (ID: ${flwData.data?.id || txRef}; destination: ${bankAccountId})`,
          },
        });
        const latest = await prisma.walletTransaction.findUnique({
          where: { reference: txRef },
          include: { wallet: true },
        });
        if (accepted.count !== 1 && latest?.status !== "SUCCESS") {
          throw new Error("WITHDRAWAL_STATE_CONFLICT: Gateway accepted a transfer whose local state changed unexpectedly.");
        }
      } else if (
        !flwRes.ok &&
        flwRes.status >= 400 &&
        flwRes.status < 500 &&
        flwData?.status === "error"
      ) {
        const message = String(flwData.message || "Flutterwave rejected the transfer.");
        await rollbackReservedFunds(`Gateway rejected transfer: ${message}`, ["SUBMITTED_TO_FLUTTERWAVE"]);
        throw new Error(`BANK_TRANSFER_FAILED: ${message}`);
      } else {
        const reason = `Ambiguous provider response (HTTP ${flwRes.status}; status ${String(flwData?.status || "missing")})`;
        const latest = await markOutcomeUnknown(reason);
        const latestWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
        await publishAgroEvent("WITHDRAWAL_SUBMITTED", {
          userId,
          amount: normalizedAmount,
          remarks: `${txRef} pending reconciliation`,
        }).catch((eventError) => console.error("[WITHDRAWAL_EVENT_PUBLISH_FAILED]", eventError));
        return {
          updatedWallet: latestWallet || initial.updatedWallet,
          txRecord: latest,
          transactionRef: txRef,
          status: latest.status,
          alreadyProcessed: false,
          reconciliationRequired: String(latest.description || "").includes("[MANUAL_REVIEW]"),
        };
      }
    } else if (process.env.NODE_ENV === "production") {
      // No request was sent to Flutterwave, so this is a safe reversal—not an ambiguous
      // network outcome. Only restore funds after the state compare-and-set succeeds.
      await rollbackReservedFunds("Gateway unconfigured in production", ["SUBMITTED_TO_FLUTTERWAVE"]);
      throw new Error("GATEWAY_UNCONFIGURED: Banking payout service is not configured in production.");
    } else {
      await prisma.walletTransaction.updateMany({
        where: { id: txRecord.id, status: "SUBMITTED_TO_FLUTTERWAVE" },
        data: {
          status: "PROCESSING",
          description: `[DEV_MODE] Mock transfer accepted without gateway key (${txRef}; destination: ${bankAccountId})`,
        },
      });
    }

    // Notifications must not turn a persisted transfer into a failed HTTP response.
    try {
      await publishAgroEvent("WITHDRAWAL_SUBMITTED", {
        userId,
        amount: normalizedAmount,
        remarks: txRef,
      });
    } catch (error) {
      console.error("[WITHDRAWAL_EVENT_PUBLISH_FAILED]", error);
    }

    const [latestWallet, latestRecord] = await Promise.all([
      prisma.wallet.findUnique({ where: { id: wallet.id } }),
      prisma.walletTransaction.findUnique({ where: { reference: txRef }, include: { wallet: true } }),
    ]);
    if (!latestRecord) throw new Error("WITHDRAWAL_STATE_CONFLICT: Withdrawal record disappeared after submission.");
    if (latestRecord.status === "FAILED" || latestRecord.status === "REVERSED") {
      throw new Error(`WITHDRAWAL_IDEMPOTENCY_TERMINAL: This withdrawal already ended as ${latestRecord.status}. Use a new idempotency key for a new attempt.`);
    }

    return {
      updatedWallet: latestWallet || initial.updatedWallet,
      txRecord: latestRecord,
      transactionRef: txRef,
      status: latestRecord.status,
      alreadyProcessed: false,
      reconciliationRequired: String(latestRecord.description || "").includes("[MANUAL_REVIEW]"),
    };
  }

  /**
   * Processes Flutterwave Transfer Webhook callbacks (transfer.completed)
   * Enforces state machine transition to SUCCESS or REVERSED.
   */
  public static async handleTransferWebhook(txRef: string, isSuccessful: boolean, failureReason?: string) {
    const existing = await prisma.walletTransaction.findUnique({
      where: { reference: txRef },
      include: { wallet: true },
    });

    const activePendingStates: TxStatus[] = ["PENDING", "VALIDATED", "SUBMITTED_TO_FLUTTERWAVE", "PROCESSING"];
    if (!existing || existing.type !== "WITHDRAWAL" || !activePendingStates.includes(existing.status)) {
      console.log(`[TRANSFER_WEBHOOK_SKIP] Transaction ${txRef} is not an active pending withdrawal (current: ${existing?.status}).`);
      return { status: "ALREADY_HANDLED" as const };
    }

    const amount = Number(existing.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("WITHDRAWAL_LEDGER_AMOUNT_INVALID");
    }

    // Claim the state transition and adjust the wallet in one transaction. A replayed
    // or concurrent webhook cannot decrement pendingWithdrawal or restore balance twice.
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.walletTransaction.updateMany({
        where: {
          id: existing.id,
          type: "WITHDRAWAL",
          status: { in: activePendingStates },
        },
        data: {
          status: isSuccessful ? "SUCCESS" : "REVERSED",
          description: isSuccessful
            ? `[SUCCESS] Bank transfer settled (${txRef})`
            : `[REVERSED] Transfer failed: ${failureReason || "Returned by bank"} (funds restored to available balance)`,
        },
      });

      if (claimed.count !== 1) {
        return { status: "ALREADY_HANDLED" as const };
      }

      const walletUpdate = await tx.wallet.updateMany({
        where: {
          id: existing.walletId,
          pendingWithdrawal: { gte: amount },
        },
        data: isSuccessful
          ? { pendingWithdrawal: { decrement: amount } }
          : {
              pendingWithdrawal: { decrement: amount },
              balance: { increment: amount },
            },
      });

      if (walletUpdate.count !== 1) {
        throw new Error("WITHDRAWAL_SETTLEMENT_CONFLICT: Pending withdrawal balance does not cover this ledger entry.");
      }

      return { status: isSuccessful ? "SUCCESS" as const : "REVERSED" as const };
    });

    if (result.status === "ALREADY_HANDLED") {
      console.log(`[TRANSFER_WEBHOOK_SKIP] Duplicate transfer callback ignored for ${txRef}.`);
      return result;
    }

    console.log(
      isSuccessful
        ? `[TRANSFER_WEBHOOK_SUCCESS] Withdrawal ${txRef} of ₦${amount} confirmed by recipient bank.`
        : `[TRANSFER_WEBHOOK_REVERSED] Withdrawal ${txRef} failed. ₦${amount} restored to available balance.`
    );
    return result;
  }

  /**
   * Executes atomic order cancellation refund back to buyer wallet.
   * Ledger: REFUND — escrow decrements safely (never negative), balance increments.
   * If escrow is 0 (e.g. card order refunded as platform store credit), funds balance directly without negative escrow.
   */
  public static async executeRefund(
    userId: string,
    amount: number,
    orderId: string,
    isStoreCredit = false,
    storeCreditNotes?: string
  ) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("INVALID_REFUND_AMOUNT");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, payment: true },
    });
    if (!order || order.buyer.userId !== userId) {
      throw new Error("REFUND_ORDER_OWNER_MISMATCH");
    }
    if (
      Math.abs(Number(order.totalAmount) - amount) > 0.01 ||
      (order.payment && Math.abs(Number(order.payment.amount) - amount) > 0.01)
    ) {
      throw new Error("REFUND_AMOUNT_MISMATCH");
    }

    if (!order.payment) {
      throw new Error("PAYMENT_NOT_SETTLED");
    }

    if (!isStoreCredit) {
      if (order.payment.paymentMethod !== "WALLET") {
        throw new Error("PAYMENT_SOURCE_MISMATCH: Wallet escrow refunds are only valid for wallet-paid orders.");
      }
      if (!["PAID", "REFUNDED"].includes(order.payment.paymentStatus)) {
        throw new Error("PAYMENT_NOT_SETTLED");
      }
      if (!order.payment.transactionRef) throw new Error("ESCROW_LOCK_REFERENCE_MISSING");

      const escrowLock = await prisma.walletTransaction.findUnique({
        where: { reference: order.payment.transactionRef },
        include: { wallet: true },
      });
      if (
        !escrowLock ||
        escrowLock.type !== "ESCROW_LOCK" ||
        escrowLock.status !== "SUCCESS" ||
        escrowLock.wallet?.userId !== userId ||
        Math.abs(Number(escrowLock.amount) - amount) > 0.01
      ) {
        throw new Error("ESCROW_NOT_FUNDED");
      }
      if (order.payment.paymentStatus === "REFUNDED") {
        const priorRefund = await prisma.walletTransaction.findUnique({
          where: { reference: `WALLET-REFUND-${orderId}` },
        });
        if (
          !priorRefund ||
          priorRefund.status !== "SUCCESS" ||
          Math.abs(Number(priorRefund.amount) - amount) > 0.01
        ) {
          throw new Error("REFUND_STATE_CONFLICT");
        }
      }
    } else {
      // Store credit is an explicit, auditable alternative for a non-wallet payment.
      // It may not bypass an in-flight/settled financial state or refund a wallet order.
      if (order.payment.paymentMethod === "WALLET") {
        throw new Error("PAYMENT_SOURCE_MISMATCH: Wallet-paid orders must be refunded from escrow.");
      }
      if (order.payment.paymentStatus === "REFUNDED") {
        const priorCredit = await prisma.walletTransaction.findUnique({
          where: { reference: `STORE-CREDIT-${orderId}` },
        });
        if (
          !priorCredit ||
          priorCredit.status !== "SUCCESS" ||
          Math.abs(Number(priorCredit.amount) - amount) > 0.01
        ) {
          throw new Error("REFUND_STATE_CONFLICT");
        }
      } else if (
        order.payment.paymentStatus !== "PAID" ||
        order.payment.financialState !== "ESCROWED"
      ) {
        throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");
      }
    }

    const wallet = await this.getOrCreateWallet(userId);
    const txRef = isStoreCredit ? `STORE-CREDIT-${orderId}` : `WALLET-REFUND-${orderId}`;

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.walletTransaction.findUnique({ where: { reference: txRef } });
      if (existing) {
        if (existing.status === "SUCCESS" && Math.abs(Number(existing.amount) - amount) <= 0.01) {
          if (
            order.payment!.paymentStatus === "REFUNDED" &&
            order.payment!.financialState === "REFUNDED"
          ) {
            return { updatedWallet: wallet, txRecord: existing, alreadyRefunded: true };
          }

          // Repair the only safe legacy state: a successful deterministic refund ledger
          // exists but the old route failed before marking the payment refunded. If another
          // operation has already moved the payment elsewhere, do not guess or pay twice.
          const legacyRepair = await tx.payment.updateMany({
            where: {
              id: order.payment!.id,
              paymentStatus: "PAID",
              financialState: "ESCROWED",
            },
            data: {
              paymentStatus: "REFUNDED",
              financialState: "REFUNDED",
            },
          });
          if (legacyRepair.count === 1) {
            return { updatedWallet: wallet, txRecord: existing, alreadyRefunded: true };
          }
          throw new Error("REFUND_STATE_CONFLICT");
        }
        throw new Error("REFUND_ALREADY_RECORDED");
      }

      // The same compare-and-set claim is shared by refunds and escrow releases.
      // It prevents a release/refund race and commits the Payment status with the ledger.
      const financialClaim = await tx.payment.updateMany({
        where: {
          id: order.payment!.id,
          paymentStatus: "PAID",
          financialState: "ESCROWED",
        },
        data: {
          paymentStatus: "REFUNDED",
          financialState: "REFUNDED",
        },
      });
      if (financialClaim.count !== 1) throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");

      if (isStoreCredit) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
        });
      } else {
        const debit = await tx.wallet.updateMany({
          where: { id: wallet.id, escrow: { gte: amount } },
          data: {
            escrow: { decrement: amount },
            balance: { increment: amount },
          },
        });
        if (debit.count !== 1) throw new Error("INSUFFICIENT_ESCROW");
      }

      const txRecord = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount,
          reference: txRef,
          description: isStoreCredit
            ? `Admin-authorized store credit for Order #${order.orderNumber}. Reason: ${storeCreditNotes?.trim() || "No reason supplied"}`
            : `Wallet escrow refunded for cancelled Order #${order.orderNumber}`,
          status: "SUCCESS",
        },
      });

      const updatedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      return { updatedWallet, txRecord, alreadyRefunded: false };
    });
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
    gatewayTransactionId: string,
    amount: number
  ) {
    const gatewayId = String(gatewayTransactionId || "").trim();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, payment: true },
    });

    if (!order || order.buyer.userId !== userId) {
      throw new Error("REFUND_ORDER_OWNER_MISMATCH");
    }
    if (!order.payment || order.payment.paymentMethod !== "CARD") {
      throw new Error("GATEWAY_REFUND_PAYMENT_MISMATCH");
    }
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Math.abs(Number(order.totalAmount) - amount) > 0.01 ||
      Math.abs(Number(order.payment.amount) - amount) > 0.01
    ) {
      throw new Error("REFUND_AMOUNT_MISMATCH");
    }

    const payment = order.payment;
    const cardRefundReference = `CARD-REFUND-${orderId}`;

    if (payment.refundStatus === "SUCCEEDED") {
      if (payment.paymentStatus !== "REFUNDED" || payment.financialState !== "REFUNDED") {
        throw new Error("REFUND_STATE_CONFLICT: Provider refund marker disagrees with the payment lifecycle state.");
      }
      const refundLedger = await prisma.walletTransaction.findUnique({
        where: { reference: cardRefundReference },
        include: { wallet: true },
      });
      if (
        !refundLedger ||
        refundLedger.status !== "SUCCESS" ||
        refundLedger.type !== "REFUND" ||
        refundLedger.wallet?.userId !== userId ||
        Math.abs(Number(refundLedger.amount) - amount) > 0.01
      ) {
        throw new Error("REFUND_STATE_CONFLICT: Confirmed card refund is missing its escrow-debit ledger entry.");
      }
      return {
        gatewayRefunded: true,
        alreadyRefunded: true,
        gatewayTransactionId: payment.gatewayTransactionId,
        gatewayRefundId: payment.gatewayRefundId,
      };
    }
    if (payment.refundStatus === "PENDING" || payment.refundStatus === "MANUAL_REVIEW") {
      throw new Error("CARD_REFUND_PENDING_RECONCILIATION: A previous refund attempt requires reconciliation.");
    }
    if (payment.refundStatus === "FAILED") {
      throw new Error("CARD_REFUND_FAILED: A previous provider refund attempt failed; manual review is required.");
    }
    if (payment.paymentStatus !== "PAID" || payment.financialState !== "ESCROWED") {
      throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");
    }
    if (!payment.transactionRef) throw new Error("ESCROW_LOCK_REFERENCE_MISSING");

    // A card refund releases the escrow liability, but must not credit the buyer's
    // available wallet balance. Verify the exact successful lock and remaining escrow
    // before asking the provider to move real money.
    const escrowLock = await prisma.walletTransaction.findUnique({
      where: { reference: payment.transactionRef },
      include: { wallet: true },
    });
    if (
      !escrowLock ||
      escrowLock.type !== "ESCROW_LOCK" ||
      escrowLock.status !== "SUCCESS" ||
      escrowLock.wallet?.userId !== userId ||
      Math.abs(Number(escrowLock.amount) - amount) > 0.01
    ) {
      throw new Error("ESCROW_NOT_FUNDED");
    }
    const buyerWallet = escrowLock.wallet;
    if (!buyerWallet || Number(buyerWallet.escrow) + 0.01 < amount) {
      throw new Error("INSUFFICIENT_ESCROW");
    }

    const existingCardRefundLedger = await prisma.walletTransaction.findUnique({
      where: { reference: cardRefundReference },
    });
    if (existingCardRefundLedger) {
      throw new Error("REFUND_STATE_CONFLICT: A card-refund ledger entry exists while the payment is not marked refunded.");
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (
      !secretKey ||
      !gatewayId ||
      !payment.gatewayTransactionId ||
      payment.gatewayTransactionId !== gatewayId ||
      !/^\d+$/.test(gatewayId)
    ) {
      const manualClaim = await prisma.payment.updateMany({
        where: {
          id: payment.id,
          paymentStatus: "PAID",
          refundStatus: null,
          financialState: "ESCROWED",
        },
        data: { refundStatus: "MANUAL_REVIEW", financialState: "MANUAL_REVIEW" },
      });
      if (manualClaim.count !== 1) throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");
      await this.persistManualReviewFlag(
        userId,
        orderId,
        amount,
        !secretKey
          ? "Gateway not configured (missing FLUTTERWAVE_SECRET_KEY)"
          : "Verified provider transaction ID is missing or does not match the persisted payment."
      );
      throw new Error("CARD_REFUND_FAILED: Verified provider transaction ID or gateway configuration is missing. Manual review required.");
    }

    // Claim the single provider attempt before making the external call. This claim
    // races on the same Payment row as escrow release and wallet refunds.
    const claim = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        paymentStatus: "PAID",
        refundStatus: null,
        financialState: "ESCROWED",
        gatewayTransactionId: gatewayId,
      },
      data: { refundStatus: "PENDING", financialState: "REFUNDING" },
    });
    if (claim.count !== 1) {
      const current = await prisma.payment.findUnique({ where: { id: payment.id } });
      if (
        current?.paymentStatus === "REFUNDED" &&
        current.refundStatus === "SUCCEEDED" &&
        current.financialState === "REFUNDED"
      ) {
        const ledger = await prisma.walletTransaction.findUnique({
          where: { reference: cardRefundReference },
        });
        if (ledger?.status === "SUCCESS" && Math.abs(Number(ledger.amount) - amount) <= 0.01) {
          return { gatewayRefunded: true, alreadyRefunded: true, gatewayTransactionId: current.gatewayTransactionId };
        }
      }
      throw new Error("CARD_REFUND_PENDING_RECONCILIATION: Refund state changed before provider submission.");
    }

    let flwRes: Response;
    try {
      flwRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(gatewayId)}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount }),
        }
      );
    } catch (error: unknown) {
      await prisma.payment.updateMany({
        where: { id: payment.id, refundStatus: "PENDING", financialState: "REFUNDING" },
        data: { refundStatus: "MANUAL_REVIEW", financialState: "MANUAL_REVIEW" },
      });
      const message = error instanceof Error ? error.message : "Unknown network error";
      await this.persistManualReviewFlag(userId, orderId, amount, `Gateway refund outcome is unknown: ${message}`);
      throw new Error("CARD_REFUND_PENDING_RECONCILIATION: Gateway outcome is unknown; manual reconciliation required.");
    }

    const flwData = await flwRes.json().catch(() => ({}));
    if (!flwRes.ok || flwData.status !== "success") {
      const errMsg = flwData?.message || "Gateway returned non-success status";
      await prisma.payment.updateMany({
        where: { id: payment.id, refundStatus: "PENDING", financialState: "REFUNDING" },
        data: { refundStatus: "FAILED", financialState: "MANUAL_REVIEW" },
      });
      await this.persistManualReviewFlag(userId, orderId, amount, `Gateway rejection: ${errMsg}`);
      throw new Error(`CARD_REFUND_FAILED: ${errMsg}. Manual review required.`);
    }

    const providerRefundId = String(flwData.data?.id ?? flwData.data?.refund_id ?? "").trim() || null;
    try {
      await prisma.$transaction(async (tx) => {
        const finalized = await tx.payment.updateMany({
          where: {
            id: payment.id,
            paymentStatus: "PAID",
            refundStatus: "PENDING",
            financialState: "REFUNDING",
            gatewayTransactionId: gatewayId,
          },
          data: {
            paymentStatus: "REFUNDED",
            refundStatus: "SUCCEEDED",
            financialState: "REFUNDED",
            gatewayRefundId: providerRefundId,
          },
        });
        if (finalized.count !== 1) throw new Error("REFUND_STATE_FINALIZATION_CONFLICT");

        const escrowDebit = await tx.wallet.updateMany({
          where: { id: buyerWallet.id, escrow: { gte: amount } },
          data: { escrow: { decrement: amount } },
        });
        if (escrowDebit.count !== 1) throw new Error("INSUFFICIENT_ESCROW");

        await tx.walletTransaction.create({
          data: {
            walletId: buyerWallet.id,
            type: "REFUND",
            amount,
            reference: cardRefundReference,
            description: `Flutterwave confirmed refund to original card for Order #${order.orderNumber}; buyer escrow released without wallet balance credit.`,
            status: "SUCCESS",
          },
        });
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown persistence error";
      await prisma.payment.updateMany({
        where: { id: payment.id, refundStatus: "PENDING", financialState: "REFUNDING" },
        data: { refundStatus: "MANUAL_REVIEW", financialState: "MANUAL_REVIEW" },
      }).catch(() => undefined);
      await this.persistManualReviewFlag(
        userId,
        orderId,
        amount,
        `Provider refund succeeded but escrow finalization failed: ${message}`
      );
      throw new Error("CARD_REFUND_PENDING_RECONCILIATION: Provider refunded the charge but local escrow state requires manual reconciliation.");
    }

    console.log(`[FLUTTERWAVE_REFUND_SUCCESS] Refunded ₦${amount} to card for Order #${orderId}`);
    return {
      gatewayRefunded: true,
      alreadyRefunded: false,
      gatewayTransactionId: gatewayId,
      gatewayRefundId: providerRefundId,
    };
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
    if (!adminNotes.trim()) {
      throw new Error("STORE_CREDIT_REASON_REQUIRED: Administrative store credit requires an auditable reason.");
    }
    return this.executeRefund(userId, amount, orderId, true, adminNotes);
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
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "IN_TRANSIT", "DELIVERED"] },
      },
      include: {
        orderItems: { include: { product: true } },
        delivery: true,
        payment: true,
        disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
        sellerOrders: { select: { totalAmount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // The dashboard reports only funds still locked for paid orders. Partial multi-vendor
    // settlements reduce the displayed amount as their seller orders are completed.
    const protectedOrders = orders.filter((o) => o.payment?.paymentStatus === "PAID");
    const remainingEscrowForOrder = (order: (typeof protectedOrders)[number]) => {
      const sellerOrders = order.sellerOrders || [];
      if (sellerOrders.length === 0) return Number(order.totalAmount);
      return sellerOrders
        .filter((sellerOrder) => sellerOrder.status !== "COMPLETED")
        .reduce((sum, sellerOrder) => sum + Number(sellerOrder.totalAmount), 0);
    };
    const totalLockedEscrow = protectedOrders.reduce(
      (sum, order) => sum + remainingEscrowForOrder(order),
      0
    );

    const mappedOrders = protectedOrders.map((o) => {
      const remainingEscrow = remainingEscrowForOrder(o);
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
        amount: remainingEscrow,
        formattedAmount: this.formatNGN(remainingEscrow),
        status: o.status,
        deliveryStatus,
        logisticsProgress: progress,
        deliveryEta: o.delivery?.estimatedDelivery
          ? new Date(o.delivery.estimatedDelivery).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
          : "In Transit",
        milestone: `Logistics Checkpoint: ${deliveryStatus}`,
        canRelease: o.status === "DELIVERED" && remainingEscrow > 0 && o.payment?.paymentStatus === "PAID" && (o.disputes?.length || 0) === 0,
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
    targetSellerOrderId?: string,
    options: { allowActiveDispute?: boolean } = {}
  ) {
    const effectiveOrderId = maybeOrderId || userIdOrOrderId;
    const actorUserId = maybeOrderId ? userIdOrOrderId : null;

    const order = await prisma.order.findUnique({
      where: { id: effectiveOrderId },
      include: {
        buyer: true,
        payment: true,
        disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
        sellerOrders: {
          include: {
            farmerProfile: { include: { user: true } },
          },
        },
        orderItems: {
          include: {
            product: { include: { farmerProfile: true } },
          },
        },
      },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    const buyerUserId = order.buyer?.userId;
    if (!buyerUserId) throw new Error("ORDER_BUYER_NOT_FOUND");
    if (actorUserId && actorUserId !== buyerUserId) {
      throw new Error("ORDER_OWNER_MISMATCH");
    }
    if (order.status !== "DELIVERED") {
      throw new Error("ORDER_NOT_DELIVERED");
    }
    if (!order.payment || order.payment.paymentStatus !== "PAID") {
      throw new Error("PAYMENT_NOT_SETTLED");
    }
    if (order.payment.financialState !== "ESCROWED") {
      throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");
    }
    if (order.payment.refundStatus !== null && order.payment.refundStatus !== undefined) {
      throw new Error("REFUND_STATE_CONFLICT");
    }
    if ((order.disputes?.length || 0) > 0 && !options.allowActiveDispute) {
      throw new Error("ACTIVE_DISPUTE_BLOCKS_RELEASE");
    }
    if (!order.payment.transactionRef) {
      throw new Error("ESCROW_LOCK_REFERENCE_MISSING");
    }

    // A PAID flag is not sufficient proof of funds. The order must have the exact
    // successful escrow-lock ledger entry tied to its payment reference and buyer wallet.
    const lockTransaction = await prisma.walletTransaction.findUnique({
      where: { reference: order.payment.transactionRef },
      include: { wallet: true },
    });
    const orderAmount = Number(order.totalAmount);
    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      throw new Error("INVALID_ORDER_AMOUNT");
    }
    if (
      !lockTransaction ||
      lockTransaction.type !== "ESCROW_LOCK" ||
      lockTransaction.status !== "SUCCESS" ||
      lockTransaction.wallet?.userId !== buyerUserId ||
      Math.abs(Number(lockTransaction.amount) - orderAmount) > 0.01
    ) {
      throw new Error("ESCROW_NOT_FUNDED");
    }

    if (Math.abs(Number(order.payment.amount) - orderAmount) > 0.01) {
      throw new Error("PAYMENT_AMOUNT_MISMATCH");
    }

    const buyerWallet = lockTransaction.wallet;
    const allSellerOrders = order.sellerOrders || [];

    // Legacy single-order records have no SellerOrder rows. Claim the parent order
    // before posting any credits so replayed/concurrent releases cannot pay twice.
    if (allSellerOrders.length === 0) {
      const farmerGross = new Map<string, number>();
      for (const item of order.orderItems || []) {
        const farmerUserId = item.product?.farmerProfile?.userId;
        const gross = Number(item.subtotal);
        if (farmerUserId && Number.isFinite(gross) && gross > 0) {
          farmerGross.set(farmerUserId, (farmerGross.get(farmerUserId) || 0) + gross);
        }
      }
      if (farmerGross.size === 0) throw new Error("NO_SELLERS_FOR_ORDER");
      const totalFarmerGross = Array.from(farmerGross.values()).reduce((sum, value) => sum + value, 0);
      if (totalFarmerGross > orderAmount + 0.01) {
        throw new Error("SELLER_GROSS_EXCEEDS_ORDER_AMOUNT");
      }

      const currentEscrow = Number(buyerWallet.escrow);
      if (!Number.isFinite(currentEscrow) || currentEscrow < orderAmount) {
        throw new Error("INSUFFICIENT_ESCROW");
      }

      const farmerWallets = new Map<string, Awaited<ReturnType<typeof this.getOrCreateWallet>>>();
      for (const farmerUserId of farmerGross.keys()) {
        farmerWallets.set(farmerUserId, await this.getOrCreateWallet(farmerUserId));
      }

      let totalGrossSettled = 0;
      await prisma.$transaction(async (tx) => {
        const financialClaim = await tx.payment.updateMany({
          where: { id: order.payment!.id, paymentStatus: "PAID", financialState: "ESCROWED" },
          data: { financialState: "SETTLING" },
        });
        if (financialClaim.count !== 1) throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");

        const claim = await tx.order.updateMany({
          where: { id: order.id, status: "DELIVERED" },
          data: { status: "COMPLETED" },
        });
        if (claim.count !== 1) throw new Error("ESCROW_ALREADY_RELEASED");

        const debit = await tx.wallet.updateMany({
          where: { id: buyerWallet.id, escrow: { gte: orderAmount } },
          data: { escrow: { decrement: orderAmount } },
        });
        if (debit.count !== 1) throw new Error("INSUFFICIENT_ESCROW");

        await tx.walletTransaction.create({
          data: {
            walletId: buyerWallet.id,
            type: "ESCROW_RELEASE",
            amount: orderAmount,
            reference: `ESCROW-DRAIN-${order.orderNumber}`,
            description: `Buyer escrow debited for completed Order #${order.orderNumber}`,
            status: "SUCCESS",
          },
        });

        for (const [farmerUserId, grossAmount] of farmerGross.entries()) {
          const { netFarmerPayout, platformFee } = calculateSettlement(grossAmount);
          totalGrossSettled += grossAmount;
          const farmerWallet = farmerWallets.get(farmerUserId)!;

          await tx.wallet.update({
            where: { id: farmerWallet.id },
            data: { balance: { increment: netFarmerPayout } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: farmerWallet.id,
              type: "ESCROW_RELEASE",
              amount: netFarmerPayout,
              reference: `REL-${order.orderNumber}-${farmerUserId}`,
              description: `Escrow payout for Order #${order.orderNumber} (Gross: ₦${grossAmount}, Fee: ₦${platformFee})`,
              status: "SUCCESS",
            },
          });
        }

        const finalized = await tx.payment.updateMany({
          where: { id: order.payment!.id, financialState: "SETTLING" },
          data: { financialState: "SETTLED" },
        });
        if (finalized.count !== 1) throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");
      });

      return {
        success: true,
        settledCount: farmerGross.size,
        totalGrossSettled,
        totalEscrowReleased: orderAmount,
      };
    }

    const sellerOrdersToSettle = targetSellerOrderId
      ? allSellerOrders.filter((sellerOrder) => sellerOrder.id === targetSellerOrderId)
      : allSellerOrders.filter((sellerOrder) => sellerOrder.status !== "COMPLETED");

    if (targetSellerOrderId && sellerOrdersToSettle.length === 0) {
      throw new Error("SELLER_ORDER_NOT_FOUND");
    }
    if (sellerOrdersToSettle.length === 0) {
      throw new Error("ESCROW_ALREADY_RELEASED");
    }

    for (const sellerOrder of sellerOrdersToSettle) {
      if (sellerOrder.status !== "DELIVERED") {
        throw new Error("SELLER_ORDER_NOT_DELIVERED");
      }
      if (!sellerOrder.farmerProfile?.userId) {
        throw new Error("SELLER_USER_NOT_FOUND");
      }
    }

    // Validate every sub-order, including previously completed rows, before using their
    // totals to calculate remaining escrow. Corrupt historical totals must stop settlement.
    for (const sellerOrder of allSellerOrders) {
      const commoditySubtotal = Number(sellerOrder.subtotal);
      const shippingFee = Number(sellerOrder.shippingFee ?? 0);
      const sellerOrderTotal = Number(sellerOrder.totalAmount);
      if (
        ![commoditySubtotal, shippingFee, sellerOrderTotal].every(Number.isFinite) ||
        commoditySubtotal <= 0 ||
        shippingFee < 0 ||
        sellerOrderTotal <= 0
      ) {
        throw new Error("INVALID_SELLER_ORDER_AMOUNT");
      }
      if (Math.abs(commoditySubtotal + shippingFee - sellerOrderTotal) > 0.01) {
        throw new Error("SELLER_ORDER_TOTAL_MISMATCH");
      }
    }

    const completedSellerGross = allSellerOrders
      .filter((sellerOrder) => sellerOrder.status === "COMPLETED")
      .reduce((sum, sellerOrder) => sum + Number(sellerOrder.totalAmount), 0);
    const remainingOrderEscrow = Number((orderAmount - completedSellerGross).toFixed(2));
    const totalEscrowToRelease = sellerOrdersToSettle.reduce(
      (sum, sellerOrder) => sum + Number(sellerOrder.totalAmount),
      0
    );
    if (
      remainingOrderEscrow < -0.01 ||
      totalEscrowToRelease > remainingOrderEscrow + 0.01 ||
      (!targetSellerOrderId && Math.abs(totalEscrowToRelease - remainingOrderEscrow) > 0.01)
    ) {
      throw new Error("SELLER_ORDER_TOTAL_MISMATCH");
    }

    const currentEscrow = Number(buyerWallet.escrow);
    if (!Number.isFinite(currentEscrow) || currentEscrow < totalEscrowToRelease) {
      throw new Error("INSUFFICIENT_ESCROW");
    }

    const farmerWallets = new Map<string, Awaited<ReturnType<typeof this.getOrCreateWallet>>>();
    for (const sellerOrder of sellerOrdersToSettle) {
      const farmerUserId = sellerOrder.farmerProfile.userId;
      if (!farmerWallets.has(farmerUserId)) {
        farmerWallets.set(farmerUserId, await this.getOrCreateWallet(farmerUserId));
      }
    }

    let totalGrossSettled = 0;
    await prisma.$transaction(async (tx) => {
      const financialClaim = await tx.payment.updateMany({
        where: { id: order.payment!.id, paymentStatus: "PAID", financialState: "ESCROWED" },
        data: { financialState: "SETTLING" },
      });
      if (financialClaim.count !== 1) throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");

      // Compare-and-set each seller order before crediting any wallet. If another request
      // has already claimed a seller order, the transaction rolls back all changes.
      for (const sellerOrder of sellerOrdersToSettle) {
        const claim = await tx.sellerOrder.updateMany({
          where: { id: sellerOrder.id, status: "DELIVERED" },
          data: {
            status: "COMPLETED",
            deliveredAt: sellerOrder.deliveredAt || new Date(),
          },
        });
        if (claim.count !== 1) throw new Error("ESCROW_ALREADY_RELEASED");
      }

      const debit = await tx.wallet.updateMany({
        where: { id: buyerWallet.id, escrow: { gte: totalEscrowToRelease } },
        data: { escrow: { decrement: totalEscrowToRelease } },
      });
      if (debit.count !== 1) throw new Error("INSUFFICIENT_ESCROW");

      for (const sellerOrder of sellerOrdersToSettle) {
        const farmerUserId = sellerOrder.farmerProfile.userId;
        const grossAmount = Number(sellerOrder.subtotal);
        const fullOrderAmount = Number(sellerOrder.totalAmount);
        const { netFarmerPayout, platformFee } = calculateSettlement(grossAmount);
        totalGrossSettled += grossAmount;
        const farmerWallet = farmerWallets.get(farmerUserId)!;

        await tx.wallet.update({
          where: { id: farmerWallet.id },
          data: { balance: { increment: netFarmerPayout } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: farmerWallet.id,
            type: "ESCROW_RELEASE",
            amount: netFarmerPayout,
            reference: `REL-${sellerOrder.sellerOrderNumber}`,
            description: `Escrow payout for Sub-Order #${sellerOrder.sellerOrderNumber} (Order #${order.orderNumber}). Commodity gross: ₦${grossAmount}, Fee: ₦${platformFee}`,
            status: "SUCCESS",
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: buyerWallet.id,
            type: "ESCROW_RELEASE",
            amount: fullOrderAmount,
            reference: `ESCROW-DRAIN-${sellerOrder.sellerOrderNumber}`,
            description: `Buyer escrow debited for Sub-Order #${sellerOrder.sellerOrderNumber} (Order #${order.orderNumber})`,
            status: "SUCCESS",
          },
        });
      }

      const pendingSellerOrderCount = await tx.sellerOrder.count({
        where: { orderId: order.id, status: { not: "COMPLETED" } },
      });
      if (pendingSellerOrderCount === 0) {
        const parentClaim = await tx.order.updateMany({
          where: { id: order.id, status: "DELIVERED" },
          data: { status: "COMPLETED" },
        });
        if (parentClaim.count !== 1) throw new Error("ESCROW_ALREADY_RELEASED");
      }

      const finalized = await tx.payment.updateMany({
        where: { id: order.payment!.id, financialState: "SETTLING" },
        data: { financialState: pendingSellerOrderCount === 0 ? "SETTLED" : "ESCROWED" },
      });
      if (finalized.count !== 1) throw new Error("PAYMENT_FINANCIAL_STATE_CONFLICT");
    });

    console.log(
      `[MULTI_VENDOR_ESCROW_RELEASE] Order #${order.orderNumber}: Settled ${sellerOrdersToSettle.length} seller orders. Gross: ₦${totalGrossSettled}; escrow: ₦${totalEscrowToRelease}`
    );

    return {
      success: true,
      settledSellerOrdersCount: sellerOrdersToSettle.length,
      totalGrossSettled,
      totalEscrowReleased: totalEscrowToRelease,
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
    paidAmount: number,
    gatewayTransactionId: string
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

      if (!/^\d+$/.test(gatewayTransactionId)) {
        throw new Error("INVALID_GATEWAY_TRANSACTION_ID");
      }

      // The persisted payment intent is authoritative. A caller may not use an order ID
      // or payment ID to bind a different gateway transaction to this order.
      if (payment.transactionRef !== transactionRef) {
        throw new Error("TRANSACTION_REFERENCE_MISMATCH");
      }

      // Idempotency is safe only for the same verified gateway reference.
      if (payment.paymentStatus === "REFUNDED" && payment.refundStatus === "SUCCEEDED") {
        if (payment.gatewayTransactionId !== gatewayTransactionId) {
          throw new Error("GATEWAY_TRANSACTION_ID_MISMATCH");
        }
        return { status: "ALREADY_REFUNDED", payment };
      }

      if (payment.paymentStatus === "PAID") {
        if (
          payment.gatewayTransactionId &&
          payment.gatewayTransactionId !== gatewayTransactionId
        ) {
          throw new Error("GATEWAY_TRANSACTION_ID_MISMATCH");
        }
        return { status: "ALREADY_SETTLED", payment };
      }
      if (payment.paymentStatus !== "PENDING") {
        throw new Error(`PAYMENT_NOT_PENDING: Current payment state is ${payment.paymentStatus}.`);
      }
      if (payment.paymentMethod !== "CARD") {
        throw new Error("PAYMENT_METHOD_MISMATCH");
      }
      if (payment.order.status !== "PENDING") {
        throw new Error(`ORDER_NOT_PAYABLE: Current order state is ${payment.order.status}.`);
      }

      const expectedAmount = Number(payment.amount);
      if (
        !Number.isFinite(paidAmount) ||
        Math.abs(paidAmount - expectedAmount) > 0.01 ||
        Math.abs(Number(payment.order.totalAmount) - expectedAmount) > 0.01
      ) {
        throw new Error(
          `AMOUNT_MISMATCH: Gateway paid amount (₦${paidAmount}) does not match the persisted order/payment amount (₦${expectedAmount}).`
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

      // 3. Claim the pending payment and order with compare-and-set guards. Concurrent
      // webhook retries must not both increment the escrow balance.
      const paymentClaim = await tx.payment.updateMany({
        where: {
          id: payment.id,
          paymentStatus: "PENDING",
          transactionRef,
        },
        data: {
          paymentStatus: "PAID",
          financialState: "ESCROWED",
          refundStatus: null,
          paidAt: new Date(),
          gatewayTransactionId,
        },
      });
      if (paymentClaim.count !== 1) {
        const current = await tx.payment.findUnique({ where: { id: payment.id } });
        if (current?.paymentStatus === "PAID" && current.transactionRef === transactionRef) {
          return { status: "ALREADY_SETTLED", payment: current };
        }
        throw new Error("PAYMENT_STATE_CONFLICT");
      }

      const orderClaim = await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
      if (orderClaim.count !== 1) {
        throw new Error("ORDER_STATE_CONFLICT");
      }

      const updatedPayment = await tx.payment.findUnique({ where: { id: payment.id } });

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

