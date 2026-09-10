import { defaultEmailAdapter, defaultSMSAdapter, EmailPayload, SMSPayload, DispatchResult } from "./adapters";
import { prisma } from "@/lib/prisma";

export interface OutboxItem {
  id: string;
  type: "EMAIL" | "SMS";
  payload: EmailPayload | SMSPayload;
  attempts: number;
  maxRetries: number;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "DEAD_LETTER_QUEUE";
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DB-backed Outbox Manager
 * Persists all email/SMS notifications to the NotificationOutbox table so they
 * survive server restarts and work correctly across all serverless instances.
 */
class OutboxManager {
  async enqueueEmail(payload: EmailPayload): Promise<OutboxItem> {
    const record = await prisma.notificationOutbox.create({
      data: {
        channel: "EMAIL",
        recipient: payload.to,
        subject: payload.subject,
        payload: payload as any,
        status: "PENDING",
        maxAttempts: 3,
      },
    });
    return this.toOutboxItem(record, "EMAIL");
  }

  async enqueueSMS(payload: SMSPayload): Promise<OutboxItem> {
    const record = await prisma.notificationOutbox.create({
      data: {
        channel: "SMS",
        recipient: payload.to,
        payload: payload as any,
        status: "PENDING",
        maxAttempts: 3,
      },
    });
    return this.toOutboxItem(record, "SMS");
  }

  async processQueue(): Promise<{ processed: number; failures: number }> {
    let processed = 0;
    let failures = 0;
    const now = new Date();

    // Fetch pending items that are due for processing
    const pendingItems = await prisma.notificationOutbox.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        availableAt: { lte: now },
        attempts: { lt: prisma.notificationOutbox.fields.maxAttempts },
      },
      orderBy: { availableAt: "asc" },
      take: 50,
    });

    for (const item of pendingItems) {
      // Mark as PROCESSING atomically
      await prisma.notificationOutbox.update({
        where: { id: item.id },
        data: { status: "PROCESSING" },
      });

      try {
        let res: DispatchResult;
        const itemPayload = item.payload as any;

        if (item.channel === "EMAIL") {
          res = await defaultEmailAdapter.sendEmail(itemPayload as EmailPayload);
        } else {
          res = await defaultSMSAdapter.sendSMS(itemPayload as SMSPayload);
        }

        if (res.success) {
          await prisma.notificationOutbox.update({
            where: { id: item.id },
            data: {
              status: "SENT",
              processedAt: new Date(),
              attempts: { increment: 1 },
            },
          });
          processed += 1;

          // Create in-app notification record (non-blocking, soft-fail)
          const recipientEmailOrPhone = item.recipient;
          prisma.user.findFirst({
            where: {
              OR: [
                { email: recipientEmailOrPhone },
                { phoneNumber: recipientEmailOrPhone },
              ],
            },
          }).then(async (user) => {
            if (user) {
              const title = item.channel === "EMAIL" ? (item.subject || "Notification") : "SMS Alert";
              const message = item.channel === "EMAIL"
                ? `Template: ${(itemPayload as EmailPayload).template}`
                : (itemPayload as SMSPayload).message;
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  title,
                  message: message || "System update",
                  type: "SYSTEM",
                  isRead: false,
                },
              });
            }
          }).catch(() => { /* Soft fail — never disrupt main flow */ });
        } else {
          throw new Error(res.error || "Dispatch failed");
        }
      } catch (err: any) {
        failures += 1;
        const newAttempts = item.attempts + 1;
        const isExhausted = newAttempts >= item.maxAttempts;

        // Exponential backoff: retry after attempts * 5 minutes
        const nextAvailableAt = new Date(Date.now() + newAttempts * 5 * 60 * 1000);

        await prisma.notificationOutbox.update({
          where: { id: item.id },
          data: {
            status: isExhausted ? "FAILED" : "FAILED",
            attempts: { increment: 1 },
            lastError: err.message || "Network error",
            availableAt: isExhausted ? item.availableAt : nextAvailableAt,
          },
        });
      }
    }

    return { processed, failures };
  }

  async getQueueStatus() {
    const [pendingCount, sentCount, failedCount, totalCount] = await Promise.all([
      prisma.notificationOutbox.count({ where: { status: "PENDING" } }),
      prisma.notificationOutbox.count({ where: { status: "SENT" } }),
      prisma.notificationOutbox.count({ where: { status: "FAILED" } }),
      prisma.notificationOutbox.count({}),
    ]);

    return { pendingCount, sentCount, dlqCount: failedCount, totalCount };
  }

  private toOutboxItem(record: any, type: "EMAIL" | "SMS"): OutboxItem {
    return {
      id: record.id,
      type,
      payload: record.payload as any,
      attempts: record.attempts,
      maxRetries: record.maxAttempts,
      status: record.status === "SENT" ? "SENT" : record.status === "FAILED" ? "FAILED" : "PENDING",
      lastError: record.lastError || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export const notificationOutbox = new OutboxManager();
