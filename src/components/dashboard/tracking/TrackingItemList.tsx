"use client";

import Image from "next/image";
import { OrderItemDTO } from "@/dto";

interface TrackingItemListProps {
    items?: OrderItemDTO[];
    totalAmount?: number;
}

export function TrackingItemList({ items, totalAmount }: TrackingItemListProps) {
    if (!items || items.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 text-sm">
                No items found in this order.
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Item List</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-500 text-sm">
                            <th className="pb-3 font-medium">Item Name</th>
                            <th className="pb-3 font-medium text-center">Unit Price</th>
                            <th className="pb-3 font-medium text-right">Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td className="py-3 flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-gray-50 shrink-0">
                                        <Image
                                            src={item.productImage}
                                            alt={item.productName}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-semibold text-sm">{item.productName}</p>
                                        <p className="text-xs text-gray-400">{item.farmerName} ({item.categoryName})</p>
                                    </div>
                                </td>
                                <td className="py-3 text-center text-gray-600 text-sm font-medium">
                                    ${item.unitPrice.toLocaleString()} / {item.unit}
                                </td>
                                <td className="py-3 text-right text-gray-800 text-sm font-bold">
                                    {item.quantity} {item.unit}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-lg text-gray-900">Total Amount</span>
                <span className="font-bold text-xl text-[#1B4D28]">
                    ${(totalAmount || items.reduce((acc, i) => acc + i.subtotal, 0)).toLocaleString()}
                </span>
            </div>
        </div>
    );
}
