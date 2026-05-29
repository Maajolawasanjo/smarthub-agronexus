"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useUser } from "@/context/UserContext";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useUser();
    const pathname = usePathname();
    const router = useRouter();

    const isAuthPage = pathname === "/admin/login" || pathname === "/admin/signup";

    useEffect(() => {
        // Guard check: Redirect to admin login if not logged in as admin
        if (!isAuthPage && (!user || user.role !== "admin")) {
            router.replace("/admin/login");
        }
    }, [user, isAuthPage, router]);

    // If it's the login or signup page, render clean without sidebar/header/guards
    if (isAuthPage) {
        return (
            <div className="min-h-screen bg-[#EEF2EE] w-full flex items-center justify-center font-sans">
                {children}
            </div>
        );
    }

    // While checking authentication, show a premium spinner
    if (!user || user.role !== "admin") {
        return (
            <div className="min-h-screen bg-[#EEF2EE] w-full flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D28]"></div>
                    <span className="text-xs font-semibold text-gray-500 tracking-wider">Securing Access Portal...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF2EE] flex w-full">
            {/* Sidebar Navigation */}
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 md:pl-64">
                {/* Header */}
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

                {/* Subpage Contents */}
                <main className="flex-1 p-4 md:p-8 pt-0">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
