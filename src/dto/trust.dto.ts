import { VerificationTimelineItem, TrustPolicy } from "@/lib/trust";

export interface VerificationDocumentDTO {
  id: string;
  documentType: string;
  documentNumber: string | null;
  documentUrl: string;
  submittedAt: string;
}

export interface VerificationReviewerDTO {
  id: string;
  fullName: string;
  email: string;
}

export interface VerificationDTO {
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
  farmer?: {
    id: string;
    farmName: string;
    farmAddress: string;
    state: string;
    lga: string;
  };
  status: string; // Business language: "UNVERIFIED" | "PENDING_REVIEW" | "VERIFIED_PRODUCER" | "REJECTED"
  badge: {
    code: string;
    label: string;
    description: string;
  };
  verificationStage: string;
  verificationTimeline: VerificationTimelineItem[];
  document: VerificationDocumentDTO | null;
  reviewer: VerificationReviewerDTO | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  remarks: string | null;

  // Domain Eligibility & Capabilities
  canPublishProducts: boolean;
  canWithdraw: boolean;
  canReceiveEscrow: boolean;
  dailyWithdrawalLimit: number;
  listingLimit: number;
  marketplaceVisible: boolean;
  nextRequiredAction: string;
  resubmissionAllowed: boolean;
}

export interface AdminQueueItemDTO {
  verificationId: string;
  farmerProfileId: string;
  farmerName: string;
  farmName: string;
  email: string;
  phoneNumber: string;
  location: string;
  documentType: string;
  documentNumber: string | null;
  documentUrl: string;
  submittedAt: string;
  status: string;
  remarks: string | null;
}

export interface AdminVerificationQueueDTO {
  statistics: {
    pendingCount: number;
    approvedToday: number;
    rejectedToday: number;
    averageReviewTimeMinutes: number;
    totalVerifications: number;
  };
  queue: AdminQueueItemDTO[];
}
