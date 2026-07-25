import { MarketplaceProductItemDTO } from "./marketplace.dto";

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  isAvailable: boolean;
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
  specifications: {
    grade: string;
    moisture: string;
    admixture: string;
    packaging: string;
    minOrderQty: string;
  };
  deliveryEstimate: string;
  relatedProducts: MarketplaceProductItemDTO[];
}
