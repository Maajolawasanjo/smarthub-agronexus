"use client";

import React, { useState } from "react";
import { 
    UserPlus, Search, ArrowRight, Eye, ShieldAlert, X, CheckCircle2, 
    UserX, UserCheck, ShieldCheck, Mail, Phone, MapPin, Package, ExternalLink 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Array<{ 
        id: string; 
        rawId: string; 
        email: string; 
        name: string; 
        role: string; 
        status: string; 
        joined: string;
        rawUser: any;
    }>>([]);
    const [activeTab, setActiveTab] = useState("All users");
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (data.users) {
                const mapped = data.users.map((u: any) => ({
                    id: u.id.slice(-6).toUpperCase(),
                    rawId: u.id,
                    email: u.email,
                    name: u.fullName || "Unnamed User",
                    role: u.role === "FARMER" ? "Farmer" : u.role === "BUYER" ? "Buyer" : u.role === "ADMIN" ? "Admin" : "Agent",
                    status: u.isActive ? "Active" : "Inactive",
                    joined: new Date(u.createdAt).toLocaleDateString("en-GB"),
                    rawUser: u,
                }));
                setUsers(mapped);
            }
        } catch (err) {
            console.error("Failed to load users from backend:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Form inputs for new user
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPhone, setNewUserPhone] = useState("");
    const [newUserRole, setNewUserRole] = useState("Buyer");
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    // Toast state
    const [toastMessage, setToastMessage] = useState("");

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail) return;

        setIsCreatingUser(true);
        try {
            const phone = newUserPhone.trim() || `+234${Math.floor(7000000000 + Math.random() * 2999999999)}`;
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: newUserName.trim(),
                    email: newUserEmail.trim(),
                    phoneNumber: phone,
                    role: newUserRole.toUpperCase() === "AGENT" ? "BUYER" : newUserRole.toUpperCase(),
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                setNewUserName("");
                setNewUserEmail("");
                setNewUserPhone("");
                setNewUserRole("Buyer");
                triggerToast(`User account for ${newUserName} successfully created!`);
                await fetchUsers();
            } else {
                triggerToast(`Failed to create user: ${data.error || "Server error"}`);
            }
        } catch (err) {
            triggerToast("Network error creating user account.");
        } finally {
            setIsCreatingUser(false);
        }
    };

    // Toggle user status between Active & Inactive via PATCH /api/admin/users
    const toggleUserStatus = async (rawId: string, currentStatus: string, name: string) => {
        const targetIsActive = currentStatus !== "Active";
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: rawId, isActive: targetIsActive }),
            });

            if (res.ok) {
                const newStatus = targetIsActive ? "Active" : "Inactive";
                setUsers(prev =>
                    prev.map(user => (user.rawId === rawId ? { ...user, status: newStatus } : user))
                );
                triggerToast(`User status for ${name} changed to ${newStatus}.`);
            } else {
                triggerToast(`Failed to update status for ${name}.`);
            }
        } catch (err) {
            triggerToast(`Error updating status for ${name}.`);
        }
    };

    // Filter logic
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.id.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        if (activeTab === "Active users") return user.status === "Active";
        if (activeTab === "Inactive users") return user.status === "Inactive";
        if (activeTab === "Admins") return user.role === "Admin";
        if (activeTab === "Buyers") return user.role === "Buyer";
        if (activeTab === "Farmers") return user.role === "Farmer";
        return true;
    });

    return (
        <div className="space-y-6 animate-fadeIn font-sans pb-12">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Header row */}
            <div className="-mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Platform Users & Producer Registry</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Inspect user accounts, verify farmer profiles, and manage system access
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
                >
                    <UserPlus size={14} />
                    Add User
                </button>
            </div>

            {/* Banner element */}
            <div className="relative h-44 md:h-48 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <Image
                    src="/agrochain-farmers.png"
                    alt="AgroChain Platform Operations"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center px-8">
                    <div className="text-white max-w-md">
                        <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                            Identity & Governance Desk
                        </span>
                        <h2 className="text-xl md:text-2xl font-black">Verified Ecosystem Actors</h2>
                        <p className="text-xs md:text-sm text-gray-200 mt-1">
                            Click on any farmer or buyer to view their complete profile dossier, farm location, and trading metrics.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-2">
                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-6 text-sm font-medium">
                    {["All users", "Active users", "Inactive users", "Farmers", "Buyers", "Admins"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-1 relative transition-colors font-semibold cursor-pointer ${
                                activeTab === tab
                                    ? "text-[#1B4D28] border-b-2 border-[#1B4D28]"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search name, email, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1B4D28]"
                    />
                </div>
            </div>

            {/* Responsive Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">User ID</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Name / Organization</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4.5 px-6 text-gray-800 font-bold">#{item.id}</td>
                                        <td className="py-4.5 px-6">
                                            <button
                                                onClick={() => setSelectedUser(item.rawUser)}
                                                className="text-left font-bold text-gray-900 hover:text-[#1B4D28] transition-colors cursor-pointer group flex items-center gap-1.5"
                                            >
                                                <span>{item.rawUser?.farmerProfile?.farmName || item.name}</span>
                                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1B4D28]" />
                                            </button>
                                            {item.rawUser?.farmerProfile?.farmName && (
                                                <div className="text-xs text-gray-400 font-normal">
                                                    Farmer: {item.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4.5 px-6 text-gray-600 font-semibold">{item.email}</td>
                                        <td className="py-4.5 px-6">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                item.role === "Farmer"
                                                    ? "bg-[#EEF2EE] text-[#1B4D28] border border-[#1B4D28]/20"
                                                    : item.role === "Buyer"
                                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                            }`}>
                                                {item.role}
                                            </span>
                                        </td>
                                        <td className="py-4.5 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight border ${
                                                item.status === "Active"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-red-50 text-red-700 border-red-200"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Active" ? "bg-green-600 animate-pulse" : "bg-red-600"}`} />
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4.5 px-6 text-gray-400 text-xs font-semibold">{item.joined}</td>
                                        <td className="py-4.5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleUserStatus(item.rawId, item.status, item.name)}
                                                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                                                        item.status === "Active"
                                                            ? "text-red-600 border-red-200 hover:bg-red-50"
                                                            : "text-green-600 border-green-200 hover:bg-green-50"
                                                    }`}
                                                >
                                                    {item.status === "Active" ? (
                                                        <>
                                                            <UserX size={13} />
                                                            Suspend
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserCheck size={13} />
                                                            Activate
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setSelectedUser(item.rawUser)}
                                                    className="flex items-center gap-1 text-xs font-bold text-[#1B4D28] bg-[#1B4D28]/5 hover:bg-[#1B4D28]/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <Eye size={13} />
                                                    Dossier
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400 font-semibold">
                                        No platform users match this filter tab.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ─── MODAL: USER / FARMER PROFILE DOSSIER ─── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn">
                        {/* Header */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#1B4D28] to-[#256c38] px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg">
                                    {(selectedUser.farmerProfile?.farmName || selectedUser.fullName || selectedUser.email || "U")[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-snug">
                                        {selectedUser.farmerProfile?.farmName || selectedUser.fullName || "Platform User"}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-white/80 mt-0.5">
                                        <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{selectedUser.role}</span>
                                        {selectedUser.role === "FARMER" && (
                                            <span className="flex items-center gap-1 text-emerald-300 font-bold">
                                                <ShieldCheck size={13} /> Verified Producer
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 text-sm">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Holder</span>
                                    <span className="font-bold text-gray-900">{selectedUser.fullName || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
                                    <a href={`mailto:${selectedUser.email}`} className="font-semibold text-[#1B4D28] hover:underline flex items-center gap-1">
                                        <Mail size={13} />
                                        {selectedUser.email}
                                    </a>
                                </div>
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</span>
                                    <a href={`tel:${selectedUser.phoneNumber}`} className="font-semibold text-gray-800 flex items-center gap-1">
                                        <Phone size={13} />
                                        {selectedUser.phoneNumber || "Not registered"}
                                    </a>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Status</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                        selectedUser.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}>
                                        {selectedUser.isActive ? "Active & Authorized" : "Suspended"}
                                    </span>
                                </div>
                            </div>

                            {/* Farmer Specific Card */}
                            {selectedUser.farmerProfile && (
                                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2.5">
                                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Farm Facility</span>
                                        <span className="font-bold text-emerald-950">{selectedUser.farmerProfile.farmName}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Origin Location</span>
                                        <span className="font-bold text-emerald-950 flex items-center gap-1">
                                            <MapPin size={13} />
                                            {selectedUser.farmerProfile.lga ? `${selectedUser.farmerProfile.lga}, ` : ""}{selectedUser.farmerProfile.state || "Nigeria"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Commodities Listed</span>
                                        <span className="font-black text-emerald-900">
                                            {selectedUser.farmerProfile._count?.products ?? 0} commodities
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Buyer Specific Card */}
                            {selectedUser.buyerProfile && (
                                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-2.5">
                                    <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Business Entity</span>
                                        <span className="font-bold text-blue-950">{selectedUser.buyerProfile.businessName || "Commercial Buyer"}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Destination Port/City</span>
                                        <span className="font-bold text-blue-950">
                                            {selectedUser.buyerProfile.city || "Lagos"}, {selectedUser.buyerProfile.state || "Nigeria"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Footer actions */}
                            <div className="pt-2 flex gap-3">
                                {selectedUser.farmerProfile && (
                                    <Link
                                        href="/admin/products"
                                        className="flex-1 bg-[#1B4D28] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors text-center block"
                                    >
                                        Inspect Produce Listings
                                    </Link>
                                )}
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="text-xs font-bold text-gray-500 hover:bg-gray-100 border border-gray-200 px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ─── MODAL: ADD USER ─── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scaleIn">
                        <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-base">Add New Platform User</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter full name"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Email Handle
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter email address"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+234 800 000 0000 (Optional, auto-generated if empty)"
                                    value={newUserPhone}
                                    onChange={(e) => setNewUserPhone(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    User Role
                                </label>
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                >
                                    <option value="Buyer">Buyer</option>
                                    <option value="Farmer">Farmer</option>
                                    <option value="Agent">Agent</option>
                                </select>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#1B4D28] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-all cursor-pointer"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
