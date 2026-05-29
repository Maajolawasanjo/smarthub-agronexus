"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Switch } from "@/components/ui/Switch";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

export default function BuyerSettingsPage() {
    const { user, updateUser } = useUser();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        currency: "",
        country: "",
        address: "",
        oldPassword: "",
        newPassword: "",
    });

    // Preferences state (separate derived toggles for demo)
    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        twoFactor: true,
    });

    // Sync context user to local form state on mount
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                currency: user.currency || "Select currency",
                country: user.country || "Select your country",
                address: user.address || "",
                oldPassword: "Oldpassword",
                newPassword: "Newpassword",
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                updateUser({ profileImage: dataUrl });
                toast("Profile image updated successfully!", "success");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({
            name: formData.name,
            email: formData.email,
            currency: formData.currency,
            country: formData.country,
            address: formData.address,
        });
        toast("Account details saved successfully!", "success");
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 hidden md:block">Settings</h1>

            <form onSubmit={handleSave} className="space-y-6">

                {/* 1. Account Information */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 space-y-8">
                    <h2 className="text-lg font-bold text-gray-800">Account Information</h2>

                    {/* Avatar Upload */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100">
                            <Image
                                src={user?.profileImage || "/avatar-2.png"}
                                alt="Profile"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gray-100 text-gray-600 px-6 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors"
                        >
                            Change
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">User Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="John Deo"
                                className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="johndeo@gmail.com"
                                className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Preference */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 space-y-8">
                    <h2 className="text-lg font-bold text-gray-800">Preference</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Currency</label>
                            <div className="relative">
                                <select
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm appearance-none focus:outline-none focus:border-[#1B4D28] transition-all text-gray-500"
                                >
                                    <option>Select currency</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="NGN">NGN (₦)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Country</label>
                            <div className="relative">
                                <select
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm appearance-none focus:outline-none focus:border-[#1B4D28] transition-all text-gray-500"
                                >
                                    <option>Select your country</option>
                                    <option value="Nigeria">Nigeria</option>
                                    <option value="USA">USA</option>
                                    <option value="Ghana">Ghana</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Delivery Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Enter your Address"
                                className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all placeholder:text-gray-300"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Change Password */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 space-y-8">
                    <h2 className="text-lg font-bold text-gray-800">Change Password</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Old Password</label>
                            <input
                                type="password"
                                name="oldPassword"
                                value={formData.oldPassword}
                                onChange={handleInputChange}
                                placeholder="Oldpassword"
                                className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                placeholder="Newpassword"
                                className="w-full px-6 py-3.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Notification Preference */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                    <h2 className="text-lg font-bold text-gray-800">Notification Preference</h2>

                    <div className="space-y-6 divide-y divide-gray-50">
                        <div className="flex items-center justify-between pt-0">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Email Notification</p>
                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">Receive update via email</p>
                            </div>
                            <Switch
                                checked={notifications.email}
                                onCheckedChange={(val) => setNotifications(prev => ({ ...prev, email: val }))}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-6">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">SMS Notification</p>
                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">Receive update via email</p>
                            </div>
                            <Switch
                                checked={notifications.sms}
                                onCheckedChange={(val) => setNotifications(prev => ({ ...prev, sms: val }))}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-6">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Two-factor Authentication</p>
                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">Add an extra layer of security to your account</p>
                            </div>
                            <Switch
                                checked={notifications.twoFactor}
                                onCheckedChange={(val) => setNotifications(prev => ({ ...prev, twoFactor: val }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="bg-[#1B4D28] text-white px-10 py-4 rounded-full text-sm font-bold hover:bg-[#153a1e] transition-all active:scale-[0.98] shadow-lg shadow-green-900/10"
                    >
                        Save Changes
                    </button>
                </div>

            </form>
        </div>
    );
}
