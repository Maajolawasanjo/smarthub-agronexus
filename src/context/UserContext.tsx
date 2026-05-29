"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "buyer" | "farmer" | "admin";

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

            // Sync with smarthub_admins collection in localStorage if user is admin
            if (updated.role === "admin" && updated.email) {
                const storedAdmins = localStorage.getItem("smarthub_admins");
                let adminsList = [];
                if (storedAdmins) {
                    try {
                        adminsList = JSON.parse(storedAdmins);
                        if (!Array.isArray(adminsList)) {
                            adminsList = [];
                        }
                    } catch (e) {
                        adminsList = [];
                    }
                }

                // Match by previous email if it changed, or the current email
                const searchEmail = (prev && prev.email) || updated.email;
                const index = adminsList.findIndex(
                    (adm: any) => adm.email.toLowerCase() === searchEmail.toLowerCase()
                );

                if (index !== -1) {
                    adminsList[index] = {
                        ...adminsList[index],
                        ...updated,
                    };
                } else {
                    adminsList.push(updated);
                }

                localStorage.setItem("smarthub_admins", JSON.stringify(adminsList));
            }

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
