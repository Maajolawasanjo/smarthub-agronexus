"use client";

import React, { useState, useEffect } from "react";
import {
    Settings,
    ShieldCheck,
    Save,
    Percent,
    Server,
    Shield,
    Users,
    Mail,
    Sliders,
    CheckCircle2,
    ToggleLeft,
    ToggleRight,
    User as UserIcon,
    Globe,
    Home,
    Upload
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import Image from "next/image";

// Initial admin roster data
const initialAdmins = [
    { name: "OLAK", email: "olak@debridger.com", role: "Super Admin", status: "Active" },
    { name: "Sarah Connor", email: "sarah@debridger.com", role: "Moderator", status: "Active" },
    { name: "Ahmed Buba", email: "ahmed@debridger.com", role: "Auditor", status: "Inactive" },
];

export default function AdminSettingsPage() {
    const { user, updateUser } = useUser();
    const [activeTab, setActiveTab] = useState("Platform Fees");
    const [admins, setAdmins] = useState(initialAdmins);

    // Platform Settings (State driven for testing)
    const [commission, setCommission] = useState(5.0);
    const [escrowClearHours, setEscrowClearHours] = useState(24);
    const [autoRelease, setAutoRelease] = useState(true);
    const [requireCert, setRequireCert] = useState(true);

    const [siteName, setSiteName] = useState("Smarthub Agrochain");
    const [supportEmail, setSupportEmail] = useState("support@smarthub.com");

    // Profile Settings (Bound directly to UserContext)
    const [profileName, setProfileName] = useState("");
    const [profileEmail, setProfileEmail] = useState("");
    const [profileCountry, setProfileCountry] = useState("");
    const [profileAddress, setProfileAddress] = useState("");
    const [profileAvatar, setProfileAvatar] = useState("/avatar-1.png");

    // Prepopulate profile inputs from active UserContext
    useEffect(() => {
        if (user) {
            setProfileName(user.name || "");
            setProfileEmail(user.email || "");
            setProfileCountry(user.country || "Nigeria");
            setProfileAddress(user.address || "");
            setProfileAvatar(user.profileImage || "/avatar-1.png");
        }
    }, [user]);

    // Success Toast simulation
    const [toastMessage, setToastMessage] = useState("");

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                triggerToast("Only image files are allowed!");
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                triggerToast("Image size must be less than 2MB!");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                setProfileAvatar(base64Url);
                triggerToast("Selected picture loaded! Click Save to apply changes.");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (activeTab === "Admin Profile") {
            // Update profile in UserContext / localStorage
            updateUser({
                name: profileName,
                email: profileEmail,
                country: profileCountry,
                address: profileAddress,
                profileImage: profileAvatar
            });
            triggerToast("Profile successfully updated and synced across workspace!");
        } else {
            triggerToast("Settings successfully saved to local system storage!");
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn relative font-sans">
            {/* Header info */}
            <div className="-mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                    Configure B2B platform commissions, automatic escrow releases, security access, and personal administrator profiles.
                </p>
            </div>

            {/* Simulated Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-6 text-sm font-medium">
                {["Platform Fees", "General Configuration", "Security & Team", "Admin Profile"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3.5 px-1 relative transition-colors font-semibold cursor-pointer ${
                            activeTab === tab
                                ? "text-[#1B4D28] border-b-2 border-[#1B4D28]"
                                : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSave} className="space-y-6">

                    {/* ─── TAB 1: PLATFORM FEES ─── */}
                    {activeTab === "Platform Fees" && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                                <Sliders size={18} className="text-[#1B4D28]" />
                                <h3 className="font-bold text-gray-800 text-base">Fee Structure & Escrow Clearances</h3>
                            </div>

                            {/* Commission Input Slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <label className="text-gray-600 flex items-center gap-1.5">
                                        <Percent size={14} className="text-gray-400" />
                                        Marketplace Commission Rate
                                    </label>
                                    <span className="text-[#1B4D28] font-bold text-base">{commission}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="1.0"
                                    max="15.0"
                                    step="0.5"
                                    value={commission}
                                    onChange={(e) => setCommission(parseFloat(e.target.value))}
                                    className="w-full accent-[#1B4D28] h-1.5 bg-gray-100 rounded-lg cursor-pointer appearance-none"
                                />
                                <span className="block text-[10px] font-semibold text-gray-400">
                                    This percentage slice is automatically escrowed on buyer deposits before paying out the farmer.
                                </span>
                            </div>

                            <hr className="border-gray-50" />

                            {/* Escrow Release Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Auto-Release Hours (Delivered)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="168"
                                        value={escrowClearHours}
                                        onChange={(e) => setEscrowClearHours(parseInt(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                    <span className="block text-[10px] text-gray-400 font-medium">
                                        Funds release autonomously if buyer doesn't file a dispute within this timeframe.
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Payout Release Mechanism
                                    </label>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-xs font-semibold text-gray-600">Authorize releases automatically</span>
                                        <button
                                            type="button"
                                            onClick={() => setAutoRelease(!autoRelease)}
                                            className="text-[#1B4D28] hover:text-[#143d20] transition-colors cursor-pointer"
                                        >
                                            {autoRelease ? <ToggleRight size={38} strokeWidth={1.5} /> : <ToggleLeft size={38} strokeWidth={1.5} className="text-gray-300" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            {/* Verification toggles */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Listing Verification Mandate
                                </label>
                                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700">Mandate Quality & Organic Certificates</span>
                                        <span className="text-[10px] text-gray-400 font-semibold mt-0.5">Require PDF certificate uploads before approving cashew/cocoa listings.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRequireCert(!requireCert)}
                                        className="text-[#1B4D28] hover:text-[#143d20] transition-colors flex-shrink-0 cursor-pointer"
                                    >
                                        {requireCert ? <ToggleRight size={38} strokeWidth={1.5} /> : <ToggleLeft size={38} strokeWidth={1.5} className="text-gray-300" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── TAB 2: GENERAL CONFIG ─── */}
                    {activeTab === "General Configuration" && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                                <Server size={18} className="text-[#1B4D28]" />
                                <h3 className="font-bold text-gray-800 text-base">B2B Core Metadata Settings</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Marketplace Site Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={siteName}
                                        onChange={(e) => setSiteName(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Mail size={12} className="text-gray-400" />
                                        Primary Support Mailbox
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={supportEmail}
                                        onChange={(e) => setSupportEmail(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── TAB 3: SECURITY & TEAM ─── */}
                    {activeTab === "Security & Team" && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                                <Shield size={18} className="text-[#1B4D28]" />
                                <h3 className="font-bold text-gray-800 text-base">Authorized Administrative Roster</h3>
                            </div>

                            {/* Admins Table */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50 font-bold text-gray-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Admin name</th>
                                            <th className="py-3 px-4">Email contact</th>
                                            <th className="py-3 px-4">Security Role</th>
                                            <th className="py-3 px-4">Portal Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-600">
                                        {admins.map(admin => (
                                            <tr key={admin.email} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="py-3 px-4 font-bold text-gray-800">{admin.name}</td>
                                                <td className="py-3 px-4">{admin.email}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold text-[10px]">
                                                        {admin.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-lg border ${
                                                        admin.status === "Active"
                                                            ? "bg-green-50 text-green-600 border-green-100"
                                                            : "bg-red-50 text-red-500 border-red-100"
                                                    }`}>
                                                        {admin.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ─── TAB 4: MY ADMIN PROFILE (New!) ─── */}
                    {activeTab === "Admin Profile" && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                                <UserIcon size={18} className="text-[#1B4D28]" />
                                <h3 className="font-bold text-gray-800 text-base">My Administrator Account Profile</h3>
                            </div>

                            {/* Avatar / Profile Picture Upload from Device */}
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                                    Administrative Profile Picture
                                </label>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    {/* Preview container */}
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-[#1B4D28]/10 bg-white shadow-inner flex-shrink-0">
                                        {profileAvatar ? (
                                            <Image
                                                src={profileAvatar}
                                                alt="Admin Avatar Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs font-bold">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    {/* File Input Controls */}
                                    <div className="space-y-2.5 text-center sm:text-left">
                                        <p className="text-sm font-bold text-gray-700">Upload profile image from your laptop or device</p>
                                        <p className="text-xs text-gray-400 font-semibold">Supports PNG, JPG, or GIF (Max 2MB)</p>
                                        <div className="relative flex justify-center sm:justify-start">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                id="admin-avatar-upload"
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="admin-avatar-upload"
                                                className="inline-flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm hover:shadow transition-all cursor-pointer"
                                            >
                                                <Upload size={14} />
                                                Choose Image File
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name input */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Display Name / Handler
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>

                                {/* Email input */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Email Contact Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={profileEmail}
                                        onChange={(e) => setProfileEmail(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>

                                {/* Country */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <Globe size={12} className="text-gray-400" />
                                        Primary Operations Country
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={profileCountry}
                                        onChange={(e) => setProfileCountry(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>

                                {/* HQ Address */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <Home size={12} className="text-gray-400" />
                                        Physical Headquarters Address
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={profileAddress}
                                        onChange={(e) => setProfileAddress(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Submission Button */}
                    <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#143d20] shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
                        >
                            <Save size={16} />
                            Save Config Changes
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
