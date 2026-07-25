"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Switch } from "@/components/ui/Switch";
import {
  Tractor,
  MapPin,
  CreditCard,
  ShieldCheck,
  Bell,
  Lock,
  Camera,
  ChevronDown,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  Phone,
  Mail,
  User as UserIcon,
  Globe,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

const NG_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

const PRODUCE_CATEGORIES = [
  "Grains & Cereals (Sesame, Maize, Rice, Sorghum)",
  "Tubers & Roots (Cassava, Yam, Sweet Potato)",
  "Cash Crops & Spices (Cocoa, Ginger, Cashew, Palm Oil)",
  "Fresh Fruits & Vegetables (Tomatoes, Peppers, Citrus)",
  "Legumes & Pulses (Soybeans, Cowpeas, Groundnuts)",
  "Livestock & Poultry",
];

type SettingsTab = "farm" | "location" | "banking" | "notifications" | "security";

export default function FarmerSettingsPage() {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SettingsTab>("farm");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    farmName: "",
    farmDescription: "",
    farmAddress: "",
    state: "",
    lga: "",
    cacRegNumber: "",
    farmSizeHectares: "15",
    primaryProduceCategory: "Grains & Cereals (Sesame, Maize, Rice, Sorghum)",
    yearsInOperation: "5",
    nearestLogisticsHub: "",
    moqThresholdUnits: "50",
    preferredLogisticsPartner: "Kobo360 Logistics",
    bankName: "",
    accountNumber: "",
    accountName: "",
    payoutSchedule: "INSTANT_ON_DELIVERY",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailOrderAlerts: true,
    smsDispatchedAlerts: true,
    lowStockThresholdAlerts: true,
    escrowReleaseAlerts: true,
    marketingNews: false,
    twoFactorAuth: true,
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || user.phone || "",
        farmName: user.farmerProfile?.farmName || "",
        farmDescription: user.farmerProfile?.farmDescription || "",
        farmAddress: user.farmerProfile?.farmAddress || "",
        state: user.farmerProfile?.state || "Kano",
        lga: user.farmerProfile?.lga || "Kano Municipal",
      }));
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast("Image size must be under 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Url = reader.result as string;
      try {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileImage: base64Url }),
        });
        const json = await res.json();
        if (json.success) {
          await refreshUser();
          toast("Farm avatar photo updated successfully!", "success");
        } else {
          toast(json.error?.message || "Failed to save profile photo", "error");
        }
      } catch {
        toast("Network error uploading photo", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Update Profile & Farmer Profile Details
      const profileRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          farmName: formData.farmName,
          farmDescription: formData.farmDescription,
          farmAddress: formData.farmAddress,
          state: formData.state,
          lga: formData.lga,
        }),
      });
      const profileJson = await profileRes.json();

      if (!profileJson.success) {
        toast(profileJson.error?.message || "Failed to update profile", "error");
        return;
      }

      // 2. Update Password if specified
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast("New password and confirmation do not match", "error");
          return;
        }
        const passRes = await fetch("/api/user/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: formData.oldPassword,
            newPassword: formData.newPassword,
          }),
        });
        const passJson = await passRes.json();
        if (!passJson.success) {
          toast(passJson.error?.message || "Failed to update password", "error");
          return;
        }
        setFormData((prev) => ({ ...prev, oldPassword: "", newPassword: "", confirmPassword: "" }));
      }

      await refreshUser();
      toast("Farmer Business Profile and System Preferences saved!", "success");
    } catch (err) {
      toast("Failed to save farmer settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const profileCompletion = user?.profileCompletion ?? 85;
  const isVerified = user?.isVerified ?? false;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner Card: Profile Overview & Verification Badge */}
          <div className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#1B4D28] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10 relative shadow-inner">
                    <Image
                      src={user?.profileImage || "/avatar-2.png"}
                      alt="Farm Avatar"
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
                    className="absolute -bottom-1 -right-1 p-2 bg-[#1B4D28] text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all border border-white/30"
                    title="Change Farm Avatar"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{formData.farmName || user?.fullName || "Agro Farm"}</h2>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Producer
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Sparkles className="w-3 h-3" />
                        Tier 1 Producer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
                    <span>{user?.email}</span>
                    <span>•</span>
                    <span>{formData.state ? `${formData.state} State, Nigeria` : "Nigeria"}</span>
                  </p>
                </div>
              </div>

              {/* Profile Completion Bar */}
              <div className="w-full md:w-64 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-gray-200">Profile Completion</span>
                  <span className="text-emerald-400 font-bold">{profileCompletion}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-300 mt-2">
                  Complete all logistics & banking info to unlock Tier 2 benefits.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-2 overflow-x-auto">
            {[
              { id: "farm", label: "Farm & Business", icon: Tractor },
              { id: "location", label: "Location & Logistics", icon: MapPin },
              { id: "banking", label: "Banking & Settlement", icon: CreditCard },
              { id: "notifications", label: "Alerts & Preferences", icon: Bell },
              { id: "security", label: "Security & Credentials", icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#1B4D28] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Body */}
          <form onSubmit={handleSaveSettings} className="space-y-6">

            {/* TAB 1: FARM & BUSINESS PROFILE */}
            {activeTab === "farm" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4D28] flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Farm & Enterprise Details</h3>
                    <p className="text-xs text-gray-500">Commercial credentials displayed to wholesale buyers</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Contact Person Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                        placeholder="Farmer Full Name"
                      />
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Registered Farm Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="farmName"
                        value={formData.farmName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                        placeholder="e.g. Oak Agro Farms Ltd"
                      />
                      <Tractor className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">CAC Registration No. (Optional)</label>
                    <input
                      type="text"
                      name="cacRegNumber"
                      value={formData.cacRegNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="e.g. RC-1849204"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Primary Produce Category</label>
                    <div className="relative">
                      <select
                        name="primaryProduceCategory"
                        value={formData.primaryProduceCategory}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-[#1B4D28] transition-all text-gray-800"
                      >
                        {PRODUCE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Farm Cultivation Area (Hectares)</label>
                    <input
                      type="number"
                      name="farmSizeHectares"
                      value={formData.farmSizeHectares}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="e.g. 25"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Years in Operation</label>
                    <input
                      type="number"
                      name="yearsInOperation"
                      value={formData.yearsInOperation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="e.g. 7"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Farm Description & Overview</label>
                    <textarea
                      name="farmDescription"
                      rows={3}
                      value={formData.farmDescription}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="Briefly describe your agricultural operations, soil processing, and harvest capacity..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOCATION & LOGISTICS */}
            {activeTab === "location" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Location & Dispatch Logistics</h3>
                    <p className="text-xs text-gray-500">Warehouse pickup points and delivery preferences</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Farm Location Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="farmAddress"
                        value={formData.farmAddress}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                        placeholder="e.g. Km 12 Agricultural Zone, Zaria Road"
                      />
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">State of Operation</label>
                    <div className="relative">
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-[#1B4D28] transition-all text-gray-800"
                      >
                        {NG_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Local Government Area (LGA)</label>
                    <input
                      type="text"
                      name="lga"
                      value={formData.lga}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="e.g. Kano Municipal"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nearest Transport / Aggregation Hub</label>
                    <input
                      type="text"
                      name="nearestLogisticsHub"
                      value={formData.nearestLogisticsHub}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="e.g. Dawanau Grain Market Depot"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Wholesale Minimum Order Quantity (MOQ Units)</label>
                    <input
                      type="number"
                      name="moqThresholdUnits"
                      value={formData.moqThresholdUnits}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BANKING & SETTLEMENT */}
            {activeTab === "banking" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Banking & Automated Settlement</h3>
                    <p className="text-xs text-gray-500">NIP withdrawal accounts and escrow payout rules</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Settlement Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="e.g. First Bank of Nigeria"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">NIP 10-Digit Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="e.g. 3019284710"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Verified Account Holder Name</label>
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="Account holder name as registered with NIBSS"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Escrow Payout Preference</label>
                    <select
                      name="payoutSchedule"
                      value={formData.payoutSchedule}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all text-gray-800"
                    >
                      <option value="INSTANT_ON_DELIVERY">Instant Release upon Buyer Delivery Confirmation</option>
                      <option value="WEEKLY_BATCH">Weekly Automated Batch Settlement (Every Friday)</option>
                      <option value="MANUAL_WITHDRAWAL">Manual Withdrawal Request to Linked Account</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICATIONS & ALERTS */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">System Alerts & Preference Controls</h3>
                    <p className="text-xs text-gray-500">Manage real-time SMS, Email, and Low-Stock triggers</p>
                  </div>
                </div>

                <div className="space-y-6 divide-y divide-gray-100">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Email Order Alerts</h4>
                      <p className="text-xs text-gray-500">Receive instant email notifications when new orders are placed.</p>
                    </div>
                    <Switch
                      checked={notifications.emailOrderAlerts}
                      onCheckedChange={(val) => setNotifications((p) => ({ ...p, emailOrderAlerts: val }))}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">SMS Dispatch Notifications</h4>
                      <p className="text-xs text-gray-500">Send direct SMS alerts to mobile phone on order dispatches.</p>
                    </div>
                    <Switch
                      checked={notifications.smsDispatchedAlerts}
                      onCheckedChange={(val) => setNotifications((p) => ({ ...p, smsDispatchedAlerts: val }))}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Low Stock Threshold Warnings (≤ 20 Units)</h4>
                      <p className="text-xs text-gray-500">Trigger automatic inventory warnings on produce listings.</p>
                    </div>
                    <Switch
                      checked={notifications.lowStockThresholdAlerts}
                      onCheckedChange={(val) => setNotifications((p) => ({ ...p, lowStockThresholdAlerts: val }))}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Escrow Release Financial Confirmations</h4>
                      <p className="text-xs text-gray-500">Receive email ledger receipts when escrow funds unlock to wallet.</p>
                    </div>
                    <Switch
                      checked={notifications.escrowReleaseAlerts}
                      onCheckedChange={(val) => setNotifications((p) => ({ ...p, escrowReleaseAlerts: val }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SECURITY & CREDENTIALS */}
            {activeTab === "security" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Security Credentials & Account Safety</h3>
                    <p className="text-xs text-gray-500">Update account password and security settings</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Current Password</label>
                    <input
                      type="password"
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="••••••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="••••••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                      placeholder="••••••••••••"
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Two-Factor Authentication (2FA)</h4>
                        <p className="text-xs text-gray-500">Require SMS / Email OTP for high-value NIP withdrawals.</p>
                      </div>
                      <Switch
                        checked={notifications.twoFactorAuth}
                        onCheckedChange={(val) => setNotifications((p) => ({ ...p, twoFactorAuth: val }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Action Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All profile changes are encrypted and saved directly to PostgreSQL</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#1B4D28] text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-[#153a1e] transition-all active:scale-[0.98] shadow-md shadow-green-900/20 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
              </button>
            </div>

          </form>
    </div>
  );
}
