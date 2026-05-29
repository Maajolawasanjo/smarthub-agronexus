"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 min-w-[300px] flex items-center justify-between",
                            t.type === "success" && "bg-[#1B4D28] text-white", // Brand Green
                            t.type === "error" && "bg-red-500 text-white",
                            t.type === "info" && "bg-gray-800 text-white"
                        )}
                    >
                        <span>{t.message}</span>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="ml-4 opacity-70 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
