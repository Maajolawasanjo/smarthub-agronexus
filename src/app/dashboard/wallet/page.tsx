"use client";

import { useState } from "react";
import { WalletTabs, WalletTabType } from "@/components/dashboard/wallet/WalletTabs";
import { OverviewTab } from "@/components/dashboard/wallet/OverviewTab";
import { TransferTab } from "@/components/dashboard/wallet/TransferTab";
import { LinkedAccountsTab } from "@/components/dashboard/wallet/LinkedAccountsTab";
import { TransactionsTab } from "@/components/dashboard/wallet/TransactionsTab";
import { EscrowTab } from "@/components/dashboard/wallet/EscrowTab";
import { DisputesTab } from "@/components/dashboard/wallet/DisputesTab";
import { StatementsTab } from "@/components/dashboard/wallet/StatementsTab";
import { AddFundModal } from "@/components/dashboard/wallet/AddFundModal";

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<WalletTabType>("overview");
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 md:px-0 font-sans">
      {/* Navigation Sub-Tabs */}
      <WalletTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Sub-Views Content */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <OverviewTab
            onOpenAddFund={() => setIsAddFundOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "transfer" && <TransferTab />}

        {activeTab === "accounts" && <LinkedAccountsTab />}

        {activeTab === "transactions" && <TransactionsTab />}

        {activeTab === "escrow" && <EscrowTab />}

        {activeTab === "disputes" && <DisputesTab />}

        {activeTab === "statements" && <StatementsTab />}
      </div>

      {/* Deposit Modal */}
      <AddFundModal
        isOpen={isAddFundOpen}
        onClose={() => setIsAddFundOpen(false)}
      />
    </div>
  );
}
