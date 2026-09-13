"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import {
    ChevronLeft,
    ChevronDown,
    Calendar,
    MapPin,
    Upload,
    X,
    AlertCircle,
    ShieldAlert,
    Clock,
    ShieldCheck,
    Save,
    Send,
    Eye,
    Package,
    Tag,
    FileText,
    Warehouse,
    Sparkles,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES_LGAS, NIGERIAN_STATE_NAMES } from "@/lib/data/nigeria-locations";

// Produce Categories & Varieties
const PRODUCE_TYPES = [
    "Yam", "Rice", "Pepper", "Cassava", "Maize", 
    "Cashew", "Cocoa", "Ginger", "Tomato", "Soybean", "Sesame", "Sorghum"
];

const VARIETIES: Record<string, string[]> = {
    Yam: ["Abuja Yam", "Puna Yam", "White Yam", "Water Yam", "Yellow Yam"],
    Rice: ["Long Grain", "Ofada", "Basmati", "Jasmine", "Faro 44", "Faro 52"],
    Pepper: ["Habanero (Rodo)", "Tatashe", "Cayenne (Shombo)", "Bell Pepper", "Bird Eye"],
    Cassava: ["Sweet Cassava", "African Cassava", "Bitter Cassava", "TME 419"],
    Maize: ["White Maize", "Yellow Maize", "Sweet Corn", "Popcorn"],
    Cashew: ["Raw Cashew Nut (RCN)", "Processed Cashew Kernels"],
    Cocoa: ["Forastero", "Trinitario", "Criollo"],
    Ginger: ["Yellow Ginger", "White Ginger", "Split Dried Ginger"],
    Tomato: ["Roma", "Cherry", "Beefsteak", "Hausa Tomato"],
    Soybean: ["Yellow Soybean", "Black Soybean", "TGX Varieties"],
    Sesame: ["White Sesame (Food Grade)", "Brown Sesame (Oil Grade)"],
    Sorghum: ["White Sorghum", "Red Sorghum"],
};

const UNITS = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "bags", label: "Bags (e.g. 50kg / 100kg)" },
    { value: "tonnes", label: "Metric Tonnes (MT)" },
    { value: "crates", label: "Crates" },
    { value: "pieces", label: "Pieces / Tubers" },
];

const QUALITY_GRADES = [
    { value: "Grade A (Export Certified)", label: "Grade A (Export Certified)" },
    { value: "Grade B (Standard Commercial)", label: "Grade B (Standard Commercial)" },
    { value: "Grade C (Industrial / Processing)", label: "Grade C (Industrial / Processing)" },
    { value: "Ungraded / Farmgate", label: "Ungraded / Farmgate" },
];

const CONDITIONS = [
    { value: "Freshly Harvested", label: "Freshly Harvested" },
    { value: "Sun-dried / Cured", label: "Sun-dried / Cured" },
    { value: "Partially Dried", label: "Partially Dried" },
    { value: "Cleaned & Processed", label: "Cleaned & Processed" },
];

const PACKAGING_TYPES = [
    "Standard 50kg Polypropylene Bags",
    "Standard 100kg Jute Sacks",
    "25kg Woven Bags",
    "Ventilated Plastic Crates",
    "Corrugated Export Cartons",
    "Bulk Loose in Trailer / Truck",
    "Custom Packaging",
];

const AVAILABILITY_STATUSES = [
    { value: "AVAILABLE_NOW", label: "Available Now (In Stock)" },
    { value: "HARVESTING_SOON", label: "Harvesting Soon (Within 14 Days)" },
    { value: "PRE_ORDER", label: "Pre-Order / Advance Contract" },
];

const STORAGE_CONDITIONS = [
    "Ambient / Well-Ventilated Store",
    "Cold Storage / Refrigerated",
    "Hermetic Silo / PICS Bags",
    "Raised Solar Drying Platform",
    "Traditional Barn / Clamp",
];

interface FormState {
    id?: string;
    produceType: string;
    variety: string;
    title: string;
    grade: string;
    condition: string;
    qualityNotes: string;
    quantity: string;
    unit: string;
    packaging: string;
    packageSize: string;
    moq: string;
    askingPrice: string;
    pricingNotes: string;
    availabilityStatus: string;
    harvestDate: string;
    availableFrom: string;
    farmState: string;
    farmLga: string;
    farmCommunity: string;
    storageCondition: string;
    storageNotes: string;
    description: string;
}

interface FormErrors {
    produceType?: string;
    variety?: string;
    title?: string;
    grade?: string;
    condition?: string;
    quantity?: string;
    unit?: string;
    moq?: string;
    askingPrice?: string;
    harvestDate?: string;
    farmState?: string;
    farmLga?: string;
}

function validateForm(form: FormState, isSubmitting: boolean): FormErrors {
    const e: FormErrors = {};

    if (!form.produceType) e.produceType = "Please select produce type";
    if (!form.variety) e.variety = "Please select variety";
    if (!form.title.trim()) e.title = "Produce listing title is required";

    if (isSubmitting) {
        if (!form.quantity.trim()) e.quantity = "Quantity is required";
        else if (isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) e.quantity = "Enter a valid positive number";

        if (!form.unit) e.unit = "Select measurement unit";

        if (!form.askingPrice.trim()) e.askingPrice = "Price per unit is required";
        else if (isNaN(Number(form.askingPrice)) || Number(form.askingPrice) <= 0) e.askingPrice = "Enter a valid price";

        const numQty = Number(form.quantity) || 0;
        const numMoq = Number(form.moq) || 1;
        if (numMoq <= 0) e.moq = "MOQ must be at least 1";
        else if (numQty > 0 && numMoq > numQty) e.moq = `MOQ cannot exceed total stock (${numQty})`;

        if (!form.harvestDate && form.availabilityStatus === "AVAILABLE_NOW") {
            e.harvestDate = "Harvest date is required for available produce";
        } else if (form.harvestDate && form.availabilityStatus === "AVAILABLE_NOW") {
            const harvest = new Date(form.harvestDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (harvest > today) {
                e.harvestDate = "Harvest date cannot be in the future for current stock";
            }
        }

        if (!form.farmState) e.farmState = "Please select farm state";
        if (!form.farmLga) e.farmLga = "Please select or specify farm LGA";
    }

    return e;
}

function FieldLabel({ label, required = false, error }: { label: string; required?: boolean; error?: string }) {
    return (
        <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {error && (
                <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                    <AlertCircle size={13} />
                    {error}
                </span>
            )}
        </div>
    );
}

function SubmitProduceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormState>({
        id: editId || undefined,
        produceType: "",
        variety: "",
        title: "",
        grade: "Grade A (Export Certified)",
        condition: "Freshly Harvested",
        qualityNotes: "",
        quantity: "",
        unit: "bags",
        packaging: "Standard 50kg Polypropylene Bags",
        packageSize: "50kg",
        moq: "5",
        askingPrice: "",
        pricingNotes: "",
        availabilityStatus: "AVAILABLE_NOW",
        harvestDate: new Date().toISOString().split("T")[0],
        availableFrom: "",
        farmState: "Taraba",
        farmLga: "Jalingo",
        farmCommunity: "",
        storageCondition: "Ambient / Well-Ventilated Store",
        storageNotes: "",
        description: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
    const [images, setImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [checkingVerification, setCheckingVerification] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [farmName, setFarmName] = useState<string>("");

    // Available LGAs for selected State
    const availableLgas = useMemo(() => {
        if (!form.farmState) return [];
        return NIGERIAN_STATES_LGAS[form.farmState] || [];
    }, [form.farmState]);

    // Check Farmer Verification on Load
    useEffect(() => {
        let isMounted = true;
        async function fetchInitial() {
            try {
                // Fetch logged-in user profile
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        const user = data.user || data;
                        const farmer = user.farmerProfile || data.farmerProfile;
                        const status = user.verificationStatus || farmer?.verificationStatus || (user.role === "ADMIN" ? "APPROVED" : "PENDING");
                        setVerificationStatus(status);
                        setFarmName(farmer?.farmName || user.fullName || "Your Farm");
                        if (farmer?.state) {
                            setForm((prev) => ({
                                ...prev,
                                farmState: farmer.state || prev.farmState,
                                farmLga: farmer.lga || prev.farmLga,
                            }));
                        }
                    }
                }

                // If editing existing item
                if (editId) {
                    const prodRes = await fetch(`/api/products/${editId}`);
                    if (prodRes.ok) {
                        const prod = await prodRes.json();
                        if (isMounted && prod) {
                            setForm((prev) => ({
                                ...prev,
                                id: prod.id,
                                title: prod.name || "",
                                description: prod.description || "",
                                askingPrice: prod.price ? String(prod.price) : "",
                                unit: prod.unit?.toLowerCase() || "bags",
                                quantity: prod.inventory?.availableQty ? String(prod.inventory.availableQty) : "",
                                moq: prod.moq ? String(prod.moq) : "1",
                                grade: prod.grade || prev.grade,
                                condition: prod.condition || prev.condition,
                                packaging: prod.packaging || prev.packaging,
                                packageSize: prod.packageSize || prev.packageSize,
                                availabilityStatus: prod.availabilityStatus || prev.availabilityStatus,
                                harvestDate: prod.harvestDate ? prod.harvestDate.split("T")[0] : prev.harvestDate,
                                farmState: prod.farmState || prod.farmer?.state || prev.farmState,
                                farmLga: prod.farmLga || prod.farmer?.lga || prev.farmLga,
                                farmCommunity: prod.farmCommunity || "",
                                storageCondition: prod.storageCondition || prev.storageCondition,
                                storageNotes: prod.storageNotes || "",
                            }));
                            if (prod.images && prod.images.length > 0) {
                                setImages(prod.images.map((img: any) => img.imageUrl));
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error checking farmer status:", err);
            } finally {
                if (isMounted) setCheckingVerification(false);
            }
        }
        fetchInitial();
        return () => {
            isMounted = false;
        };
    }, [editId]);

    const update = (field: keyof FormState, value: string) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            // Auto update title when produce type or variety changes
            if (field === "produceType" || field === "variety") {
                const prod = field === "produceType" ? value : prev.produceType;
                const vari = field === "variety" ? value : prev.variety;
                if (prod && vari) {
                    next.title = `${vari} (${prod})`;
                } else if (prod) {
                    next.title = `${prod} Produce`;
                }
            }
            // Reset LGA when state changes
            if (field === "farmState") {
                const lgas = NIGERIAN_STATES_LGAS[value] || [];
                next.farmLga = lgas[0] || "";
            }
            return next;
        });

        if (touched[field as keyof FormErrors]) {
            setErrors(validateForm({ ...form, [field]: value }, false));
        }
    };

    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
            if (file.size > 5 * 1024 * 1024) {
                toast(`${file.name} exceeds 5MB limit`, "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages((prev) => {
                    if (prev.length >= 4) {
                        toast("Maximum 4 images allowed", "error");
                        return prev;
                    }
                    return [...prev, reader.result as string];
                });
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

    // Calculate total estimated batch value
    const totalEstimatedValue = useMemo(() => {
        const qty = parseFloat(form.quantity) || 0;
        const price = parseFloat(form.askingPrice) || 0;
        return qty * price;
    }, [form.quantity, form.askingPrice]);

    // Handle Save Draft or Submit for Admin Inspection
    const handleAction = async (action: "DRAFT" | "SUBMIT") => {
        const isSubmitting = action === "SUBMIT";

        // Mark touched
        const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true])) as Partial<
            Record<keyof FormErrors, boolean>
        >;
        setTouched(allTouched);

        const errs = validateForm(form, isSubmitting);
        setErrors(errs);

        if (Object.keys(errs).length > 0) {
            toast(
                isSubmitting
                    ? "Please correct all highlighted fields before submitting for review."
                    : "Please provide at least a produce type and title to save a draft.",
                "error"
            );
            return;
        }

        if (isSubmitting && verificationStatus !== "APPROVED") {
            toast(
                "Your farmer profile is pending admin approval. You can save drafts, but only verified farmers can submit listings for review.",
                "error"
            );
            return;
        }

        if (action === "DRAFT") setIsSavingDraft(true);
        else setIsLoading(true);

        try {
            const payload = {
                id: form.id || undefined,
                name: form.title.trim(),
                description: form.description.trim() || `${form.grade} ${form.title} available from ${form.farmState}, Nigeria.`,
                price: parseFloat(form.askingPrice) || 0,
                unit: form.unit,
                stockQuantity: parseFloat(form.quantity) || 1,
                moq: parseInt(form.moq, 10) || 1,
                grade: form.grade,
                condition: form.condition,
                packaging: form.packaging,
                packageSize: form.packageSize,
                availabilityStatus: form.availabilityStatus,
                availableFrom: form.availableFrom || null,
                harvestDate: form.harvestDate || null,
                storageCondition: form.storageCondition,
                storageNotes: form.storageNotes,
                farmState: form.farmState,
                farmLga: form.farmLga,
                farmCommunity: form.farmCommunity,
                imageUrl: images[0] || "/products/yam.png",
                images: images.length > 0 ? images : ["/products/yam.png"],
                action,
            };

            const res = await fetch("/api/farmer/produce", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                toast(data.error || "Failed to process produce submission.", "error");
                return;
            }

            if (action === "DRAFT") {
                toast("Listing draft saved successfully! You can resume and submit anytime.", "success");
                router.push("/farmer/listings?tab=drafts");
            } else {
                toast("Produce submitted successfully! It has entered Admin Review for compliance inspection.", "success");
                router.push("/farmer/listings");
            }
        } catch (error) {
            console.error("Produce submission error:", error);
            toast("Network error while submitting produce. Please try again.", "error");
        } finally {
            setIsLoading(false);
            setIsSavingDraft(false);
        }
    };

    if (checkingVerification) {
        return (
            <div className="max-w-6xl mx-auto py-12 px-4 space-y-6">
                <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-gray-100 rounded-3xl animate-pulse" />
                    <div className="h-96 bg-gray-100 rounded-3xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 font-sans">
            {/* Top Navigation & Header */}
            <div>
                <Link
                    href="/farmer/listings"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#1B4D28] transition-colors mb-4"
                >
                    <ChevronLeft size={18} />
                    <span>Back to Produce Inventory</span>
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                            {editId ? "Edit Produce Listing" : "Sell Produce — New Commodity Listing"}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 max-w-3xl leading-relaxed">
                            Define agricultural specifications, packaging, pricing, and farm origin for institutional wholesale buyers.
                        </p>
                    </div>

                    {/* Listing Status Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                        {verificationStatus === "APPROVED" ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                                <ShieldCheck size={16} />
                                Verified Producer
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                                <Clock size={16} />
                                Verification Pending (Drafts Enabled)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Unverified Farmer Information Notice */}
            {verificationStatus !== "APPROVED" && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex items-start gap-4">
                    <ShieldAlert size={24} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 space-y-1.5 leading-relaxed">
                        <p className="font-bold text-base">Producer Profile Pending Verification</p>
                        <p>
                            You can prepare, configure, and <strong>Save Drafts</strong> of all your produce listings. 
                            Once your farm profile is verified by platform compliance, you can submit your listings for Admin Quality Inspection.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Form & Live Preview Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Comprehensive Listing Form (7 cols) */}
                <div className="lg:col-span-7 space-y-8">
                    {/* SECTION 1: Produce Identification */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3.5 border-b border-gray-100">
                            <Tag size={20} className="text-[#1B4D28]" />
                            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                1. Produce Identification
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <FieldLabel label="Produce Commodity" required error={errors.produceType} />
                                <select
                                    value={form.produceType}
                                    onChange={(e) => update("produceType", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                >
                                    <option value="">Select produce commodity...</option>
                                    {PRODUCE_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <FieldLabel label="Crop Variety" required error={errors.variety} />
                                <select
                                    value={form.variety}
                                    onChange={(e) => update("variety", e.target.value)}
                                    disabled={!form.produceType}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white disabled:opacity-50 transition-all"
                                >
                                    <option value="">
                                        {form.produceType ? "Select variety..." : "Choose produce first"}
                                    </option>
                                    {(VARIETIES[form.produceType] || ["Standard Variety"]).map((v) => (
                                        <option key={v} value={v}>
                                            {v}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <FieldLabel label="Listing Title / Display Name" required error={errors.title} />
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => update("title", e.target.value)}
                                placeholder="e.g. Export Grade Abuja White Yam Tubers"
                                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                Clear, descriptive name visible to buyers on wholesale search results.
                            </p>
                        </div>
                    </div>

                    {/* SECTION 2: Quality & Condition */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3.5 border-b border-gray-100">
                            <Sparkles size={20} className="text-[#1B4D28]" />
                            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                2. Quality Grade & Physical Condition
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <FieldLabel label="Quality Grade" required error={errors.grade} />
                                <select
                                    value={form.grade}
                                    onChange={(e) => update("grade", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                >
                                    {QUALITY_GRADES.map((g) => (
                                        <option key={g.value} value={g.value}>
                                            {g.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <FieldLabel label="Physical Condition" required error={errors.condition} />
                                <select
                                    value={form.condition}
                                    onChange={(e) => update("condition", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                >
                                    {CONDITIONS.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <FieldLabel label="Quality & Agronomic Notes" />
                            <textarea
                                value={form.qualityNotes}
                                onChange={(e) => update("qualityNotes", e.target.value)}
                                rows={3}
                                placeholder="Describe crop cleanliness, moisture content estimate, sorting standard, or absence of chemical additives..."
                                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl p-4 text-sm sm:text-base font-normal text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white leading-relaxed transition-all"
                            />
                        </div>
                    </div>

                    {/* SECTION 3: Quantity, Packaging & Minimum Order Quantity (MOQ) */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3.5 border-b border-gray-100">
                            <Package size={20} className="text-[#1B4D28]" />
                            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                3. Quantity, Packaging & Minimum Order (MOQ)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <FieldLabel label="Available Quantity" required error={errors.quantity} />
                                <input
                                    type="number"
                                    min="1"
                                    value={form.quantity}
                                    onChange={(e) => update("quantity", e.target.value)}
                                    placeholder="e.g. 500"
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                />
                            </div>

                            <div>
                                <FieldLabel label="Measurement Unit" required error={errors.unit} />
                                <select
                                    value={form.unit}
                                    onChange={(e) => update("unit", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                >
                                    {UNITS.map((u) => (
                                        <option key={u.value} value={u.value}>
                                            {u.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <FieldLabel label="Packaging Format" />
                                <select
                                    value={form.packaging}
                                    onChange={(e) => update("packaging", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                >
                                    {PACKAGING_TYPES.map((pkg) => (
                                        <option key={pkg} value={pkg}>
                                            {pkg}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <FieldLabel label="Package Net Weight / Size" />
                                <input
                                    type="text"
                                    value={form.packageSize}
                                    onChange={(e) => update("packageSize", e.target.value)}
                                    placeholder="e.g. 50kg bag, 100kg jute sack"
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* MOQ Field */}
                        <div className="bg-green-50/60 border border-green-200/80 rounded-2xl p-5 sm:p-6 space-y-2.5">
                            <FieldLabel label="Minimum Order Quantity (MOQ)" required error={errors.moq} />
                            <div className="flex flex-wrap items-center gap-3.5">
                                <input
                                    type="number"
                                    min="1"
                                    max={form.quantity || undefined}
                                    value={form.moq}
                                    onChange={(e) => update("moq", e.target.value)}
                                    placeholder="e.g. 5"
                                    className="w-36 bg-white border border-green-300 rounded-xl px-4 py-2.5 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4D28]"
                                />
                                <span className="text-sm font-bold text-[#1B4D28]">
                                    {form.unit || "units"} minimum order per buyer
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 pt-1 leading-relaxed">
                                Wholesale buyers cannot purchase below this quantity. Helps prevent micro-orders on bulk commodities.
                            </p>
                        </div>
                    </div>

                    {/* SECTION 4: Commercial Pricing */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3.5 border-b border-gray-100">
                            <Tag size={20} className="text-[#1B4D28]" />
                            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                4. Commercial Pricing
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                            <div>
                                <FieldLabel label={`Asking Price per ${form.unit || "unit"} (₦)`} required error={errors.askingPrice} />
                                <div className="relative">
                                    <span className="absolute left-4 top-3 sm:top-3.5 text-base font-bold text-gray-400">₦</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.askingPrice}
                                        onChange={(e) => update("askingPrice", e.target.value)}
                                        placeholder="e.g. 35000"
                                        className="w-full bg-gray-50/80 border border-gray-200 rounded-xl pl-9 pr-4 py-3 sm:py-3.5 text-base sm:text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Total Batch Estimated Value */}
                            <div className="p-4 sm:p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Total Lot Value (Gross)
                                </p>
                                <p className="text-xl sm:text-2xl font-black text-[#1B4D28]">
                                    ₦{totalEstimatedValue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {form.quantity || 0} {form.unit || "units"} @ ₦{Number(form.askingPrice || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div>
                            <FieldLabel label="Pricing Terms & Negotiation Notes" />
                            <input
                                type="text"
                                value={form.pricingNotes}
                                onChange={(e) => update("pricingNotes", e.target.value)}
                                placeholder="e.g. Farmgate pickup price; discounts available for full trailer orders (30 MT)."
                                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-normal text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* SECTION 5: Availability & Harvest Schedule */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3.5 border-b border-gray-100">
                            <Calendar size={20} className="text-[#1B4D28]" />
                            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                5. Availability & Harvest Schedule
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <FieldLabel label="Availability Status" required />
                                <select
                                    value={form.availabilityStatus}
                                    onChange={(e) => update("availabilityStatus", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                >
                                    {AVAILABILITY_STATUSES.map((st) => (
                                        <option key={st.value} value={st.value}>
                                            {st.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <FieldLabel label="Harvest Date" required error={errors.harvestDate} />
                                <input
                                    type="date"
                                    value={form.harvestDate}
                                    onChange={(e) => update("harvestDate", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {form.availabilityStatus !== "AVAILABLE_NOW" && (
                            <div>
                                <FieldLabel label="Available for Dispatch From" />
                                <input
                                    type="date"
                                    value={form.availableFrom}
                                    onChange={(e) => update("availableFrom", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {/* SECTION 6: Structured Farm Origin & Location */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3.5 border-b border-gray-100">
                            <MapPin size={20} className="text-[#1B4D28]" />
                            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                6. Structured Farm Origin & Location
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <FieldLabel label="Farm State" required error={errors.farmState} />
                                <select
                                    value={form.farmState}
                                    onChange={(e) => update("farmState", e.target.value)}
                                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                >
                                    {NIGERIAN_STATE_NAMES.map((st) => (
                                        <option key={st} value={st}>
                                            {st}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <FieldLabel label="Local Government Area (LGA)" required error={errors.farmLga} />
                                {availableLgas.length > 0 ? (
                                    <select
                                        value={form.farmLga}
                                        onChange={(e) => update("farmLga", e.target.value)}
                                        className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                    >
                                        {availableLgas.map((lga) => (
                                            <option key={lga} value={lga}>
                                                {lga}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={form.farmLga}
                                        onChange={(e) => update("farmLga", e.target.value)}
                                        placeholder="Enter LGA"
                                        className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <FieldLabel label="Community / Farm Village / Landmark" />
                            <input
                                type="text"
                                value={form.farmCommunity}
                                onChange={(e) => update("farmCommunity", e.target.value)}
                                placeholder="e.g. Serti Village Farm Cluster, km 15 Bali Road"
                                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-normal text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* SECTION 7: Storage & Handling Information */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3.5 border-b border-gray-100">
                            <Warehouse size={20} className="text-[#1B4D28]" />
                            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                7. Storage & Post-Harvest Handling
                            </h2>
                        </div>

                        <div>
                            <FieldLabel label="Storage Method" />
                            <select
                                value={form.storageCondition}
                                onChange={(e) => update("storageCondition", e.target.value)}
                                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                            >
                                {STORAGE_CONDITIONS.map((cond) => (
                                    <option key={cond} value={cond}>
                                        {cond}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <FieldLabel label="Handling & Logistics Notes" />
                            <input
                                type="text"
                                value={form.storageNotes}
                                onChange={(e) => update("storageNotes", e.target.value)}
                                placeholder="e.g. Fumigated with phostoxin 2 weeks ago; kept on wooden pallets off bare concrete."
                                className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 sm:py-3.5 text-sm sm:text-base font-normal text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* SECTION 8: Product Media */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <Upload size={20} className="text-[#1B4D28]" />
                                <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                    8. Produce Photography (Max 4)
                                </h2>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-400 font-semibold">{images.length}/4 uploaded</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group"
                                >
                                    <Image src={img} alt={`Upload ${idx + 1}`} fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2.5 right-2.5 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {images.length < 4 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#1B4D28] bg-gray-50/80 hover:bg-green-50/50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer p-3"
                                >
                                    <Upload size={22} className="text-gray-400 group-hover:text-[#1B4D28]" />
                                    <span className="text-xs font-bold text-gray-600">Add Photo</span>
                                    <span className="text-[10px] text-gray-400">PNG, JPG &lt; 5MB</span>
                                </button>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImages}
                            accept="image/png, image/jpeg, image/webp"
                            multiple
                            className="hidden"
                        />
                    </div>

                    {/* SECTION 9: Full Commodity Description */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3.5 border-b border-gray-100">
                            <FileText size={20} className="text-[#1B4D28]" />
                            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">
                                9. Commodity Description & Summary
                            </h2>
                        </div>
                        <textarea
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            rows={4}
                            placeholder="Provide any additional background about your farming cooperative, harvest conditions, loading assistance, or delivery terms..."
                            className="w-full bg-gray-50/80 border border-gray-200 rounded-xl p-4 text-sm sm:text-base font-normal text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4D28] focus:bg-white leading-relaxed transition-all"
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-7 sm:p-9 shadow-md flex flex-col sm:flex-row items-center gap-5">
                        <button
                            type="button"
                            onClick={() => handleAction("DRAFT")}
                            disabled={isSavingDraft || isLoading}
                            className="w-full sm:w-1/2 py-4 px-8 rounded-2xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold text-base flex items-center justify-center gap-2.5 transition-all hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{isSavingDraft ? "Saving Draft..." : "Save Draft"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAction("SUBMIT")}
                            disabled={isSavingDraft || isLoading}
                            className="w-full sm:w-1/2 py-4 px-8 rounded-2xl bg-[#1B4D28] hover:bg-[#153b1e] text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-green-900/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                        >
                            <Send size={18} />
                            <span>{isLoading ? "Submitting..." : "Submit for Admin Review"}</span>
                        </button>
                    </div>
                </div>

                {/* Right Column: Live Marketplace Commodity Preview Card (5 cols, sticky) */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
                            <Eye size={16} className="text-[#1B4D28]" />
                            <span>Live Showroom Preview</span>
                        </div>
                        <span className="text-xs font-bold bg-green-100 text-[#1B4D28] px-3 py-1 rounded-full">
                            Updates in real time
                        </span>
                    </div>

                    {/* Commodity Card Preview */}
                    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl transition-all">
                        {/* Image Preview */}
                        <div className="relative aspect-[16/10] w-full bg-gray-100 overflow-hidden">
                            <Image
                                src={images[0] || "/products/yam.png"}
                                alt={form.title || "Produce preview"}
                                fill
                                className="object-cover"
                            />
                            {/* Tags overlay */}
                            <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
                                <span className="bg-[#1B4D28] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    {form.produceType || "Produce"}
                                </span>
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                                    {form.grade}
                                </span>
                            </div>

                            <span className="absolute top-3.5 right-3.5 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                                {form.availabilityStatus === "AVAILABLE_NOW" ? "IN STOCK" : "UPCOMING"}
                            </span>
                        </div>

                        {/* Body Details */}
                        <div className="p-6 sm:p-7 space-y-5">
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-lg sm:text-xl leading-snug">
                                    {form.title || "Produce Listing Title"}
                                </h3>
                                <p className="text-xs sm:text-sm text-[#1B4D28] font-bold mt-1">
                                    {farmName || "Your Farm / Cooperative"} • {form.farmState}, Nigeria
                                </p>
                            </div>

                            {/* Key Specifications Badges */}
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs sm:text-sm">
                                <div className="p-3 bg-gray-50/90 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Unit Price</p>
                                    <p className="font-extrabold text-gray-900 text-base mt-0.5">
                                        ₦{Number(form.askingPrice || 0).toLocaleString("en-NG")}
                                        <span className="text-xs font-normal text-gray-500"> / {form.unit}</span>
                                    </p>
                                </div>

                                <div className="p-3 bg-gray-50/90 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Available Stock</p>
                                    <p className="font-extrabold text-[#1B4D28] text-base mt-0.5">
                                        {Number(form.quantity || 0).toLocaleString()} {form.unit}
                                    </p>
                                </div>

                                <div className="p-3 bg-gray-50/90 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Minimum Order (MOQ)</p>
                                    <p className="font-extrabold text-gray-800 text-sm mt-0.5">
                                        {form.moq || 1} {form.unit}
                                    </p>
                                </div>

                                <div className="p-3 bg-gray-50/90 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Packaging Format</p>
                                    <p className="font-bold text-gray-800 text-xs sm:text-sm truncate mt-0.5">
                                        {form.packaging}
                                    </p>
                                </div>
                            </div>

                            {/* Total Batch Est */}
                            <div className="p-4 sm:p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Estimated Lot Value</p>
                                    <p className="font-black text-emerald-900 text-base sm:text-lg mt-0.5">
                                        ₦{totalEstimatedValue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-full border border-emerald-200">
                                    {form.condition}
                                </span>
                            </div>

                            {/* Review Process Explanation */}
                            <div className="text-xs text-gray-500 p-4 sm:p-5 bg-gray-50 rounded-2xl space-y-1.5 leading-relaxed">
                                <p className="font-bold text-gray-700 flex items-center gap-1.5 text-xs sm:text-sm">
                                    <ShieldCheck size={16} className="text-[#1B4D28]" />
                                    Institutional Quality Moderation
                                </p>
                                <p>
                                    Once submitted, this listing will be reviewed by SmartHub compliance within 24 hours. Once approved, it appears live in the buyer catalog.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SubmitProducePage() {
    return (
        <Suspense fallback={
            <div className="max-w-6xl mx-auto py-12 px-4 space-y-6">
                <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
            </div>
        }>
            <SubmitProduceContent />
        </Suspense>
    );
}
