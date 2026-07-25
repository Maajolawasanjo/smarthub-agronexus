export interface MarketplaceProductItemDTO {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  price: number;
  unit: string;
  isAvailable: boolean;
  harvestDate?: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
  farmer: {
    id: string;
    farmName: string;
    state: string;
    lga: string;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
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
}

export interface MarketplaceCategoryDTO {
  id: string;
  name: string;
  description?: string;
  productCount: number;
}

export interface MarketplaceDTO {
  products: MarketplaceProductItemDTO[];
  featuredProducts: MarketplaceProductItemDTO[];
  categories: MarketplaceCategoryDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  sortOptions: Array<{ label: string; value: string }>;
  searchMetadata: {
    query: string;
    selectedCategory: string;
    selectedState: string;
    minPrice?: number;
    maxPrice?: number;
    totalMatches: number;
  };
}
