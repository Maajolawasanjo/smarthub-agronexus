"use client";

import Image from "next/image";

const items = [
    { name: "Rice grain", price: "$400", quantity: "345", image: "/vegetable-container-white.png" },
    { name: "Corn grain", price: "$150", quantity: "283", image: "/vegetable-container-white.png" },
    { name: "Rice grain", price: "$400", quantity: "345", image: "/vegetable-container-white.png" },
    { name: "Rice grain", price: "$400", quantity: "345", image: "/vegetable-container-white.png" },
];

export function TrackingItemList() {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Item List</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-500 text-sm">
                            <th className="pb-3 font-medium">Item Name</th>
                            <th className="pb-3 font-medium text-center">Base Price</th>
                            <th className="pb-3 font-medium text-right">Qunatity (ton)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                        {items.map((item, i) => (
                            <tr key={i}>
                                <td className="py-3 flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded-sm overflow-hidden bg-gray-50">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <span className="text-gray-700 font-medium">{item.name}</span>
                                </td>
                                <td className="py-3 text-center text-gray-600">{item.price}</td>
                                <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-lg text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">$7,700</span>
            </div>
        </div>
    );
}
