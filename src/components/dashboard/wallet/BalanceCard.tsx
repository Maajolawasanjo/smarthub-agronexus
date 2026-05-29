"use client";

import { useState } from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { AddWalletModal } from "./AddWalletModal";

export function BalanceCard() {
    const [isVisible, setIsVisible] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-500 font-medium">Current Balance</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <h2 className="text-4xl font-bold text-gray-900">
                            {isVisible ? "$845.30" : "******"}
                        </h2>
                        <button
                            onClick={() => setIsVisible(!isVisible)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#1B4D28] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium hover:bg-[#143d1f] transition-colors shadow-lg shadow-green-900/10 w-full md:w-auto justify-center"
                >
                    Add Wallet
                    <Wallet size={18} />
                </button>
            </div>

            <AddWalletModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
