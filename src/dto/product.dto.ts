import { MarketplaceProductItemDTO } from "./marketplace.dto";

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  isAvailable: boolean;
  status?: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ARCHIVED";
  rejectionReason?: string | null;
  moderationNotes?: string | null;
  harvestDate?: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    description?: string;
  };
  farmer: {
    id: string;
    farmName: string;
    farmDescription?: string;
    farmAddress: string;
    state: string;
    lga: string;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
    productsCount: number;
  };
  inventory: {
    availableQty: number;
    reservedQty: number;
    stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  };
  images: Array<{
    id: string;
    imageUrl: string;
  }>;
  primaryImage: string;
  moq?: number;
  grade?: string | null;
  condition?: string | null;
  produceType?: string | null;
  variety?: string | null;
  packaging?: string | null;
  packageSize?: string | null;
  pricingNotes?: string | null;
  qualityNotes?: string | null;
  availabilityStatus?: string | null;
  availableFrom?: string | null;
  storageCondition?: string | null;
  storageNotes?: string | null;
  farmState?: string | null;
  farmLga?: string | null;
  farmCommunity?: string | null;
  specifications: {
    grade: string;
    condition?: string;
    packaging: string;
    packageSize?: string;
    minOrderQty: string;
    moisture?: string;
    admixture?: string;
    storageCondition?: string;
    storageNotes?: string;
  };
  deliveryEstimate: string;
  relatedProducts: MarketplaceProductItemDTO[];
}
