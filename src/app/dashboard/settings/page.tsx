"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { Switch } from "@/components/ui/Switch";
import { ChevronDown, Camera, User, Mail, Phone, MapPin, Tractor, Eye, EyeOff, ShieldCheck, Bell, Smartphone } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const NG_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

export default function SettingsPage() {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFarmer = user?.role === "FARMER";

  // ─── Form State ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    // Buyer fields
    address: "",
    state: "",
    lga: "",
    // Farmer fields
    farmName: "",
    farmDescription: "",
    farmAddress: "",
    farmState: "",
    farmLga: "",
  });

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    twoFactor: true,
  });

  // ─── Sync from UserContext on mount ───────────────────────────────────────
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || "",
        email: user.email || "",
        phoneNumber: (user as any).phoneNumber || "",
        address: (user as any).buyerProfile?.address || "",
        state: (user as any).buyerProfile?.state || "",
        lga: (user as any).buyerProfile?.lga || "",
        farmName: (user as any).farmerProfile?.farmName || "",
        farmDescription: (user as any).farmerProfile?.farmDescription || "",
        farmAddress: (user as any).farmerProfile?.farmAddress || "",
        farmState: (user as any).farmerProfile?.state || "",
        farmLga: (user as any).farmerProfile?.lga || "",
      });
      if (user.profileImage) setProfileImagePreview(null); // let the Image component use user.profileImage
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ─── Profile Image Upload (auto-saves immediately) ────────────────────────
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Url = reader.result as string;
      setProfileImagePreview(base64Url);
      try {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileImage: base64Url }),
        });
        const json = await res.json();
        if (json.success) {
          await refreshUser(); // ← updates navbar profile icon immediately
          toast("Profile photo updated!", "success");
        } else {
          toast(json.error?.message || "Failed to save profile photo", "error");
        }
      } catch {
        toast("Network error uploading photo", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── Save Profile Fields ──────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      };

      if (isFarmer) {
        payload.farmName = formData.farmName;
        payload.farmDescription = formData.farmDescription;
        payload.farmAddress = formData.farmAddress;
        payload.state = formData.farmState;
        payload.lga = formData.farmLga;
      } else {
        payload.address = formData.address;
        payload.state = formData.state;
        payload.lga = formData.lga;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        toast(json.error?.message || "Failed to update profile", "error");
        return;
      }

      await refreshUser(); // ← updates navbar name + avatar
      toast("Profile saved successfully!", "success");
    } catch {
      toast("Failed to save profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Change Password ──────────────────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.oldPassword || !passwords.newPassword) {
      toast("Please fill in both password fields.", "error");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast("New passwords do not match.", "error");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast("New password must be at least 8 characters.", "error");
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.oldPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast(json.error?.message || "Failed to update password", "error");
        return;
      }
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast("Password updated successfully!", "success");
    } catch {
      toast("Failed to update password.", "error");
    } finally {
      setSavingPw(false);
    }
  };

  const avatarSrc = profileImagePreview || user?.profileImage || "/avatar-2.png";
  const displayName = user?.fullName || user?.name || "User";
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  return (
    <div className="max-w-4xl mx-auto pb-12 font-sans space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 hidden md:block">Settings</h1>

      {/* ── 1. Profile Card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <User size={16} className="text-[#1B4D28]" /> Account Information
          <span className="ml-auto text-[10px] font-mono bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
            {isFarmer ? "FARMER" : "BUYER"}
          </span>
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#1B4D28]/20 shadow-md">
              {user?.profileImage || profileImagePreview ? (
                <Image
                  src={avatarSrc}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1B4D28] text-white flex items-center justify-center text-xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1B4D28] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#153a1e] transition-colors cursor-pointer"
              title="Change photo"
            >
              <Camera size={13} />
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          <div>
            <p className="text-sm font-bold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs text-[#1B4D28] font-semibold hover:underline cursor-pointer"
            >
              Change profile photo →
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nathan Ma'ajo"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                />
              </div>
            </div>

            {/* Phone Number — matches signup */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="08012345678"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Buyer-only fields ── */}
          {!isFarmer && (
            <div className="space-y-4 pt-2 border-t border-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Delivery Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">State</label>
                  <div className="relative">
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-full text-sm appearance-none focus:outline-none focus:border-[#1B4D28] transition-all text-gray-700"
                    >
                      <option value="">Select State</option>
                      {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">LGA</label>
                  <input
                    type="text"
                    name="lga"
                    value={formData.lga}
                    onChange={handleChange}
                    placeholder="e.g. Kano Municipal"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delivery Address</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="12 Agricultural Extension Way, Kano"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Farmer-only fields ── */}
          {isFarmer && (
            <div className="space-y-4 pt-2 border-t border-gray-50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Tractor size={13} /> Farm Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Farm Name</label>
                  <div className="relative">
                    <Tractor size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      name="farmName"
                      value={formData.farmName}
                      onChange={handleChange}
                      placeholder="Oak Agro Farms"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Farm State</label>
                  <div className="relative">
                    <select
                      name="farmState"
                      value={formData.farmState}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-full text-sm appearance-none focus:outline-none focus:border-[#1B4D28] transition-all text-gray-700"
                    >
                      <option value="">Select State</option>
                      {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Farm LGA</label>
                  <input
                    type="text"
                    name="farmLga"
                    value={formData.farmLga}
                    onChange={handleChange}
                    placeholder="e.g. Kano Municipal"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Farm Address</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      name="farmAddress"
                      value={formData.farmAddress}
                      onChange={handleChange}
                      placeholder="Plot 3, Agro Estate, Kano"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Farm Description</label>
                  <textarea
                    name="farmDescription"
                    value={formData.farmDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe your farm, produce types, and certifications..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1B4D28] text-white px-10 py-3.5 rounded-full text-sm font-bold hover:bg-[#153a1e] transition-all active:scale-[0.98] shadow-lg shadow-green-900/10 cursor-pointer disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* ── 2. Change Password ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 space-y-5">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#1B4D28]" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Current Password</label>
            <input
              type="password"
              value={passwords.oldPassword}
              onChange={e => setPasswords(p => ({ ...p, oldPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
              />
              <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Confirm New Password</label>
            <input
              type={showNewPw ? "text" : "password"}
              value={passwords.confirmPassword}
              onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={savingPw}
              className="bg-gray-900 text-white px-10 py-3.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg cursor-pointer disabled:opacity-60"
            >
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. Notification Preferences ────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8 space-y-5">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <Bell size={16} className="text-[#1B4D28]" /> Notification Preferences
        </h2>

        <div className="space-y-0 divide-y divide-gray-50">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <Mail size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Email Notifications</p>
                <p className="text-[11px] text-gray-400">Receive updates and alerts via email</p>
              </div>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={val => setNotifications(prev => ({ ...prev, email: val }))}
            />
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Smartphone size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">SMS Notifications</p>
                <p className="text-[11px] text-gray-400">Receive order updates via SMS</p>
              </div>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={val => setNotifications(prev => ({ ...prev, sms: val }))}
            />
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <ShieldCheck size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Two-Factor Authentication</p>
                <p className="text-[11px] text-gray-400">Add an extra layer of security to your account</p>
              </div>
            </div>
            <Switch
              checked={notifications.twoFactor}
              onCheckedChange={val => setNotifications(prev => ({ ...prev, twoFactor: val }))}
            />
          </div>
        </div>
      </div>

      {/* ── 4. Danger Zone ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-rose-100 shadow-sm p-6 md:p-8 space-y-4">
        <h2 className="text-base font-bold text-rose-700">Danger Zone</h2>
        <p className="text-xs text-gray-500">
          These actions are permanent and cannot be undone. Please proceed with caution.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-6 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full hover:bg-rose-100 transition-colors cursor-pointer"
            onClick={() => toast("Account deletion requires manual support review. Contact support@smarthub-agro.com", "error")}
          >
            Delete Account
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => toast("All your data has been flagged for export. You'll receive an email shortly.", "success")}
          >
            Export My Data
          </button>
        </div>
      </div>
    </div>
  );
}
