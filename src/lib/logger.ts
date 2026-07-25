/**
 * Production Structured Logger for SmartHub AgroChain
 * Handles audit logging for Auth, Commerce, Wallet, and Admin events.
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "SECURITY";

interface LogContext {
  userId?: string;
  role?: string;
  action?: string;
  orderId?: string;
  path?: string;
  [key: string]: any;
}

export const logger = {
  info(message: string, context?: LogContext) {
    this.log("INFO", message, context);
  },

  warn(message: string, context?: LogContext) {
    this.log("WARN", message, context);
  },

  error(message: string, error?: any, context?: LogContext) {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined }
      : error;

    this.log("ERROR", message, { ...context, error: errorDetails });
  },

  security(message: string, context?: LogContext) {
    this.log("SECURITY", `[SECURITY ALERT] ${message}`, context);
  },

  log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    
    // Sanitize context to prevent leaking sensitive fields
    const sanitizedContext = context ? { ...context } : {};
    delete sanitizedContext.password;
    delete sanitizedContext.passwordHash;
    delete sanitizedContext.token;
    delete sanitizedContext.secret;
    delete sanitizedContext.creditCard;

    const logEntry = {
      timestamp,
      level,
      message,
      environment: process.env.NODE_ENV || "development",
      ...sanitizedContext,
    };

    if (level === "ERROR" || level === "SECURITY") {
      console.error(JSON.stringify(logEntry));
    } else if (level === "WARN") {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  },
};
