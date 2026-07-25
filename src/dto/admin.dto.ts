import { AuthenticatedUserDTO, ActivityItemDTO, NotificationDTO, QuickActionDTO } from "./dashboard.dto";

export interface AdminDashboardDTO {
  user: AuthenticatedUserDTO;
  statistics: {
    totalTradeVolume: number;
    totalProducts: number;
    pendingProducts: number;
    totalFarmers: number;
    totalBuyers: number;
    completedOrdersCount: number;
    pendingVerifications: number;
    openDisputes: number;
  };
  moderationQueue: Array<{
    id: string;
    type: "PRODUCT_MODERATION" | "KYC_VERIFICATION" | "DISPUTE_ARBITRATION";
    title: string;
    submittedBy: string;
    status: string;
    date: string;
  }>;
  recentActivity: ActivityItemDTO[];
  notifications: NotificationDTO[];
  quickActions: QuickActionDTO[];
}
