// Communication Adapter Interfaces & Provider Implementation
export interface EmailPayload {
  to: string;
  subject: string;
  template:
    | "WELCOME"
    | "PASSWORD_RESET"
    | "KYC_SUBMITTED"
    | "KYC_APPROVED"
    | "KYC_REJECTED"
    | "ORDER_PLACED"
    | "ORDER_SHIPPED"
    | "ORDER_DELIVERED"
    | "WITHDRAWAL_COMPLETED"
    | "DISPUTE_UPDATE";
  data: Record<string, any>;
}

export interface SMSPayload {
  to: string;
  message: string;
  type: "OTP" | "ORDER_SHIPPED" | "DRIVER_ARRIVING" | "WITHDRAWAL_COMPLETED" | "KYC_APPROVED";
}

export interface DispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: string;
}

// ── Email Adapter Implementation (Resend Provider) ──
export class ResendEmailAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
  }

  async sendEmail(payload: EmailPayload): Promise<DispatchResult> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV === "test") {
        console.log(`[EmailAdapter:Resend] Sending '${payload.template}' email to ${payload.to}`);
        return {
          success: true,
          messageId: `msg-email-${Date.now()}`,
          provider: "Resend",
          timestamp: new Date().toISOString(),
        };
      }
      return {
        success: false,
        error: "RESEND_API_KEY is not configured",
        provider: "Resend",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SmartHub AgroChain <notifications@smarthub.ng>",
          to: [payload.to],
          subject: payload.subject,
          html: `<p>${payload.subject}</p><pre>${JSON.stringify(payload.data || {}, null, 2)}</pre>`,
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          success: false,
          error: resData.message || `Resend API returned status ${response.status}`,
          provider: "Resend",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        messageId: resData.id || `msg-resend-${Date.now()}`,
        provider: "Resend",
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Network failure during email dispatch",
        provider: "Resend",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// ── SMS Adapter Implementation (Termii Provider) ──
export class TermiiSMSAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TERMII_API_KEY || "";
  }

  async sendSMS(payload: SMSPayload): Promise<DispatchResult> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV === "test") {
        console.log(`[SMSAdapter:Termii] Sending '${payload.type}' SMS to ${payload.to}`);
        return {
          success: true,
          messageId: `msg-sms-${Date.now()}`,
          provider: "Termii",
          timestamp: new Date().toISOString(),
        };
      }
      return {
        success: false,
        error: "TERMII_API_KEY is not configured",
        provider: "Termii",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: payload.to,
          from: "AgroChain",
          sms: payload.message,
          type: "plain",
          channel: "generic",
          api_key: this.apiKey,
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok || resData.code !== "ok") {
        return {
          success: false,
          error: resData.message || `Termii API returned status ${response.status}`,
          provider: "Termii",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        messageId: resData.message_id || `msg-termii-${Date.now()}`,
        provider: "Termii",
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Network failure during SMS dispatch",
        provider: "Termii",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const defaultEmailAdapter = new ResendEmailAdapter();
export const defaultSMSAdapter = new TermiiSMSAdapter();
