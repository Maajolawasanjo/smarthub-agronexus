export type EnterpriseRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "COMPLIANCE_OFFICER"
  | "FINANCE_OFFICER"
  | "SUPPORT_AGENT"
  | "LOGISTICS_MANAGER"
  | "BUYER"
  | "FARMER";

export type Permission =
  | "users:freeze"
  | "users:unfreeze"
  | "payments:refund"
  | "ledger:export"
  | "audit:view"
  | "config:update"
  | "config:view"
  | "kyc:review"
  | "dispute:resolve"
  | "orders:create"
  | "orders:cancel"
  | "reviews:create"
  | "produce:create"
  | "produce:update"
  | "withdraw:request";

const ROLE_PERMISSIONS: Record<EnterpriseRole, Permission[]> = {
  SUPER_ADMIN: [
    "users:freeze",
    "users:unfreeze",
    "payments:refund",
    "ledger:export",
    "audit:view",
    "config:update",
    "config:view",
    "kyc:review",
    "dispute:resolve",
    "orders:create",
    "orders:cancel",
    "reviews:create",
    "produce:create",
    "produce:update",
    "withdraw:request",
  ],
  ADMIN: [
    "users:freeze",
    "users:unfreeze",
    "payments:refund",
    "ledger:export",
    "audit:view",
    "config:update",
    "config:view",
    "kyc:review",
    "dispute:resolve",
  ],
  FINANCE_OFFICER: ["payments:refund", "ledger:export", "audit:view", "config:view"],
  COMPLIANCE_OFFICER: ["users:freeze", "users:unfreeze", "kyc:review", "audit:view"],
  SUPPORT_AGENT: ["audit:view", "dispute:resolve"],
  LOGISTICS_MANAGER: ["audit:view"],
  BUYER: ["orders:create", "orders:cancel", "reviews:create"],
  FARMER: ["produce:create", "produce:update", "withdraw:request"],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = (role || "").toUpperCase() as EnterpriseRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
}
