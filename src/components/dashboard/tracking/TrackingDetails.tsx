"use client";

import { RefreshCw, MapPin, User } from "lucide-react";

export function TrackingDetails() {
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
                        <p className="text-gray-500 text-sm">Pickup Date</p>
                        <p className="font-bold text-gray-800">27, Dec 2025</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Estimate Drop</p>
                        <p className="font-bold text-gray-800">27, Dec 2025</p>
                    </div>
                </div>
            </div>

            {/* Location */}
            <div>
                <div className="flex items-center gap-2 mb-4 text-gray-600 font-medium">
                    <MapPin size={18} />
                    <h3>Location</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-gray-500 text-sm">Port Location</p>
                        <p className="font-bold text-gray-800">Dry Port</p>
                        <p className="text-sm text-gray-600">34, DryPort, United State.</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Pickup Location</p>
                        <p className="font-bold text-gray-800">John Deo</p>
                        <p className="text-sm text-gray-600">23, Marple Vanue Brookly NY 13334</p>
                        <p className="text-sm text-gray-600">United State.</p>
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
                        <p className="font-bold text-gray-800">John Deo</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Email</p>
                        <p className="font-bold text-gray-800 break-all">johndeo@gmail.com</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Phone Number</p>
                        <p className="font-bold text-gray-800">+1269-345 456</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
