"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, CheckCircle2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { LinkedBankDTO } from "@/types/wallet.dto";

export function LinkedAccountsTab() {
  const { toast } = useToast();
  const [bankAccounts, setBankAccounts] = useState<LinkedBankDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [bankName, setBankName] = useState("Access Bank");
  const [bankCode, setBankCode] = useState("044");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/wallet/bank-accounts");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBankAccounts(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load bank accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || accountNumber.length !== 10) {
      toast("Please enter a valid 10-digit NGN account number.", "error");
      return;
    }

    if (!accountName) {
      toast("Please enter the account name.", "error");
      return;
    }

    try {
      const res = await fetch("/api/wallet/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName,
          bankCode,
          accountNumber,
          accountName,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast("Bank account linked successfully!", "success");
        setAccountNumber("");
        setAccountName("");
        setShowAddForm(false);
        await loadAccounts();
      } else {
        toast(json.error?.message || "Failed to link bank account.", "error");
      }
    } catch (err) {
      toast("Error connecting to server.", "error");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Linked Bank Accounts</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Verified NGN bank accounts for instant commercial withdrawal payouts.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#1B4D28] hover:bg-[#153a1e] text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={16} /> {showAddForm ? "Close Form" : "Link New Account"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddAccount} className="bg-white rounded-[24px] border border-gray-100 p-6 space-y-4 shadow-md max-w-xl">
          <h3 className="text-sm font-bold text-gray-800">Add New NGN Bank Account</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Select Bank</label>
              <select
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value);
                  setBankCode(e.target.value === "Zenith Bank" ? "057" : e.target.value === "GTBank" ? "058" : "044");
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
              >
                <option value="Access Bank">Access Bank</option>
                <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                <option value="Zenith Bank">Zenith Bank</option>
                <option value="First Bank">First Bank of Nigeria</option>
                <option value="UBA">United Bank for Africa (UBA)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Account Number</label>
              <input
                type="text"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0123456789"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono text-gray-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. John Doe Enterprises"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1B4D28] text-white py-3.5 rounded-full text-xs font-bold hover:bg-[#153a1e]"
          >
            Save Bank Account
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankAccounts.length > 0 ? (
          bankAccounts.map((account) => (
            <div key={account.id} className="p-6 rounded-[24px] bg-white border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-[#1B4D28] flex items-center justify-center font-bold">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{account.bankName}</h4>
                    <p className="text-[11px] text-gray-500 font-mono">Verified NGN Account</p>
                  </div>
                </div>
                {account.isDefault && (
                  <span className="bg-green-100 text-[#1B4D28] px-2.5 py-1 rounded-full text-[10px] font-mono font-bold">
                    DEFAULT
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800">{account.accountName}</p>
                <p className="text-lg font-mono font-extrabold text-[#1B4D28] tracking-wider">
                  {account.accountNumber}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-gray-500 col-span-2 bg-white rounded-[24px] border border-gray-100">
            No bank accounts linked yet. Click "Link New Account" to add your payout bank details.
          </div>
        )}
      </div>
    </div>
  );
}
