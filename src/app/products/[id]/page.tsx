"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Package,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { ProductDTO } from "@/dto";
import { cn } from "@/lib/utils";

export default function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Product listing not found.");
          throw new Error("Failed to load commodity details.");
        }
        const data: ProductDTO = await res.json();
        setProduct(data);
        setSelectedImage(data.primaryImage || data.images?.[0]?.imageUrl || "");
      } catch (err: any) {
        setError(err.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category.name,
      country: product.farmer.state,
      price: product.price,
      unit: product.unit,
      image: selectedImage || product.primaryImage,
      description: product.description,
      stock: product.inventory.availableQty,
      rating: 4.9,
      reviewsCount: 12,
      certification: product.specifications.grade,
      sku: `PROD-${product.id.substring(0, 6)}`,
      brand: product.farmer.farmName,
      farmerProfileId: product.farmer.id,
      farmerName: product.farmer.farmName,
      moq: product.specifications.minOrderQty,
      grade: product.specifications.grade,
      packaging: product.specifications.packaging,
    });
    toast(`${product.name} added to your wholesale cart!`, "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-10 h-10 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-600">Loading commodity specifications...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle size={44} className="text-amber-500 mb-3" />
          <h1 className="text-xl font-bold text-gray-800 mb-1">Commodity Listing Unavailable</h1>
          <p className="text-sm text-gray-500 max-w-sm mb-6">{error || "The requested agricultural commodity could not be found."}</p>
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

  const allImages = product.images.map((img) => img.imageUrl);
  if (allImages.length === 0 && product.primaryImage) {
    allImages.push(product.primaryImage);
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <Link href="/products" className="hover:text-gray-800 transition-colors flex items-center gap-1">
            <ArrowLeft size={13} /> Commodities
          </Link>
          <span>/</span>
          <span className="text-gray-500 uppercase">{product.category.name}</span>
          <span>/</span>
          <span className="text-gray-800 font-bold truncate">{product.name}</span>
        </div>

        {/* 2-Column Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Gallery (5 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-sm flex items-center justify-center p-8">
              <Image
                src={selectedImage || product.primaryImage}
                alt={product.name}
                fill
                className="object-contain drop-shadow-md p-6 transition-transform duration-500 hover:scale-105"
                priority
                onError={(e) => {
                  (e.target as any).src = "/images/products/sesame_seeds.png";
                }}
              />
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={cn(
                      "relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer bg-white",
                      selectedImage === imgUrl ? "border-[#1B4D28] shadow-sm" : "border-gray-200 hover:border-gray-400"
                    )}
                  >
                    <Image src={imgUrl} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Purchase Card (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#1B4D28]/10 text-[#1B4D28] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.category.name}
                </span>
                {product.farmer.verificationStatus === "APPROVED" && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 size={13} /> Verified Cooperative
                  </span>
                )}
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                  {product.specifications.grade}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Producer Storefront Link */}
              <div className="p-3 bg-white rounded-2xl border border-gray-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Produced By</p>
                  <p className="text-sm font-extrabold text-gray-800">{product.farmer.farmName}</p>
                  <p className="text-xs text-gray-500">{product.farmer.farmAddress || `${product.farmer.lga}, ${product.farmer.state}`}</p>
                </div>
                <Link
                  href={`/farmers/${product.farmer.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4D28] bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  <span>View Cooperative Storefront</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Price & Stock Display */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Wholesale Unit Price</p>
                  <p className="text-3xl font-black text-gray-900">
                    ₦{product.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    <span className="text-xs font-medium text-gray-400"> / {product.unit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Available Volume</p>
                  <p className="text-sm font-bold text-[#1B4D28]">
                    {product.inventory.availableQty.toLocaleString()} {product.unit}s
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Ready for dispatch</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed font-light">
                {product.description}
              </p>
            </div>

            {/* Specifications Matrix */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Export Specifications & Quality</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Grade Standard</p>
                  <p className="font-bold text-gray-800">{product.specifications.grade}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Moisture Threshold</p>
                  <p className="font-bold text-gray-800">{product.specifications.moisture}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Admixture Limit</p>
                  <p className="font-bold text-gray-800">{product.specifications.admixture}</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Packaging Format</p>
                  <p className="font-bold text-gray-800">{product.specifications.packaging}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.inventory.availableQty <= 0}
                className="w-full sm:flex-1 bg-[#1B4D28] hover:bg-[#153b1e] text-white py-4 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <ShoppingCart size={18} />
                <span>Add to Wholesale Cart</span>
              </button>
              <Link
                href="/cart"
                className="w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 py-4 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>View Cart & Checkout</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Commodities Section */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <section className="space-y-4 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Similar Verified Commodities</h2>
                <p className="text-xs text-gray-500 mt-0.5">Other export-ready produce from Nigerian agricultural hubs.</p>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-[#1B4D28] hover:underline flex items-center gap-1"
              >
                <span>View Full Catalog</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {product.relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                      <Image
                        src={rel.primaryImage}
                        alt={rel.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as any).src = "/images/products/sesame_seeds.png";
                        }}
                      />
                      <span className="absolute top-2 left-2 bg-[#1B4D28] text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                        {rel.category.name}
                      </span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#1B4D28] transition-colors truncate">
                        {rel.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {rel.farmer.farmName} · {rel.farmer.state}
                      </p>
                      <p className="text-sm font-black text-gray-900 pt-1">
                        ₦{rel.price.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">/ {rel.unit}</span>
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <Link
                      href={`/products/${rel.id}`}
                      className="w-full block text-center py-2 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl text-xs font-bold text-gray-700 hover:text-[#1B4D28] transition-colors"
                    >
                      View Commodity
                    </Link>
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
