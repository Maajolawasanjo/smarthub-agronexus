"use client";

import { BalanceCard } from "@/components/dashboard/wallet/BalanceCard";
import { TransactionHistory } from "@/components/dashboard/wallet/TransactionHistory";

export default function WalletPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <BalanceCard />
            <TransactionHistory />
        </div>
    );
}
