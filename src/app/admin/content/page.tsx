"use client";

import React, { useState } from "react";
import { FileText, Plus, Check, Trash2, Eye, X, BookOpen, Send, CheckCircle2, ArrowRight } from "lucide-react";

// Mock B2B content catalogue
const initialArticles = [
    { id: "ART-98", title: "Navigating Cashew Export Regulations in West Africa", author: "OLAK", category: "Market Insights", views: 8241, status: "Published", date: "15-05-2026" },
    { id: "ART-92", title: "Top Organic Fertilizer Techniques for Premium Cocoa Yields", author: "Sarah Connor", category: "Farming Tips", views: 12941, status: "Published", date: "12-05-2026" },
    { id: "ART-84", title: "Understanding Cold-Chain Shipping for Fresh Fruit Imports", author: "Mike Johnson", category: "Logistics", views: 0, status: "Draft", date: "28-05-2026" },
    { id: "ART-79", title: "Seasonal Grain Shortages: Mitigating Contract Risk", author: "Sarah Connor", category: "Market Insights", views: 4291, status: "Published", date: "02-05-2026" },
];

export default function AdminContentPage() {
    const [articles, setArticles] = useState(initialArticles);
    const [activeTab, setActiveTab] = useState("All Articles");
    const [showModal, setShowModal] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Form inputs for new article
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("OLAK");
    const [category, setCategory] = useState("Market Insights");
    const [status, setStatus] = useState("Draft");

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    // Toggle publish status
    const togglePublish = (id: string) => {
        setArticles(prev =>
            prev.map(art => {
                if (art.id === id) {
                    const newStatus = art.status === "Published" ? "Draft" : "Published";
                    triggerToast(`Article status changed to ${newStatus}!`);
                    return { ...art, status: newStatus };
                }
                return art;
            })
        );
    };

    // Delete article
    const handleDelete = (id: string) => {
        setArticles(prev => prev.filter(art => art.id !== id));
        triggerToast("Article successfully removed.");
    };

    // Submit new content
    const handleAddArticle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !author) return;

        const newArt = {
            id: `ART-${Math.floor(10 + Math.random() * 90)}`,
            title,
            author,
            category,
            views: status === "Published" ? 12 : 0,
            status,
            date: "29-05-2026"
        };

        setArticles([newArt, ...articles]);
        setShowModal(false);
        setTitle("");
        triggerToast(`Article '${title}' successfully created as ${status}!`);
    };

    // Tab filter
    const filteredArticles = articles.filter(art => {
        if (activeTab === "Published" && art.status !== "Published") return false;
        if (activeTab === "Drafts" && art.status !== "Draft") return false;
        return true;
    });

    const totalViews = articles.reduce((acc, curr) => acc + curr.views, 0);

    return (
        <div className="space-y-6 animate-fadeIn font-sans">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#1B4D28] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2C5E39] animate-slideIn">
                    <CheckCircle2 size={20} className="text-[#4CAF50] flex-shrink-0" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}

            {/* Subtext info */}
            <div className="-mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                    Publish blog posts, agricultural tutorials, seasonal harvest reports, and announcements.
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#1B4D28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-colors cursor-pointer"
                >
                    <Plus size={14} />
                    Create New Content
                </button>
            </div>

            {/* CMS Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Articles */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-[#1B4D28] rounded-xl">
                        <BookOpen size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none">{articles.length}</span>
                        <span className="text-xs font-semibold text-gray-400 mt-1.5 uppercase tracking-wider">Total Articles</span>
                    </div>
                </div>

                {/* Drafts */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-[#1B4D28] rounded-xl">
                        <FileText size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none">{articles.filter(a => a.status === "Draft").length}</span>
                        <span className="text-xs font-semibold text-gray-400 mt-1.5 uppercase tracking-wider">Active Drafts</span>
                    </div>
                </div>

                {/* Views */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-[#1B4D28] rounded-xl">
                        <Eye size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gray-800 tracking-tight leading-none">{totalViews.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-gray-400 mt-1.5 uppercase tracking-wider">Platform Views</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-6 text-sm font-medium">
                {["All Articles", "Published", "Drafts"].map(tab => (
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

            {/* Articles Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Article ID</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Views</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                            {filteredArticles.length > 0 ? (
                                filteredArticles.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4.5 px-6 text-gray-800 font-bold">{item.id}</td>
                                        <td className="py-4.5 px-6 text-gray-600 font-semibold max-w-xs truncate" title={item.title}>
                                            {item.title}
                                        </td>
                                        <td className="py-4.5 px-6 text-gray-500">{item.author}</td>
                                        <td className="py-4.5 px-6">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold text-[10px]">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="py-4.5 px-6 text-gray-500 font-semibold">{item.views.toLocaleString()}</td>
                                        <td className="py-4.5 px-6">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight shadow-sm border ${
                                                item.status === "Published"
                                                    ? "bg-green-50 text-green-600 border-green-100"
                                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4.5 px-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => togglePublish(item.id)}
                                                    className={`text-xs font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                                                        item.status === "Published"
                                                            ? "text-amber-600 border-amber-100 hover:bg-amber-50"
                                                            : "text-green-600 border-green-100 hover:bg-green-50"
                                                    }`}
                                                >
                                                    {item.status === "Published" ? "Unpublish" : "Publish"}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                                    title="Delete Article"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-gray-400 font-semibold">
                                        No articles match this status tab.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── CREATE ARTICLE MODAL ─── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scaleIn">
                        <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-base">Create B2B Marketplace Content</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddArticle} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Article Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Navigating Logistics Regulations"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Content Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1B4D28] text-gray-700 font-semibold cursor-pointer"
                                    >
                                        <option value="Market Insights">Market Insights</option>
                                        <option value="Farming Tips">Farming Tips</option>
                                        <option value="Logistics">Logistics</option>
                                        <option value="General Announcements">Announcements</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Initial Status
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Draft"
                                            checked={status === "Draft"}
                                            onChange={() => setStatus("Draft")}
                                            className="accent-[#1B4D28]"
                                        />
                                        Save as Draft
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Published"
                                            checked={status === "Published"}
                                            onChange={() => setStatus("Published")}
                                            className="accent-[#1B4D28]"
                                        />
                                        Publish Immediately
                                    </label>
                                </div>
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
                                    className="bg-[#1B4D28] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#143d20] shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <Send size={12} />
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
