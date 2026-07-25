import { defaultEmailAdapter, defaultSMSAdapter, EmailPayload, SMSPayload, DispatchResult } from "./adapters";

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

class OutboxManager {
  private queue: OutboxItem[] = [];
  private deadLetterQueue: OutboxItem[] = [];

  enqueueEmail(payload: EmailPayload): OutboxItem {
    const item: OutboxItem = {
      id: `outbox-email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "EMAIL",
      payload,
      attempts: 0,
      maxRetries: 3,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.queue.push(item);
    return item;
  }

  enqueueSMS(payload: SMSPayload): OutboxItem {
    const item: OutboxItem = {
      id: `outbox-sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "SMS",
      payload,
      attempts: 0,
      maxRetries: 3,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.queue.push(item);
    return item;
  }

  async processQueue(): Promise<{ processed: number; failures: number }> {
    let processed = 0;
    let failures = 0;

    for (const item of this.queue.filter((i) => i.status === "PENDING" || i.status === "FAILED")) {
      item.status = "PROCESSING";
      item.attempts += 1;
      item.updatedAt = new Date().toISOString();

      try {
        let res: DispatchResult;
        if (item.type === "EMAIL") {
          res = await defaultEmailAdapter.sendEmail(item.payload as EmailPayload);
        } else {
          res = await defaultSMSAdapter.sendSMS(item.payload as SMSPayload);
        }

        if (res.success) {
          item.status = "SENT";
          processed += 1;
        } else {
          throw new Error(res.error || "Dispatch failed");
        }
      } catch (err: any) {
        item.lastError = err.message || "Network error";
        failures += 1;

        if (item.attempts >= item.maxRetries) {
          item.status = "DEAD_LETTER_QUEUE";
          this.deadLetterQueue.push(item);
        } else {
          item.status = "FAILED";
        }
      }
    }

    return { processed, failures };
  }

  getQueueStatus() {
    return {
      pendingCount: this.queue.filter((i) => i.status === "PENDING").length,
      sentCount: this.queue.filter((i) => i.status === "SENT").length,
      dlqCount: this.deadLetterQueue.length,
      totalCount: this.queue.length,
    };
  }
}

export const notificationOutbox = new OutboxManager();
