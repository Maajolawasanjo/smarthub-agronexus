"use client";

import React, { useState } from "react";
import { UserPlus, Search, ArrowRight, Eye, ShieldAlert, X, CheckCircle2, UserX, UserCheck } from "lucide-react";
import Image from "next/image";

// Mock data matching Image 5 exactly
const initialUsers = [
    { id: "83335", email: "john@example.com", name: "John Deo", role: "Farmer", status: "Active", joined: "23-06-2026" },
    { id: "90299", email: "jane@example.com", name: "Jane Smith", role: "Buyer", status: "Active", joined: "23-06-2026" },
    { id: "90298", email: "mike@example.com", name: "Mike Johnson", role: "Farmer", status: "Active", joined: "23-06-2026" },
    { id: "65109", email: "sarah@example.com", name: "Sarah Connor", role: "Agent", status: "Active", joined: "23-06-2026" },
    { id: "65108", email: "ahmed@example.com", name: "Ahmed Buba", role: "Buyer", status: "Inactive", joined: "23-06-2026" },
];

export default function AdminUsersPage() {
    const [users, setUsers] = useState(initialUsers);
    const [activeTab, setActiveTab] = useState("All users");
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    React.useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch("/api/admin/users");
                const data = await res.json();
                if (data.users && data.users.length > 0) {
                    const mapped = data.users.map((u: any) => ({
                        id: u.id.slice(-6).toUpperCase(),
                        email: u.email,
                        name: u.fullName,
                        role: u.role === "FARMER" ? "Farmer" : u.role === "BUYER" ? "Buyer" : "Agent",
                        status: u.isActive ? "Active" : "Inactive",
                        joined: new Date(u.createdAt).toLocaleDateString("en-GB"),
                    }));
                    setUsers(mapped);
                }
            } catch (err) {
                // Fallback
            }
        }
        fetchUsers();
    }, []);

    // Form inputs for new user
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserRole, setNewUserRole] = useState("Buyer");

    // Toast state
    const [toastMessage, setToastMessage] = useState("");

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail) return;

        const newUser = {
            id: Math.floor(10000 + Math.random() * 90000).toString(),
            email: newUserEmail,
            name: newUserName,
            role: newUserRole,
            status: "Active",
            joined: "29-05-2026"
        };

        setUsers([newUser, ...users]);
        setShowModal(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserRole("Buyer");
        triggerToast(`User account for ${newUserName} successfully created!`);
    };

    // Toggle user status between Active & Inactive
    const toggleUserStatus = (id: string) => {
        setUsers(prev =>
            prev.map(user => {
                if (user.id === id) {
                    const newStatus = user.status === "Active" ? "Inactive" : "Active";
                    triggerToast(`User status for ${user.name} changed to ${newStatus}.`);
                    return { ...user, status: newStatus };
                }
                return user;
            })
        );
    };

    // Filter users by tab & search query
    const filteredUsers = users.filter(user => {
        if (activeTab === "Farmers" && user.role !== "Farmer") return false;
        if (activeTab === "Buyers" && user.role !== "Buyer") return false;
        if (activeTab === "Agent" && user.role !== "Agent") return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.id.includes(query)
            );
        }

        return true;
    });

    return (
        <div className="space-y-6 animate-fadeIn relative font-sans">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Header row with Add User action */}
            <div className="-mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                    All platform users
                </p>
                <div className="flex items-center gap-3">
                    {/* Compact search input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Filter by name/email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:border-[#1B4D28] w-48 shadow-sm"
                        />
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors cursor-pointer"
                    >
                        <UserPlus size={14} />
                        Add User
                    </button>
                </div>
            </div>

            {/* Banner */}
            <div className="relative h-44 md:h-52 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                <Image
                    src="/agrochain-farmers.png"
                    alt="Agricultural landscape field banner"
                    fill
                    className="object-cover brightness-[0.8] saturate-[1.1]"
                    priority
                />
                <div className="absolute inset-0 bg-black/10 backdrop-brightness-[0.95]" />
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-6 text-sm font-medium">
                {["All users", "Farmers", "Buyers", "Agent"].map(tab => (
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

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4.5 px-6 text-gray-800 font-bold">{item.id}</td>
                                        <td className="py-4.5 px-6 text-gray-600 font-semibold">{item.email}</td>
                                        <td className="py-4.5 px-6 text-gray-500">{item.name}</td>
                                        <td className="py-4.5 px-6">
                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                                item.role === "Farmer"
                                                    ? "bg-[#EEF2EE] text-[#1B4D28]"
                                                    : item.role === "Buyer"
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "bg-purple-50 text-purple-600"
                                            }`}>
                                                {item.role}
                                            </span>
                                        </td>
                                        <td className="py-4.5 px-6">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight shadow-sm border ${
                                                item.status === "Active"
                                                    ? "bg-green-50 text-green-600 border-green-100"
                                                    : "bg-red-50 text-red-500 border-red-100"
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4.5 px-6 text-gray-400 text-xs font-semibold">{item.joined}</td>
                                        <td className="py-4.5 px-6">
                                            <button
                                                onClick={() => toggleUserStatus(item.id)}
                                                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                                                    item.status === "Active"
                                                        ? "text-red-500 border-red-100 hover:bg-red-50"
                                                        : "text-green-600 border-green-100 hover:bg-green-50"
                                                }`}
                                            >
                                                {item.status === "Active" ? (
                                                    <>
                                                        <UserX size={14} />
                                                        Suspend
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck size={14} />
                                                        Activate
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-gray-400 font-semibold">
                                        No platform users match this filter tab.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── ADD USER MODAL DRAWER ─── */}
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
