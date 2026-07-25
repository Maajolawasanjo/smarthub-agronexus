/**
 * Trust Engine for SmartHub AgroChain
 * Centralized business policy governing verification, badges, listing eligibility,
 * wallet withdrawal limits, and platform capabilities.
 */

export type TrustTier = "UNVERIFIED" | "VERIFIED_PRODUCER" | "ENTERPRISE";
export type VerificationStage = "REGISTRATION" | "PROFILE_COMPLETED" | "DOCUMENT_UPLOADED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

export interface TrustPolicy {
  tier: TrustTier;
  badge: {
    code: string;
    label: string;
    description: string;
  };
  canPublishProducts: boolean;
  canWithdraw: boolean;
  canReceiveEscrow: boolean;
  dailyWithdrawalLimit: number;
  listingLimit: number; // -1 for unlimited
  marketplaceVisible: boolean;
  prioritySupport: boolean;
}

export const TRUST_POLICIES: Record<TrustTier, TrustPolicy> = {
  UNVERIFIED: {
    tier: "UNVERIFIED",
    badge: {
      code: "PENDING_REVIEW",
      label: "Pending Verification",
      description: "Produce listings are subject to Tier 1 standard limits.",
    },
    canPublishProducts: true,
    canWithdraw: true,
    canReceiveEscrow: true,
    dailyWithdrawalLimit: 1000, // $1,000 / day
    listingLimit: 3, // Max 3 active produce listings
    marketplaceVisible: true,
    prioritySupport: false,
  },
  VERIFIED_PRODUCER: {
    tier: "VERIFIED_PRODUCER",
    badge: {
      code: "VERIFIED_PRODUCER",
      label: "Verified Producer",
      description: "Government & identity verified agricultural producer.",
    },
    canPublishProducts: true,
    canWithdraw: true,
    canReceiveEscrow: true,
    dailyWithdrawalLimit: 100000, // $100,000 / day
    listingLimit: -1, // Unlimited listings
    marketplaceVisible: true,
    prioritySupport: true,
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    badge: {
      code: "ENTERPRISE_PRODUCER",
      label: "Enterprise Agro Partner",
      description: "High-capacity commercial agro enterprise.",
    },
    canPublishProducts: true,
    canWithdraw: true,
    canReceiveEscrow: true,
    dailyWithdrawalLimit: 500000, // $500,000 / day
    listingLimit: -1,
    marketplaceVisible: true,
    prioritySupport: true,
  },
};

export interface VerificationTimelineItem {
  stage: string;
  label: string;
  description: string;
  date: string | null;
  status: "completed" | "current" | "upcoming";
}

/**
 * Evaluates full trust policy based on DB status and user state
 */
export function evaluateTrustPolicy(verificationStatus?: string | null): TrustPolicy {
  if (verificationStatus === "APPROVED") {
    return TRUST_POLICIES.VERIFIED_PRODUCER;
  }
  return TRUST_POLICIES.UNVERIFIED;
}

/**
 * Calculates current verification stage
 */
export function calculateVerificationStage(
  hasProfile: boolean,
  hasDocument: boolean,
  status?: string | null
): VerificationStage {
  if (!hasProfile) return "REGISTRATION";
  if (status === "APPROVED") return "VERIFIED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "PENDING" && hasDocument) return "PENDING_REVIEW";
  if (hasDocument) return "DOCUMENT_UPLOADED";
  return "PROFILE_COMPLETED";
}

/**
 * Generates dynamic verification timeline server-side
 */
export function generateVerificationTimeline(
  userCreatedAt: Date,
  verification?: { createdAt: Date; reviewedAt?: Date | null } | null,
  status?: string | null
): VerificationTimelineItem[] {
  const isApproved = status === "APPROVED";
  const isRejected = status === "REJECTED";
  const isPending = status === "PENDING";
  const hasDoc = Boolean(verification);

  return [
    {
      stage: "REGISTRATION",
      label: "Account Created",
      description: "Initial user registration on SmartHub AgroChain.",
      date: userCreatedAt.toISOString(),
      status: "completed",
    },
    {
      stage: "DOCUMENT_UPLOADED",
      label: "Identity Document Uploaded",
      description: "Government-issued ID or CAC certificate submitted.",
      date: verification ? verification.createdAt.toISOString() : null,
      status: hasDoc ? "completed" : "current",
    },
    {
      stage: "PENDING_REVIEW",
      label: "Admin Review Queue",
      description: "Compliance team review and document validation.",
      date: verification?.createdAt ? verification.createdAt.toISOString() : null,
      status: isPending ? "current" : (isApproved || isRejected) ? "completed" : "upcoming",
    },
    {
      stage: "VERIFIED",
      label: isRejected ? "Verification Rejected" : "Verified Producer",
      description: isRejected
        ? "Document verification failed. Resubmission allowed."
        : isApproved
        ? "Identity verified. Tier 2 commercial limits granted."
        : "Pending final review decision.",
      date: verification?.reviewedAt ? verification.reviewedAt.toISOString() : null,
      status: isApproved ? "completed" : isRejected ? "current" : "upcoming",
    },
  ];
}

/**
 * Calculates next required user action
 */
export function calculateNextAction(
  stage: VerificationStage,
  remarks?: string | null
): string {
  switch (stage) {
    case "REGISTRATION":
    case "PROFILE_COMPLETED":
      return "Upload a valid government-issued ID or farm registration certificate to unlock Tier 2 features.";
    case "DOCUMENT_UPLOADED":
    case "PENDING_REVIEW":
      return "Your documents are in the review queue. Verification usually completes within 24 hours.";
    case "REJECTED":
      return `Review remarks: "${remarks || "Document unclear"}". Please re-upload a clear government ID.`;
    case "VERIFIED":
      return "Your account is fully verified. Enjoy unlimited listings and elevated transaction limits!";
    default:
      return "Complete your profile information.";
  }
}
