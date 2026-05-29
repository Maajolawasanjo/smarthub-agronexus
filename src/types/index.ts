/**
 * Shared application types.
 * Domain-specific types for features should live alongside their feature module.
 */

export type UserRole = "buyer" | "farmer";

export type CurrencyCode = "usd" | "eur" | "gbp" | "ngn";

export interface UserProfile {
    name: string;
    email: string;
    password?: string;
    profileImage: string;
    currency: CurrencyCode;
    country: string;
    address: string;
}

export interface ToastVariant {
    type: "success" | "error" | "info" | "warning";
    message: string;
}
