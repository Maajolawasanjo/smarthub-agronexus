import { AuthenticatedUserDTO, ActivityItemDTO, QuickActionDTO, ProfileCompletionDTO } from "./dashboard.dto";

export interface FarmerDashboardDTO {
  user: AuthenticatedUserDTO;
  farmerProfile: {
    farmName: string;
    farmAddress: string;
    state: string;
    lga: string;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  };
  statistics: {
    pendingOrders: number;
    activeOrders: number;
    revenue: number;
    totalSales: number;
    totalProducts: number;
    totalAvailableQty: number;
  };
  recentSubmissions: Array<{
    id: string;
    produceName: string;
    price: number;
    unit: string;
    availableQty: number;
    date: string;
    status: string;
  }>;
  recentActivity: ActivityItemDTO[];
  quickActions: QuickActionDTO[];
  profileCompletion: ProfileCompletionDTO;
  chartData: Array<{ day: string; value: number }>;
}
