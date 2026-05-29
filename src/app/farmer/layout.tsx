"use client";

import { useState } from "react";
import { FarmerSidebar } from "@/components/farmer/FarmerSidebar";
import { FarmerHeader } from "@/components/farmer/FarmerHeader";

export default function FarmerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F5F6FA]">
            <FarmerSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="md:pl-56 flex flex-col min-h-screen transition-all duration-300">
                <FarmerHeader onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
