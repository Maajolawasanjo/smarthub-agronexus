export interface Product {
    id: number;
    name: string;
    category: string;
    country: string;
    price: number;
    originalPrice?: number;
    unit: string;
    image: string;
    description: string;
    stock: number;
    rating: number;
    reviewsCount: number;
    certification: string;
    sku: string;
    brand: string;
    moq: string;
    grade: string;
    packaging: string;
}

export const products: Product[] = [
    {
        id: 1,
        name: "Premium Raw Cashew Nut",
        category: "Seeds",
        country: "Nigeria",
        price: 1230,
        originalPrice: 1500,
        unit: "Ton",
        image: "/images/products/cashew_nut.png",
        description: "Sourced directly from verified smallholder farmers in Kaduna and Oyo, processed under export-ready standards.",
        stock: 450,
        rating: 4.8,
        reviewsCount: 293,
        certification: "Organic, GAP Certified",
        sku: "CN-NG-PRM-001",
        brand: "AgroMerge Naturals",
        moq: "5 Tons",
        grade: "Premium Grade A",
        packaging: "50kg bags",
    },
    {
        id: 2,
        name: "Fresh Mangoes",
        category: "Fruit",
        country: "Ivory Coast",
        price: 1200,
        originalPrice: 1500,
        unit: "Ton",
        image: "/images/products/fresh_mangoes.png",
        description: "Freshly harvested, export-grade ripe mangoes bursting with tropical flavor. Cultivated in the fertile regions of Ivory Coast.",
        stock: 120,
        rating: 4.6,
        reviewsCount: 145,
        certification: "GlobalG.A.P, FairTrade",
        sku: "FM-IC-EXP-002",
        brand: "Tropical Harvest",
        moq: "2 Tons",
        grade: "Export Grade 1",
        packaging: "5kg Carton Boxes",
    },
    {
        id: 3,
        name: "Raw Kolanut",
        category: "Seeds",
        country: "Ghana",
        price: 3400,
        originalPrice: 3800,
        unit: "Ton",
        image: "/images/products/kola_nut.png",
        description: "Authentic, raw kolanuts hand-harvested from mature trees in Ghana. Known for their naturally bitter but stimulating flavor profile.",
        stock: 320,
        rating: 4.9,
        reviewsCount: 512,
        certification: "Rainforest Alliance",
        sku: "KN-GH-RAW-003",
        brand: "Heritage Seeds Co.",
        moq: "1 Ton",
        grade: "Premium Standard",
        packaging: "Vacuum Sealed Sacks",
    },
    {
        id: 4,
        name: "Dried Ginger Roots",
        category: "Spices",
        country: "Nigeria",
        price: 6500,
        unit: "Ton",
        image: "/images/products/ginger_spices.png",
        description: "Potent, sun-dried ginger roots cultivated in the rich soils of Nigeria. Characterized by an intense, fiery aroma.",
        stock: 85,
        rating: 4.7,
        reviewsCount: 89,
        certification: "Organic, ISO 9001",
        sku: "GR-NG-DRY-004",
        brand: "SpiceTech NG",
        moq: "10 Tons",
        grade: "Grade AA Extract",
        packaging: "25kg Mesh Bags",
    },
    {
        id: 5,
        name: "Raw Cocoa Beans",
        category: "Seeds",
        country: "Ghana",
        price: 980,
        originalPrice: 1200,
        unit: "Ton",
        image: "/images/products/cocoa_beans.png",
        description: "Premium fermented cocoa beans, the essential foundation of luxury chocolate. Sourced directly from cooperative farming communities.",
        stock: 600,
        rating: 4.9,
        reviewsCount: 820,
        certification: "FairTrade, Organic",
        sku: "CB-GH-FER-005",
        brand: "Gold Coast Cacao",
        moq: "20 Tons",
        grade: "Premium Fermented",
        packaging: "64kg Jute Bags",
    },
    {
        id: 6,
        name: "Long-Grain White Rice",
        category: "Grains",
        country: "Nigeria",
        price: 2100,
        unit: "Ton",
        image: "/images/products/rice_grains.png",
        description: "Superior long-grain white rice, cleanly milled and polished to a brilliant white finish. Grown in high-yield Nigerian paddies.",
        stock: 1200,
        rating: 4.5,
        reviewsCount: 1104,
        certification: "ISO 22000",
        sku: "WR-NG-LG-006",
        brand: "Savannah Mills",
        moq: "50 Tons",
        grade: "5% Broken Grade A",
        packaging: "50kg Woven PP Sacks",
    },
];
