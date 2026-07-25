"use client";

import React, { useEffect, useState } from "react";
import { Search, Users, ShoppingBag, ArrowUpRight, Mail, Phone, MapPin, Award } from "lucide-react";

interface CustomerRecord {
  buyerId: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  location: string;
  totalOrdersCount: number;
  totalSpend: number;
  formattedTotalSpend: string;
  lastOrderDate: string;
}

export default function FarmerCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totalCustomersCount: number;
    repeatCustomersCount: number;
    totalCustomerLifetimeValue: number;
    formattedTotalCustomerLifetimeValue: string;
    customers: CustomerRecord[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/farmer/customers");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = (data?.customers || []).filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Buyers</p>

                <h3 className="text-2xl font-bold text-gray-900 mt-1">{data?.totalCustomersCount ?? 0}</h3>

                <p className="text-xs text-gray-500 mt-1">Active verified purchasers</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1B4D28] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Repeat Customers</p>

                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{data?.repeatCustomersCount ?? 0}</h3>

                <p className="text-xs text-gray-500 mt-1">Buyers with {">"}1 completed order</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Lifetime Value</p>

                <h3 className="text-2xl font-bold text-gray-900 mt-1">{data?.formattedTotalCustomerLifetimeValue ?? "₦0.00"}</h3>

                <p className="text-xs text-gray-500 mt-1">Cumulative spend across buyers</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Customer Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search buyer by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B4D28] transition-all"
              />
            </div>
          </div>

          {/* Customer List Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Verified Marketplace Buyers</h2>
              <span className="text-xs text-gray-400 font-medium">{filteredCustomers.length} Records</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">Loading customer directory...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                No buyers found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="py-4 px-6">Buyer Name & Company</th>
                      <th className="py-4 px-6">Contact Info</th>
                      <th className="py-4 px-6">Location</th>
                      <th className="py-4 px-6 text-center">Total Orders</th>
                      <th className="py-4 px-6 text-right">Lifetime Spend</th>
                      <th className="py-4 px-6 text-right">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.buyerId} className="hover:bg-gray-50/80 transition-all">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{customer.fullName}</div>
                          <div className="text-xs text-gray-400">{customer.companyName}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-xs text-gray-500 mt-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{customer.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{customer.location}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-gray-900">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-[#1B4D28]">
                            {customer.totalOrdersCount}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900">
                          {customer.formattedTotalSpend}
                        </td>
                        <td className="py-4 px-6 text-right text-xs text-gray-500">
                          {customer.lastOrderDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
    </div>
  );
}
