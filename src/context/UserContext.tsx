"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "buyer" | "farmer";

interface UserData {
    name: string;
    email: string;
    password?: string;
    profileImage: string;
    currency: string;
    country: string;
    address: string;
    role: UserRole;
    // Farmer-specific
    farmName?: string;
    phone?: string;
    state?: string;
}

interface UserContextType {
    user: UserData | null;
    isAuthenticated: boolean;
    updateUser: (data: Partial<UserData>) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("smarthub_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        // No default guest — null means not authenticated
    }, []);

    const isAuthenticated = !!(user && user.email);

    const updateUser = (data: Partial<UserData>) => {
        setUser((prev) => {
            const updated: UserData = prev
                ? { ...prev, ...data }
                : {
                    name: "",
                    email: "",
                    profileImage: "/avatar-2.png",
                    currency: "",
                    country: "",
                    address: "",
                    role: "buyer",
                    ...data,
                };
            localStorage.setItem("smarthub_user", JSON.stringify(updated));
            return updated;
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("smarthub_user");
    };

    return (
        <UserContext.Provider value={{ user, isAuthenticated, updateUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
