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

// ── Email Adapter Implementation (Resend / Production Plug-in) ──
export class ResendEmailAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "mock-resend-key";
  }

  async sendEmail(payload: EmailPayload): Promise<DispatchResult> {
    console.log(`[EmailAdapter:Resend] Sending '${payload.template}' email to ${payload.to}`);
    return {
      success: true,
      messageId: `msg-email-${Date.now()}`,
      provider: "Resend",
      timestamp: new Date().toISOString(),
    };
  }
}

// ── SMS Adapter Implementation (Termii / Twilio Plug-in) ──
export class TermiiSMSAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TERMII_API_KEY || "mock-termii-key";
  }

  async sendSMS(payload: SMSPayload): Promise<DispatchResult> {
    console.log(`[SMSAdapter:Termii] Sending '${payload.type}' SMS to ${payload.to}`);
    return {
      success: true,
      messageId: `msg-sms-${Date.now()}`,
      provider: "Termii",
      timestamp: new Date().toISOString(),
    };
  }
}

export const defaultEmailAdapter = new ResendEmailAdapter();
export const defaultSMSAdapter = new TermiiSMSAdapter();
