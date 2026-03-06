"use client";

import { use, useEffect, useState } from "react";
import {
    ChevronLeft,
    Calendar,
    MapPin,
    Package,
    Tag,
    Scale,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Leaf,
    ImageOff,
    Share2,
    Printer,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProduce, ProduceListing } from "@/context/ProduceContext";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function formatCurrency(raw: string): string {
    const num = parseFloat(raw.replace(/,/g, ""));
    if (isNaN(num)) return raw;
    return "₦" + num.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function generateBatchDisplay(id: string): string {
    return id;
}

// ─── Status Badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    Pending: {
        icon: AlertCircle,
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-200",
        label: "Pending Review",
    },
    Active: {
        icon: CheckCircle2,
        bg: "bg-green-50",
        text: "text-green-600",
        border: "border-green-200",
        label: "Active",
    },
    Sold: {
        icon: CheckCircle2,
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-200",
        label: "Sold",
    },
    Cancelled: {
        icon: XCircle,
        bg: "bg-red-50",
        text: "text-red-600",
        border: "border-red-200",
        label: "Cancelled",
    },
} as const;

function StatusBadge({ status }: { status: ProduceListing["status"] }) {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
            cfg.bg, cfg.text, cfg.border
        )}>
            <Icon size={12} />
            {cfg.label}
        </span>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    accent = false,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className={cn(
            "rounded-2xl border p-4 flex flex-col gap-3",
            accent
                ? "bg-[#1B4D28] border-[#1B4D28] text-white"
                : "bg-white border-gray-100 shadow-sm"
        )}>
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                accent ? "bg-white/15" : "bg-gray-50"
            )}>
                <Icon size={16} className={accent ? "text-white" : "text-[#1B4D28]"} />
            </div>
            <div>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5",
                    accent ? "text-white/60" : "text-gray-400"
                )}>{label}</p>
                <p className={cn("text-sm font-bold",
                    accent ? "text-white" : "text-gray-800"
                )}>{value}</p>
            </div>
        </div>
    );
}

// ─── Not Found ────────────────────────────────────────────────────────────────

function NotFound() {
    return (
        <div className="max-w-5xl mx-auto pb-12 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <Leaf size={36} className="text-gray-300" />
            </div>
            <h1 className="text-xl font-bold text-gray-700">Produce Listing Not Found</h1>
            <p className="text-sm text-gray-400 max-w-xs">
                This listing may have been removed or the link is invalid.
            </p>
            <Link
                href="/farmer/sell"
                className="mt-2 bg-[#1B4D28] text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-[#153a1e] transition-all"
            >
                Submit New Produce
            </Link>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProduceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { getListingById } = useProduce();
    const { user } = useUser();

    const [listing, setListing] = useState<ProduceListing | undefined>(undefined);
    const [loaded, setLoaded] = useState(false);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        // Give context time to rehydrate from localStorage
        const found = getListingById(id);
        setListing(found);
        setLoaded(true);
    }, [id, getListingById]);

    if (!loaded) {
        return (
            <div className="max-w-5xl mx-auto pb-12 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-8 h-8 border-2 border-[#1B4D28] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Loading produce details…</p>
                </div>
            </div>
        );
    }

    if (!listing) return <NotFound />;

    const displayImages = listing.images.length > 0 ? listing.images : [];
    const submittedDate = formatDate(listing.submittedAt);
    const harvestDate = formatDate(listing.harvestDate);
    const farmerName = user?.name || "—";
    const farmName = user?.farmName || "—";

    return (
        <div className="max-w-5xl mx-auto pb-12">

            {/* ── Back & Actions Header ── */}
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/farmer/sell"
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors w-fit"
                >
                    <ChevronLeft size={16} />
                    Submit Another Produce
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.print()}
                        className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        title="Print"
                    >
                        <Printer size={16} />
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            alert("Link copied!");
                        }}
                        className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        title="Share"
                    >
                        <Share2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-5">

                {/* ── SUCCESS BANNER ── */}
                <div className="bg-gradient-to-r from-[#1B4D28] to-[#2d7a44] rounded-[20px] p-5 flex items-center gap-4 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={22} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Produce Submitted Successfully!</p>
                        <p className="text-xs text-white/70 mt-0.5">
                            Your produce has been listed and is awaiting review by the Agronexus team.
                        </p>
                    </div>
                </div>

                {/* ── TITLE + STATUS CARD ── */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-xl font-bold text-gray-800">
                                    {listing.produceType}
                                    {listing.variety && (
                                        <span className="text-gray-400 font-medium"> ({listing.variety})</span>
                                    )}
                                </h1>
                                <StatusBadge status={listing.status} />
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                                    <Clock size={13} />
                                    Submitted {submittedDate}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                                    <MapPin size={13} />
                                    {listing.farmLocation}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                                    <Leaf size={13} />
                                    {farmName}
                                </div>
                            </div>
                        </div>

                        {/* Batch Code Pill */}
                        <div className="flex-shrink-0 bg-gray-50 rounded-xl px-4 py-3 text-center border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Batch Code</p>
                            <p className="text-sm font-bold text-[#1B4D28] font-mono tracking-tight">{generateBatchDisplay(listing.id)}</p>
                        </div>
                    </div>
                </div>

                {/* ── STATS GRID ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={Scale}
                        label="Quantity"
                        value={`${listing.quantity} ${listing.unit}`}
                    />
                    <StatCard
                        icon={Tag}
                        label="Asking Price"
                        value={formatCurrency(listing.askingPrice)}
                        accent
                    />
                    <StatCard
                        icon={Calendar}
                        label="Harvest Date"
                        value={harvestDate}
                    />
                    <StatCard
                        icon={MapPin}
                        label="Farm Location"
                        value={listing.farmLocation}
                    />
                </div>

                {/* ── IMAGES + NOTES ROW ── */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

                    {/* Images */}
                    <div className="md:col-span-7 bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-gray-800 mb-4">
                            Produce Images
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                ({displayImages.length} photo{displayImages.length !== 1 ? "s" : ""})
                            </span>
                        </h2>

                        {displayImages.length === 0 ? (
                            <div className="aspect-video bg-gray-50 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-300">
                                <ImageOff size={32} />
                                <p className="text-xs font-medium">No images uploaded</p>
                            </div>
                        ) : (
                            <>
                                {/* Main image */}
                                <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-gray-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={displayImages[activeImg]}
                                        alt="Produce main"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Thumbnails */}
                                {displayImages.length > 1 && (
                                    <div className="flex gap-2">
                                        {displayImages.map((src, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveImg(i)}
                                                className={cn(
                                                    "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                                                    i === activeImg ? "border-[#1B4D28]" : "border-transparent hover:border-gray-300"
                                                )}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right: Farmer Note + Farmer Info */}
                    <div className="md:col-span-5 flex flex-col gap-4">

                        {/* Farmer Note */}
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 flex-1">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                Farmer Note
                            </h3>
                            {listing.notes ? (
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {listing.notes}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-300 italic">No additional notes provided.</p>
                            )}
                        </div>

                        {/* Farmer Info */}
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                Farmer Details
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400 font-medium">Name</span>
                                    <span className="text-gray-800 font-semibold">{farmerName}</span>
                                </div>
                                {user?.farmName && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400 font-medium">Farm</span>
                                        <span className="text-gray-800 font-semibold">{user.farmName}</span>
                                    </div>
                                )}
                                {user?.state && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400 font-medium">State</span>
                                        <span className="text-gray-800 font-semibold">{user.state}</span>
                                    </div>
                                )}
                                {user?.phone && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400 font-medium">Phone</span>
                                        <span className="text-gray-800 font-semibold">{user.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── PRICING & LOGISTICS SUMMARY ── */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 md:px-8 py-5 border-b border-gray-50">
                        <h2 className="text-sm font-bold text-gray-800">Listing Summary</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Produce Type</span>
                            <span className="text-sm font-bold text-gray-800">{listing.produceType}</span>
                        </div>
                        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Variety</span>
                            <span className="text-sm font-bold text-gray-800">{listing.variety || "Not specified"}</span>
                        </div>
                        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Quantity</span>
                            <span className="text-sm font-bold text-gray-800">{listing.quantity} {listing.unit}</span>
                        </div>
                        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Asking Price</span>
                            <span className="text-sm font-bold text-[#1B4D28]">{formatCurrency(listing.askingPrice)}</span>
                        </div>
                        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Harvest Date</span>
                            <span className="text-sm font-bold text-gray-800">{harvestDate}</span>
                        </div>
                        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Farm Location</span>
                            <span className="text-sm font-bold text-gray-800">{listing.farmLocation}</span>
                        </div>
                        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Batch Code</span>
                            <span className="text-sm font-bold text-gray-800 font-mono">{listing.id}</span>
                        </div>
                        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Submission Status</span>
                            <StatusBadge status={listing.status} />
                        </div>
                    </div>
                </div>

                {/* ── CTA BUTTONS ── */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                        href="/farmer/sell"
                        className="flex-1 text-center bg-[#1B4D28] text-white py-4 rounded-full text-sm font-bold hover:bg-[#153a1e] transition-all active:scale-[0.99] shadow-lg shadow-green-900/10"
                    >
                        Submit Another Produce
                    </Link>
                    <Link
                        href="/farmer"
                        className="flex-1 text-center border-2 border-gray-200 text-gray-700 py-4 rounded-full text-sm font-bold hover:border-[#1B4D28] hover:text-[#1B4D28] transition-all"
                    >
                        Back to Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
}
