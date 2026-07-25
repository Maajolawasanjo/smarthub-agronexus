/**
 * Custom Domain Error Hierarchy for SmartHub AgroChain
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: any[];

  constructor(message: string, code: string = "INTERNAL_SERVER_ERROR", statusCode: number = 500, details: any[] = []) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: any[] = []) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Authorization required for this operation.") {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Requested resource not found.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class EscrowError extends AppError {
  constructor(message: string) {
    super(message, "ESCROW_ERROR", 400);
  }
}

export class SettlementError extends AppError {
  constructor(message: string) {
    super(message, "SETTLEMENT_ERROR", 400);
  }
}

export class TrustError extends AppError {
  constructor(message: string) {
    super(message, "TRUST_POLICY_VIOLATION", 403);
  }
}
