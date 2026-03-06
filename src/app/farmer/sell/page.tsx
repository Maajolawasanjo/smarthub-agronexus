"use client";

import { useState, useRef } from "react";
import {
    ChevronLeft,
    ChevronDown,
    Calendar,
    MapPin,
    Upload,
    X,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProduce } from "@/context/ProduceContext";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const PRODUCE_TYPES = ["Yam", "Rice", "Pepper", "Cassava", "Maize", "Cashew", "Cocoa", "Ginger", "Tomato", "Soybean"];
const VARIETIES: Record<string, string[]> = {
    Yam: ["Abuja Yam", "Puna Yam", "White Yam", "Water Yam"],
    Rice: ["Long Grain", "Ofada", "Basmati", "Jasmine"],
    Pepper: ["Habanero", "Tatashe", "Cayenne", "Bell Pepper"],
    Cassava: ["Sweet Cassava", "African Cassava", "Bitter Cassava"],
    Maize: ["White Maize", "Yellow Maize", "Sweet Corn"],
    Cashew: ["Raw Cashew Nut", "Processed Cashew"],
    Cocoa: ["Forastero", "Trinitario", "Criollo"],
    Ginger: ["Yellow Ginger", "White Ginger"],
    Tomato: ["Roma", "Cherry", "Beefsteak"],
    Soybean: ["Yellow Soybean", "Black Soybean"],
};
const UNITS = ["kg", "tonnes", "bags (50 kg)", "crates", "pieces"];

interface FormState {
    produceType: string;
    variety: string;
    quantity: string;
    unit: string;
    askingPrice: string;
    harvestDate: string;
    farmLocation: string;
    notes: string;
}

interface FormErrors {
    produceType?: string;
    variety?: string;
    quantity?: string;
    unit?: string;
    askingPrice?: string;
    harvestDate?: string;
    farmLocation?: string;
}

function validate(form: FormState): FormErrors {
    const e: FormErrors = {};
    if (!form.produceType) e.produceType = "Please select a produce type";
    if (!form.variety) e.variety = "Please select a variety";
    if (!form.quantity.trim()) e.quantity = "Quantity is required";
    else if (isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) e.quantity = "Enter a valid number";
    if (!form.unit) e.unit = "Select a unit";
    if (!form.askingPrice.trim()) e.askingPrice = "Asking price is required";
    if (!form.harvestDate) e.harvestDate = "Harvest date is required";
    if (!form.farmLocation.trim()) e.farmLocation = "Farm location is required";
    return e;
}

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

function FieldLabel({ label, error }: { label: string; error?: string }) {
    return (
        <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">{label}</label>
            {error && (
                <span className="flex items-center gap-1 text-[11px] text-red-500">
                    <AlertCircle size={11} />
                    {error}
                </span>
            )}
        </div>
    );
}

export default function SubmitProducePage() {
    const router = useRouter();
    const { addListing } = useProduce();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormState>({
        produceType: "",
        variety: "",
        quantity: "",
        unit: "",
        askingPrice: "",
        harvestDate: "",
        farmLocation: "",
        notes: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
    const [images, setImages] = useState<string[]>([]);  // base64 previews
    const [isLoading, setIsLoading] = useState(false);

    const update = (field: keyof FormState, value: string) => {
        const next = { ...form, [field]: value };
        // Reset variety when produce type changes
        if (field === "produceType") next.variety = "";
        setForm(next);
        if (touched[field as keyof FormErrors]) {
            setErrors(validate(next));
        }
    };

    const touch = (field: keyof FormErrors) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(validate(form));
    };

    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast(`${file.name} exceeds 5MB limit`, "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => {
                    if (prev.length >= 4) { toast("Maximum 4 images allowed", "error"); return prev; }
                    return [...prev, reader.result as string];
                });
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const allTouched = Object.fromEntries(
            Object.keys(form).map(k => [k, true])
        ) as Partial<Record<keyof FormErrors, boolean>>;
        setTouched(allTouched);
        const errs = validate(form);
        setErrors(errs);

        if (Object.keys(errs).length > 0) {
            toast("Please fix the errors before submitting", "error");
            return;
        }

        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1500)); // Simulate processing

        const listing = addListing({
            produceType: form.produceType,
            variety: form.variety,
            quantity: form.quantity,
            unit: form.unit,
            askingPrice: form.askingPrice,
            harvestDate: form.harvestDate,
            farmLocation: form.farmLocation,
            notes: form.notes,
            images,
        });

        toast("Produce submitted successfully!", "success");
        router.push(`/farmer/produce/${listing.id}`);
    };

    const fieldCls = (hasError: boolean) => cn(
        "w-full px-6 py-3.5 bg-white border rounded-full text-sm focus:outline-none transition-all",
        hasError
            ? "border-red-400 focus:border-red-400 bg-red-50/30"
            : "border-gray-200 focus:border-[#1B4D28]"
    );

    const selectCls = (hasError: boolean) => cn(
        "w-full px-4 py-3.5 bg-white border rounded-full text-sm appearance-none focus:outline-none transition-all",
        hasError
            ? "border-red-400 text-red-400"
            : "border-gray-200 focus:border-[#1B4D28] text-gray-700"
    );

    const varietyOptions = form.produceType ? VARIETIES[form.produceType] || [] : [];

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-6">
                <Link
                    href="/farmer"
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4 w-fit"
                >
                    <ChevronLeft size={16} />
                    Back
                </Link>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-10">
                <form onSubmit={handleSubmit} noValidate className="space-y-10">

                    {/* ── PRODUCE INFO ── */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Produce Info</h2>
                            <p className="text-xs text-gray-400 mt-1">Tell us what you&apos;ve harvested</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            {/* Produce Type */}
                            <div>
                                <FieldLabel label="What did you harvest?" error={touched.produceType ? errors.produceType : undefined} />
                                <div className="relative">
                                    <select
                                        value={form.produceType}
                                        onChange={e => update("produceType", e.target.value)}
                                        onBlur={() => touch("produceType")}
                                        className={selectCls(!!(touched.produceType && errors.produceType))}
                                    >
                                        <option value="">Select produce type</option>
                                        {PRODUCE_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Variety */}
                            <div>
                                <FieldLabel label="Specific Variety" error={touched.variety ? errors.variety : undefined} />
                                <div className="relative">
                                    <select
                                        value={form.variety}
                                        onChange={e => update("variety", e.target.value)}
                                        onBlur={() => touch("variety")}
                                        disabled={!form.produceType}
                                        className={cn(selectCls(!!(touched.variety && errors.variety)), !form.produceType && "opacity-50 cursor-not-allowed")}
                                    >
                                        <option value="">{form.produceType ? "Select variety" : "Select produce first"}</option>
                                        {varietyOptions.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <FieldLabel label="Quantity Available" error={touched.quantity ? errors.quantity : undefined} />
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 500"
                                    value={form.quantity}
                                    onChange={e => update("quantity", e.target.value)}
                                    onBlur={() => touch("quantity")}
                                    className={fieldCls(!!(touched.quantity && errors.quantity))}
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <FieldLabel label="Unit of Measure" error={touched.unit ? errors.unit : undefined} />
                                <div className="relative">
                                    <select
                                        value={form.unit}
                                        onChange={e => update("unit", e.target.value)}
                                        onBlur={() => touch("unit")}
                                        className={selectCls(!!(touched.unit && errors.unit))}
                                    >
                                        <option value="">Select unit</option>
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Asking Price */}
                            <div>
                                <FieldLabel label="Asking Price (₦)" error={touched.askingPrice ? errors.askingPrice : undefined} />
                                <input
                                    type="text"
                                    placeholder="e.g. 300000"
                                    value={form.askingPrice}
                                    onChange={e => update("askingPrice", e.target.value.replace(/[^0-9.]/g, ""))}
                                    onBlur={() => touch("askingPrice")}
                                    className={fieldCls(!!(touched.askingPrice && errors.askingPrice))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── LOGISTIC INFO ── */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Logistic Info</h2>
                            <p className="text-xs text-gray-400 mt-1">Harvest and location details</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            {/* Harvest Date */}
                            <div>
                                <FieldLabel label="Harvest Date" error={touched.harvestDate ? errors.harvestDate : undefined} />
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={form.harvestDate}
                                        max={new Date().toISOString().slice(0, 10)}
                                        onChange={e => update("harvestDate", e.target.value)}
                                        onBlur={() => touch("harvestDate")}
                                        className={cn(fieldCls(!!(touched.harvestDate && errors.harvestDate)), "pl-12")}
                                    />
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Farm Location */}
                            <div>
                                <FieldLabel label="Farm Location" error={touched.farmLocation ? errors.farmLocation : undefined} />
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="e.g. Kaduna"
                                        value={form.farmLocation}
                                        onChange={e => update("farmLocation", e.target.value)}
                                        onBlur={() => touch("farmLocation")}
                                        className={cn(fieldCls(!!(touched.farmLocation && errors.farmLocation)), "pl-12")}
                                    />
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── VERIFICATION ── */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Verification</h2>
                            <p className="text-xs text-gray-400 mt-1">Upload photos and add any extra details</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            {/* Image Upload */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Upload Images <span className="text-xs font-normal text-gray-400">(up to 4)</span>
                                </label>

                                {/* Preview grid */}
                                {images.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {images.map((src, i) => (
                                            <div key={i} className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-gray-100">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={12} className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {images.length < 4 && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative border-2 border-dashed border-gray-200 rounded-[20px] h-[140px] flex flex-col items-center justify-center p-6 text-center hover:border-[#1B4D28] transition-colors group cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-50">
                                            <Upload className="text-gray-400 group-hover:text-[#1B4D28]" size={20} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">Click to upload photos</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">PNG, JPG or GIF (max. 5MB each)</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImages}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Additional Note</label>
                                <textarea
                                    rows={6}
                                    placeholder="Any specific details about quality, variety, or storage conditions..."
                                    value={form.notes}
                                    onChange={e => update("notes", e.target.value)}
                                    className="w-full px-6 py-4 bg-white border border-gray-200 rounded-[20px] text-sm focus:outline-none focus:border-[#1B4D28] transition-all placeholder:text-gray-300 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full py-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/10",
                                isLoading
                                    ? "bg-[#1B4D28]/70 text-white cursor-not-allowed"
                                    : "bg-[#1B4D28] hover:bg-[#153a1e] active:scale-[0.99] text-white"
                            )}
                        >
                            {isLoading ? <><Spinner /> Submitting Produce…</> : "Submit Produce"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
