"use client";

import { useState } from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Transaction Data Model
 */
const transactions = [
    { id: 1, description: "Deposit", date: "Dec 26 2025", amount: 200.00 },
    { id: 2, description: "Withdrawal", date: "Dec 10 2025", amount: -120.00 },
    { id: 3, description: "Deposit", date: "Dec 02 2025", amount: 340.00 },
    { id: 4, description: "Withdrawal", date: "Dec 10 2025", amount: -120.00 },
    { id: 5, description: "Deposit", date: "Dec 02 2025", amount: 340.00 },
    { id: 6, description: "Withdrawal", date: "Dec 10 2025", amount: -120.00 },
    { id: 7, description: "Deposit", date: "Dec 02 2025", amount: 340.00 },
    { id: 8, description: "Withdrawal", date: "Dec 10 2025", amount: -120.00 },
    { id: 9, description: "Deposit", date: "Dec 02 2025", amount: 340.00 },
    { id: 10, description: "Withdrawal", date: "Dec 10 2025", amount: -120.00 },
    { id: 11, description: "Deposit", date: "Dec 02 2025", amount: 340.00 },
];

/**
 * WalletPage Component
 * 
 * Provides a financial overview for the farmer, including current balance toggles 
 * and a detailed history of recent transactions.
 */
export default function WalletPage() {
    const [isVisible, setIsVisible] = useState(true);
    const balance = "$854.30";

    return (
        <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0">

            {/* Account Balance Summary */}
            <div className="relative bg-[#1B4D28] rounded-[20px] p-6 md:p-10 overflow-hidden shadow-lg mb-8">
                {/* Background decorative patterns */}
                <div className="absolute top-0 right-0 w-64 h-64 border-[1px] border-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-48 h-48 border-[1px] border-white/10 rounded-full -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 border-[1px] border-white/15 rounded-full -mr-12 -mt-12 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs md:text-sm font-medium text-green-100 mb-1 opacity-80">
                            Current Balance
                        </p>
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                {isVisible ? balance : "••••••"}
                            </h2>
                            <button
                                onClick={() => setIsVisible(!isVisible)}
                                className="p-1.5 text-white/60 hover:text-white transition-colors focus:outline-none"
                                aria-label={isVisible ? "Hide balance" : "Show balance"}
                            >
                                {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                        </div>
                    </div>

                    <button className="bg-white text-[#1B4D28] px-6 py-2.5 rounded-full text-xs md:text-sm font-bold shadow-md hover:bg-green-50 transition-all active:scale-[0.98] w-fit flex items-center gap-2 self-start md:self-center">
                        Withdraw Funds
                        <Wallet size={16} />
                    </button>
                </div>
            </div>

            {/* Transaction History Table */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-bold text-gray-800">Recent Transactions</h3>
                    <button className="text-xs font-bold text-[#1B4D28] hover:underline">View All</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white border-b border-gray-50">
                                <th className="px-8 py-4 text-[11px] md:text-xs font-bold uppercase text-gray-400">Description</th>
                                <th className="px-8 py-4 text-[11px] md:text-xs font-bold uppercase text-gray-400">Date</th>
                                <th className="px-8 py-4 text-[11px] md:text-xs font-bold uppercase text-gray-400">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <p className="text-xs md:text-sm font-medium text-gray-700">{t.description}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs md:text-sm text-gray-400 font-medium">{t.date}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className={cn(
                                            "text-xs md:text-sm font-bold",
                                            t.amount > 0 ? "text-green-600" : "text-red-500"
                                        )}>
                                            {t.amount > 0 ? `$${t.amount.toFixed(2)}` : `-$${Math.abs(t.amount).toFixed(2)}`}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

