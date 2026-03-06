"use client";

import { cn } from "@/lib/utils";

const transactions = [
    { description: "Deposit", date: "Dec 26 2025", amount: "$500.00", type: "credit" },
    { description: "Withdrawal", date: "Dec 26 2025", amount: "-$100.00", type: "debit" },
    { description: "Deposit", date: "Dec 25 2025", amount: "$500.00", type: "credit" },
    { description: "Deposit", date: "Dec 24 2025", amount: "$500.00", type: "credit" },
    { description: "Withdrawal", date: "Dec 23 2025", amount: "-$300.00", type: "debit" },
    { description: "Deposit", date: "Dec 20 2025", amount: "$500.00", type: "credit" },
    { description: "Withdrawal", date: "Dec 20 2025", amount: "-$500.00", type: "debit" },
    { description: "Deposit", date: "Dec 18 2025", amount: "$500.00", type: "credit" },
    { description: "Withdrawal", date: "Dec 15 2025", amount: "$500.00", type: "debit" },
    { description: "Deposit", date: "Dec 12 2025", amount: "-$700.00", type: "debit" }, // As per image it says Deposit but amount is negative? Following image blindly or fixing logic? 
    // Image shows "Deposit ... -$700.00". This might be a UI mock error or a refund?
    // I will stick to the color coding: Green for positive strings, Red for negative strings.
    { description: "Withdrawal", date: "Dec 8 2025", amount: "-$158.00", type: "debit" },
    { description: "Deposit", date: "Dec 1 2025", amount: "$370.00", type: "credit" },
];

export function TransactionHistory() {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-medium text-gray-700 mb-6">Recent Transaction</h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-4 font-semibold text-gray-600">Description</th>
                            <th className="text-left py-4 font-semibold text-gray-600">Date</th>
                            <th className="text-right py-4 font-semibold text-gray-600">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {transactions.map((tx, i) => {
                            const isNegative = tx.amount.includes("-");
                            return (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 text-gray-600 font-medium">{tx.description}</td>
                                    <td className="py-4 text-gray-500">{tx.date}</td>
                                    <td className={cn(
                                        "py-4 text-right font-medium",
                                        isNegative ? "text-red-500" : "text-green-600"
                                    )}>
                                        {tx.amount}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
