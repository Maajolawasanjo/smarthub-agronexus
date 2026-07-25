"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrackingTimeline } from "@/components/dashboard/tracking/TrackingTimeline";
import { TrackingDetails } from "@/components/dashboard/tracking/TrackingDetails";
import { TrackingItemList } from "@/components/dashboard/tracking/TrackingItemList";
import { TrackingMap } from "@/components/dashboard/tracking/TrackingMap";
import { Search, PackageX, CheckCircle2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { FulfillmentDTO } from "@/dto";

function TrackingContent() {
    const searchParams = useSearchParams();
    const orderIdParam = searchParams.get("orderId");
    const { toast } = useToast();
    const [fulfillment, setFulfillment] = useState<FulfillmentDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReleasing, setIsReleasing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    async function fetchFulfillmentData() {
        setIsLoading(true);
        try {
            let targetId = orderIdParam;

            if (!targetId) {
                const listRes = await fetch("/api/orders?limit=1");
                if (listRes.ok) {
                    const listData = await listRes.json();
                    if (listData.orders && listData.orders.length > 0) {
                        targetId = listData.orders[0].id;
                    }
                }
            }

            if (targetId) {
                const res = await fetch(`/api/fulfillment/${targetId}`);
                if (res.ok) {
                    const data: FulfillmentDTO = await res.json();
                    setFulfillment(data);
                }
            }
        } catch (err) {
            console.error("Failed to load fulfillment tracking data", err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchFulfillmentData();
    }, [orderIdParam]);

    async function handleConfirmDeliveryAndReleaseEscrow() {
        if (!fulfillment?.order.id) return;
        setIsReleasing(true);
        try {
            const res = await fetch(`/api/fulfillment/${fulfillment.order.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "CONFIRM_DELIVERY_RELEASE_ESCROW" }),
            });

            if (res.ok) {
                toast("Delivery confirmed! Escrow payment released to farmer.", "success");
                await fetchFulfillmentData();
            } else {
                const errData = await res.json();
                toast(errData.error || "Confirmation failed.", "error");
            }
        } catch (err) {
            toast("Error processing delivery confirmation.", "error");
        } finally {
            setIsReleasing(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Fulfillment & Delivery Tracking</h2>
                    <p className="text-sm font-semibold text-[#1B4D28]">
                        {fulfillment ? `Order #${fulfillment.order.orderNumber}` : "Select an order to track real-time fulfillment"}
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Order Number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#1B4D28]"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-3" />
                    <p className="text-sm font-medium">Fetching real-time fulfillment status...</p>
                </div>
            ) : !fulfillment ? (
                <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                    <PackageX size={48} className="text-gray-300 mb-3" />
                    <p className="text-base font-bold text-gray-700">No active order selected for fulfillment tracking</p>
                    <p className="text-sm text-gray-400 mt-1">Place an order from the Marketplace or view your order list.</p>
                </div>
            ) : (
                <>
                    {/* Escrow Status Banner & Confirmation Action */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 text-[#1B4D28] rounded-2xl">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-base">Escrow Payment Protection</h3>
                                <p className="text-xs text-gray-500">
                                    {fulfillment.escrowStatus.locked
                                        ? "Funds are safely locked in escrow until you confirm delivery."
                                        : "Escrow funds released to farmer."}
                                </p>
                            </div>
                        </div>

                        {fulfillment.availableActions.canConfirmBuyerReceipt && (
                            <button
                                onClick={handleConfirmDeliveryAndReleaseEscrow}
                                disabled={isReleasing}
                                className="px-6 py-3 bg-[#1B4D28] hover:bg-[#143d20] disabled:bg-gray-300 text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center gap-2"
                            >
                                <CheckCircle2 size={16} />
                                {isReleasing ? "Releasing Escrow..." : "Confirm Delivery & Release Escrow"}
                            </button>
                        )}
                    </div>

                    <TrackingTimeline timeline={fulfillment.trackingTimeline} totalAmount={fulfillment.order.totalAmount} />

                    <TrackingDetails order={fulfillment.order as any} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TrackingItemList items={fulfillment.order.items} totalAmount={fulfillment.order.totalAmount} />
                        <TrackingMap />
                    </div>
                </>
            )}
        </div>
    );
}

export default function TrackingPage() {
    return (
        <Suspense fallback={
            <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#1B4D28]/20 border-t-[#1B4D28] rounded-full animate-spin mb-3" />
                <p className="text-sm font-medium">Loading fulfillment dashboard...</p>
            </div>
        }>
            <TrackingContent />
        </Suspense>
    );
}
