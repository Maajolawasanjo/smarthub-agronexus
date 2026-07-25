export interface AuthenticatedUserDTO {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "BUYER" | "FARMER" | "ADMIN";
  profileImage?: string;
  isActive: boolean;
}

export interface ProfileCompletionDTO {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  recommendedNextAction: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: "SYSTEM" | "ORDER" | "PAYMENT" | "DELIVERY";
  isRead: boolean;
  createdAt: string;
}

export interface ActivityItemDTO {
  id: string;
  title: string;
  description: string;
  type: "ORDER" | "PAYMENT" | "PRODUCT" | "KYC" | "DISPUTE";
  status: string;
  timestamp: string;
}

export interface QuickActionDTO {
  id: string;
  title: string;
  description: string;
  href: string;
  iconName: string;
}

export interface DashboardDTO {
  user: AuthenticatedUserDTO;
  profileSummary: {
    address?: string;
    state?: string;
    lga?: string;
    isProfileComplete: boolean;
  };
  walletSummary: {
    availableBalance: number;
    escrowBalance: number;
    totalSpent: number;
  };
  statistics: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    pendingDeliveries: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    produce: string;
    farmer: string;
    amount: number;
    status: string;
    date: string;
  }>;
  recentActivity: ActivityItemDTO[];
  notifications: NotificationDTO[];
  quickActions: QuickActionDTO[];
  profileCompletion: ProfileCompletionDTO;
}
