"use client";

import { RefreshCw, MapPin, User } from "lucide-react";
import { OrderDTO } from "@/dto";

interface TrackingDetailsProps {
    order?: OrderDTO | null;
}

export function TrackingDetails({ order }: TrackingDetailsProps) {
    const buyer = order?.buyer;
    const delivery = order?.delivery;

    const formattedCreatedAt = order?.createdAt
        ? new Date(order.createdAt).toLocaleDateString()
        : "N/A";
    const formattedEstimatedDelivery = delivery?.estimatedDelivery
        ? new Date(delivery.estimatedDelivery).toLocaleDateString()
        : "Pending Logistics Assignment";

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Order Info */}
            <div>
                <div className="flex items-center gap-2 mb-4 text-gray-600 font-medium">
                    <RefreshCw size={18} />
                    <h3>Order Information</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-gray-500 text-sm">Order Date</p>
                        <p className="font-bold text-gray-800">{formattedCreatedAt}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Estimated Delivery</p>
                        <p className="font-bold text-gray-800">{formattedEstimatedDelivery}</p>
                    </div>
                    {delivery?.trackingNumber && (
                        <div>
                            <p className="text-gray-500 text-sm">Tracking Number</p>
                            <p className="font-bold text-[#1B4D28]">{delivery.trackingNumber}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Location */}
            <div>
                <div className="flex items-center gap-2 mb-4 text-gray-600 font-medium">
                    <MapPin size={18} />
                    <h3>Location & Logistics</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-gray-500 text-sm">Delivery Address</p>
                        <p className="font-bold text-gray-800">{delivery?.deliveryAddress || buyer?.address || "Standard Delivery"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Logistics Partner</p>
                        <p className="font-bold text-gray-800">{delivery?.logisticsPartner || "Assigned Partner"}</p>
                    </div>
                </div>
            </div>

            {/* Customer Details */}
            <div>
                <div className="flex items-center gap-2 mb-4 text-gray-600 font-medium">
                    <User size={18} />
                    <h3>Customer Details</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-gray-500 text-sm">Full Name</p>
                        <p className="font-bold text-gray-800">{buyer?.fullName || "Valued Buyer"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Email</p>
                        <p className="font-bold text-gray-800 break-all">{buyer?.email || "buyer@smarthubagro.com"}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Phone Number</p>
                        <p className="font-bold text-gray-800">{buyer?.phoneNumber || "+234 800 000 0000"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
