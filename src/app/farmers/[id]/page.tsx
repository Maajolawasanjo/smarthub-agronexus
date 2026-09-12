"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Star,
  Package,
  Calendar,
  Layers,
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface StorefrontData {
  farmer: {
    id: string;
    farmName: string;
    farmDescription: string;
    farmAddress: string;
    state: string;
    lga: string;
    verificationStatus: string;
    memberSince: string;
    fullName: string;
  };
  stats: {
    activeListingsCount: number;
    totalReviewsCount: number;
    averageRating: number;
  };
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    unit: string;
    category: string;
    availableQty: number;
    primaryImage: string;
    images: string[];
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    productName: string;
    buyerName: string;
  }>;
}

export default function FarmerStorefrontPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [data, setData] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStorefront() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/farmers/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Farmer cooperative not found.");
          throw new Error("Failed to load farmer storefront.");
        }
        const json = await res.json();
        setData(json.data || null);
      } catch (err: any) {
        setError(err.message || "Failed to load storefront.");
      } finally {
        setLoading(false);
      }
    }
    loadStorefront();
  }, [id]);

  const handleAddToCart = (product: StorefrontData["products"][0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      country: data?.farmer.state || "Nigeria",
      price: product.price,
      unit: product.unit,
      image: product.primaryImage,
      description: product.description,
      stock: product.availableQty,
      rating: 4.9,
      reviewsCount: 1,
      certification: "Certified Export Grade",
      sku: `PROD-${product.id.substring(0, 6)}`,
      brand: data?.farmer.farmName,
      farmerProfileId: data?.farmer.id,
      farmerName: data?.farmer.farmName,
      moq: `1 ${product.unit}`,
      grade: "Export Grade A",
      packaging: "Multi-wall export bags",
    });
    toast(`${product.name} added to cart!`, "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-10 h-10 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-600">Loading verified producer storefront...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle size={44} className="text-amber-500 mb-3" />
          <h1 className="text-xl font-bold text-gray-800 mb-1">Storefront Unavailable</h1>
          <p className="text-sm text-gray-500 max-w-sm mb-6">{error || "The requested farmer profile could not be found."}</p>
          <Link
            href="/products"
            className="bg-[#1B4D28] hover:bg-[#153b1e] text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md"
          >
            Explore Public Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { farmer, stats, products, reviews } = data;

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Back Navigation Breadcrumb */}
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Commodities Marketplace
          </Link>
        </div>

        {/* Farmer Hero Profile Card */}
        <div className="bg-[#1B4D28] text-white rounded-[32px] p-6 md:p-10 shadow-xl shadow-green-950/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-white/15 text-green-200 px-3 py-1 rounded-full border border-white/10">
                  VERIFIED PRODUCER STOREFRONT
                </span>
                {farmer.verificationStatus === "APPROVED" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-400/20 text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-400/30">
                    <ShieldCheck size={13} /> Tier-1 Verified Cooperative
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {farmer.farmName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-green-100/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-green-300" />
                  {farmer.farmAddress || `${farmer.lga}, ${farmer.state} State, Nigeria`}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Calendar size={14} className="text-green-300" />
                  Member since {new Date(farmer.memberSince).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </span>
              </div>

              <p className="text-sm text-green-50/90 leading-relaxed pt-1">
                {farmer.farmDescription}
              </p>
            </div>

            {/* Reputation & Performance Stats */}
            <div className="flex items-center gap-3 self-start md:self-auto bg-black/20 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-white/10">
              <div className="text-center px-3 border-r border-white/10">
                <div className="flex items-center justify-center gap-1 text-amber-300 font-extrabold text-xl">
                  <Star size={18} className="fill-amber-300" />
                  <span>{stats.averageRating.toFixed(1)}</span>
                </div>
                <p className="text-[10px] text-green-200/70 uppercase font-mono mt-0.5">Rating ({stats.totalReviewsCount})</p>
              </div>

              <div className="text-center px-3">
                <p className="text-xl font-extrabold text-white">{stats.activeListingsCount}</p>
                <p className="text-[10px] text-green-200/70 uppercase font-mono mt-0.5">Active Crops</p>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Available Commodities for Wholesale & Export</h2>
              <p className="text-xs text-gray-500 mt-0.5">Harvested and graded according to international export specifications.</p>
            </div>
            <span className="text-xs font-bold text-[#1B4D28] bg-green-50 px-3 py-1 rounded-full border border-green-200">
              {products.length} {products.length === 1 ? "Commodity" : "Commodities"} In Stock
            </span>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400 space-y-2">
              <Package size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">No active produce listed currently</p>
              <p className="text-xs max-w-sm mx-auto">This cooperative's current harvest is fully reserved or awaiting the next seasonal harvesting window.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200/70 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                      <Image
                        src={product.primaryImage}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as any).src = "/images/products/sesame_seeds.png";
                        }}
                      />
                      <span className="absolute top-3 left-3 bg-[#1B4D28] text-white text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                        {product.category}
                      </span>
                      <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                        {product.availableQty > 0 ? "IN STOCK" : "OUT OF STOCK"}
                      </span>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#1B4D28] transition-colors leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="pt-2 flex items-baseline justify-between border-t border-gray-100">
                        <div>
                          <p className="text-[10px] font-mono text-gray-400 uppercase">Contract Price</p>
                          <p className="text-xl font-black text-gray-900">
                            ₦{product.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                            <span className="text-xs font-medium text-gray-400"> / {product.unit}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-gray-400 uppercase">Available</p>
                          <p className="text-xs font-bold text-[#1B4D28]">
                            {product.availableQty.toLocaleString()} {product.unit}s
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.availableQty <= 0}
                      className="flex-1 bg-[#1B4D28] hover:bg-[#153b1e] text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-green-900/10 cursor-pointer disabled:opacity-50"
                    >
                      <ShoppingCart size={14} /> Add to Cart
                    </button>
                    <Link
                      href={`/products/${product.id}`}
                      className="p-2.5 border border-gray-200 hover:border-gray-400 rounded-xl text-gray-600 transition-colors"
                      title="View Commodity Details"
                    >
                      <ExternalLink size={15} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Verified Reviews Section */}
        {reviews.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="border-b border-gray-200 pb-3">
              <h2 className="text-xl font-bold text-gray-900">Verified Buyer Feedback & Ratings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Reviews submitted exclusively by verified trade buyers post-delivery.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= r.rating ? "fill-amber-400" : "text-gray-200"}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-50 pt-2">
                    <span className="font-semibold text-gray-700">{r.buyerName}</span>
                    <span className="text-[#1B4D28] font-bold">Commodity: {r.productName}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
