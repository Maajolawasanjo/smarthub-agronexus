"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/overview");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D28]"></div>
        </div>
    );
}
