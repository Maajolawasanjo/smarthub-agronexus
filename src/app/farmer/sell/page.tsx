"use client";

import { useState } from "react";
import {
    ChevronLeft,
    ChevronDown,
    Calendar,
    MapPin,
    Upload,
} from "lucide-react";
import Link from "next/link";

/**
 * SubmitProducePage Component
 * 
 * Allows farmers to list new produce by providing harvest details, 
 * logistics information, and verification images.
 */
export default function SubmitProducePage() {
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
                <form className="space-y-10">

                    {/* Produce Information Section */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-800">Produce Info</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">What did you harvest?</label>
                                <div className="relative">
                                    <select className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-full text-sm appearance-none focus:outline-none focus:border-[#1B4D28] transition-all text-gray-400">
                                        <option>Select produce type</option>
                                        <option>Yam</option>
                                        <option>Rice</option>
                                        <option>Pepper</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Specific Variety</label>
                                <div className="relative">
                                    <select className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-full text-sm appearance-none focus:outline-none focus:border-[#1B4D28] transition-all text-gray-400">
                                        <option>e.g Abuja yam</option>
                                        <option>Habanero</option>
                                        <option>Long grain</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Quantity Available</label>
                                <input
                                    type="text"
                                    placeholder="e.g 500kg"
                                    className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all placeholder:text-gray-300"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Unit Of Measure</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="e.g 500kg"
                                        className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all placeholder:text-gray-300"
                                    />
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Asking Price</label>
                                <input
                                    type="text"
                                    placeholder="e.g N300,000"
                                    className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logistics Information Section */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-800">Logistic Info</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Harvest Date</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Date"
                                        className="w-full px-4 py-3.5 pl-12 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                                    />
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Farm Location</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="e.g Kaduna"
                                        className="w-full px-4 py-3.5 pl-12 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all placeholder:text-gray-300"
                                    />
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification and Documentation Section */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-800">Verification</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Upload Images</label>
                                <div className="relative border-2 border-dashed border-gray-200 rounded-[20px] h-[160px] flex flex-col items-center justify-center p-6 text-center hover:border-[#1B4D28] transition-colors group cursor-pointer">
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-50">
                                        <Upload className="text-gray-400 group-hover:text-[#1B4D28]" size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">Click to upload photos</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">PNG, JPG or GIF (max. 5MB each)</p>
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" multiple />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Additional Note</label>
                                <textarea
                                    rows={6}
                                    placeholder="Any specific details about quality variety, or storage conditions..."
                                    className="w-full px-6 py-4 bg-white border border-gray-200 rounded-[20px] text-sm focus:outline-none focus:border-[#1B4D28] transition-all placeholder:text-gray-300 resize-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-[#1B4D28] text-white py-4 rounded-full text-sm font-bold hover:bg-[#153a1e] transition-all active:scale-[0.99] shadow-lg shadow-green-900/10"
                        >
                            Submit Produce
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

