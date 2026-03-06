"use client";

import { ReactNode } from "react";

export default function DashboardTemplate({ children }: { children: ReactNode }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
            {children}
        </div>
    );
}
