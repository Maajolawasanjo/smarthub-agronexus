/**
 * Static showcase products for the public /products marketing page.
 * These are NOT fetched from the database — they are baked into the bundle
 * so the marketing page loads instantly with zero backend dependency.
 *
 * The authenticated buyer catalogue at /dashboard/products still uses the
 * live API + Prisma for real-time inventory and pricing.
 */

export interface ShowcaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  farmName: string;
  state: string;
  verificationStatus: "APPROVED";
  availableQty: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK";
  primaryImage: string;
  moq?: number;
  grade?: string;
  condition?: string;
  packaging?: string;
  packageSize?: string;
  /** 0-indexed months where this commodity is in peak harvest/shipping season */
  seasonMonths: number[];
}

export const SHOWCASE_CATEGORIES = [
  "All Commodities",
  "Cash Crops",
  "Grains & Cereals",
  "Nuts & Seeds",
  "Spices & Herbs",
  "Fruits & Vegetables",
] as const;

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: "showcase_sesame",
    name: "White Sesame Seeds",
    description:
      "Premium hulled white sesame seeds with 99.95% purity, ≤6% moisture content, and ≤2% FFA. Sourced from verified farms in Jigawa and Nasarawa states. Suitable for oil extraction, confectionery, and bakery applications. Meets EU and Asian import standards.",
    price: 1850,
    unit: "MT",
    category: "Nuts & Seeds",
    farmName: "Sahel Grains Cooperative",
    state: "Jigawa",
    verificationStatus: "APPROVED",
    availableQty: 500,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/sesame_seeds.png",
    seasonMonths: [0, 1, 2, 9, 10, 11],
  },
  {
    id: "showcase_cashew",
    name: "Raw Cashew Nuts (RCN)",
    description:
      "Grade A raw cashew nuts with kernel outturn (KOR) of 48 lbs minimum and ≤10% moisture content. Harvested from high-yield cashew plantations across Kwara and Oyo states. Ideal for processing into W320/W240 kernels for international markets.",
    price: 1200,
    unit: "MT",
    category: "Nuts & Seeds",
    farmName: "Kwara Cashew Estates",
    state: "Kwara",
    verificationStatus: "APPROVED",
    availableQty: 300,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/cashew_nut.png",
    seasonMonths: [1, 2, 3, 4, 5],
  },
  {
    id: "showcase_cocoa",
    name: "Fermented Cocoa Beans",
    description:
      "Well-fermented and sun-dried Grade 1 cocoa beans with ≤7.5% moisture, ≤3% mould count, and rich chocolate aroma. Sourced from Ondo and Cross River states — Nigeria's premium cocoa belt. Suitable for chocolate manufacturing and butter extraction.",
    price: 3400,
    unit: "MT",
    category: "Cash Crops",
    farmName: "Ondo Cocoa Growers Union",
    state: "Ondo",
    verificationStatus: "APPROVED",
    availableQty: 200,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/cocoa_beans.png",
    seasonMonths: [9, 10, 11, 0, 1, 2],
  },
  {
    id: "showcase_ginger",
    name: "Split Dried Ginger",
    description:
      "Premium split dried ginger with high gingerol content (≥1.5%), ≤12% moisture, and pungent aroma. Cultivated in Kaduna state's highland regions. Suitable for spice milling, oleoresin extraction, and pharmaceutical applications.",
    price: 2800,
    unit: "MT",
    category: "Spices & Herbs",
    farmName: "Kaduna Highland Farms",
    state: "Kaduna",
    verificationStatus: "APPROVED",
    availableQty: 150,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/ginger_spices.png",
    seasonMonths: [10, 11, 0, 1, 2, 3],
  },
  {
    id: "showcase_peanuts",
    name: "Groundnuts (Peanuts)",
    description:
      "Bold-grade groundnuts with 40–50 kernel count per ounce, ≤8% moisture, and ≤15 ppb aflatoxin levels. Sourced from Kano and Bauchi states. Ideal for peanut butter production, confectionery, and oil pressing.",
    price: 950,
    unit: "MT",
    category: "Nuts & Seeds",
    farmName: "Kano Agro Alliance",
    state: "Kano",
    verificationStatus: "APPROVED",
    availableQty: 600,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/peanuts.png",
    seasonMonths: [9, 10, 11, 0, 1],
  },
  {
    id: "showcase_rice",
    name: "Parboiled Rice (NERICA)",
    description:
      "Long-grain parboiled rice with ≤14% moisture, ≤5% broken grains, and clean milling finish. Produced from NERICA varieties cultivated in Kebbi and Ebonyi states. Suitable for wholesale distribution and export to West African markets.",
    price: 700,
    unit: "MT",
    category: "Grains & Cereals",
    farmName: "Kebbi Rice Mills",
    state: "Kebbi",
    verificationStatus: "APPROVED",
    availableQty: 1000,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/rice_grains.png",
    seasonMonths: [8, 9, 10, 11, 0, 1],
  },
  {
    id: "showcase_kola",
    name: "Kola Nut (Cola Nitida)",
    description:
      "Freshly harvested Cola Nitida with vibrant red and white lobes, high caffeine content, and traditional medicinal applications. Sourced from rainforest communities in Ogun and Osun states. Used in beverage flavouring, pharmaceuticals, and ceremonial trade.",
    price: 3200,
    unit: "MT",
    category: "Cash Crops",
    farmName: "Osun Forest Cooperative",
    state: "Osun",
    verificationStatus: "APPROVED",
    availableQty: 80,
    stockStatus: "LOW_STOCK",
    primaryImage: "/images/products/kola_nut.png",
    seasonMonths: [5, 6, 7, 8, 9],
  },
  {
    id: "showcase_mangoes",
    name: "Fresh Kent Mangoes",
    description:
      "Export-grade Kent variety mangoes with uniform golden-red skin colour, Brix level ≥13%, and zero pest infestation. Harvested from irrigated orchards in Benue and Taraba states. Suitable for fresh fruit export and juice concentrate production.",
    price: 1100,
    unit: "MT",
    category: "Fruits & Vegetables",
    farmName: "Benue Valley Orchards",
    state: "Benue",
    verificationStatus: "APPROVED",
    availableQty: 120,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/fresh_mangoes.png",
    seasonMonths: [2, 3, 4, 5, 6],
  },
  {
    id: "showcase_flour",
    name: "Cassava Flour (HQCF)",
    description:
      "High Quality Cassava Flour (HQCF) with ≤12% moisture, ≤2% fibre, and white-cream colour. Processed from TMS 30572 cassava varieties in Ogun state. Compliant with CODEX and SON standards for flour blending, confectionery, and industrial starch applications.",
    price: 480,
    unit: "MT",
    category: "Grains & Cereals",
    farmName: "Ogun Agro Processors",
    state: "Ogun",
    verificationStatus: "APPROVED",
    availableQty: 400,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/flour.png",
    seasonMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: "showcase_cabbage",
    name: "Fresh Green Cabbage",
    description:
      "Compact, firm heads of green cabbage weighing 1.5–3 kg each with bright colour and crisp texture. Cultivated under irrigation in Jos Plateau. Suitable for fresh vegetable export, coleslaw production, and institutional catering supply.",
    price: 320,
    unit: "MT",
    category: "Fruits & Vegetables",
    farmName: "Plateau Fresh Farms",
    state: "Plateau",
    verificationStatus: "APPROVED",
    availableQty: 250,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/cabbage.jpg",
    seasonMonths: [10, 11, 0, 1, 2, 3],
  },
  {
    id: "showcase_dates",
    name: "Dried Desert Dates",
    description:
      "Naturally dried Saharan dates with rich caramel flavour, ≤18% moisture, and high natural sugar content. Harvested from date palm groves in Borno and Yobe states. Popular across West Africa for direct consumption, date syrup, and health food products.",
    price: 1500,
    unit: "MT",
    category: "Fruits & Vegetables",
    farmName: "Borno Date Palm Estate",
    state: "Borno",
    verificationStatus: "APPROVED",
    availableQty: 90,
    stockStatus: "LOW_STOCK",
    primaryImage: "/images/products/dates.jpg",
    seasonMonths: [8, 9, 10, 11],
  },
  {
    id: "showcase_watermelon",
    name: "Crimson Sweet Watermelon",
    description:
      "Oblong-shaped Crimson Sweet watermelons averaging 8–12 kg, with bright red flesh, Brix ≥10%, and thick rind for transport durability. Grown in Sokoto and Zamfara states during the dry season. Ideal for fresh export and juice processing.",
    price: 280,
    unit: "MT",
    category: "Fruits & Vegetables",
    farmName: "Sokoto Irrigation Farms",
    state: "Sokoto",
    verificationStatus: "APPROVED",
    availableQty: 350,
    stockStatus: "IN_STOCK",
    primaryImage: "/images/products/watermelon.jpg",
    seasonMonths: [0, 1, 2, 3, 4],
  },
];
