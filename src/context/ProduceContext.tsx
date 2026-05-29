"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ProduceListing {
    id: string;                // unique batch code, e.g. "AGR-20260306-3F2A"
    produceType: string;       // e.g. "Yam"
    variety: string;           // e.g. "Abuja Yam"
    quantity: string;          // e.g. "500"
    unit: string;              // e.g. "kg"
    askingPrice: string;       // e.g. "300000"
    harvestDate: string;       // ISO date string
    farmLocation: string;      // e.g. "Kaduna"
    notes: string;             // additional note
    images: string[];          // base64 data URLs of uploaded photos
    submittedAt: string;       // ISO timestamp
    status: "Pending" | "Active" | "Sold" | "Cancelled";
}

interface ProduceContextType {
    listings: ProduceListing[];
    addListing: (data: Omit<ProduceListing, "id" | "submittedAt" | "status">) => ProduceListing;
    getListingById: (id: string) => ProduceListing | undefined;
}

const ProduceContext = createContext<ProduceContextType | undefined>(undefined);

const STORAGE_KEY = "smarthub_produce_listings";

function generateBatchId(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `AGR-${datePart}-${rand}`;
}

export const ProduceProvider = ({ children }: { children: ReactNode }) => {
    const [listings, setListings] = useState<ProduceListing[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { setListings(JSON.parse(stored)); } catch { /* ignore */ }
        }
    }, []);

    const persist = (updated: ProduceListing[]) => {
        setListings(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const addListing = (data: Omit<ProduceListing, "id" | "submittedAt" | "status">): ProduceListing => {
        const newListing: ProduceListing = {
            ...data,
            id: generateBatchId(),
            submittedAt: new Date().toISOString(),
            status: "Pending",
        };
        persist([newListing, ...listings]);
        return newListing;
    };

    const getListingById = (id: string) => listings.find(l => l.id === id);

    return (
        <ProduceContext.Provider value={{ listings, addListing, getListingById }}>
            {children}
        </ProduceContext.Provider>
    );
};

export const useProduce = () => {
    const ctx = useContext(ProduceContext);
    if (!ctx) throw new Error("useProduce must be used within ProduceProvider");
    return ctx;
};
