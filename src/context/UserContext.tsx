"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AuthenticatedUserPayload } from "@/lib/user-dto";

export type UserRole = "BUYER" | "FARMER" | "ADMIN";

interface UserContextType {
  user: AuthenticatedUserPayload | null;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUserFromAuth: (userData: AuthenticatedUserPayload) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUserPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to hydrate authenticated session from backend:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const setUserFromAuth = useCallback((userData: AuthenticatedUserPayload) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error during logout request:", error);
    } finally {
      setUser(null);
      setLoading(false);
      window.location.href = "/login";
    }
  }, []);

  const isAuthenticated = !!(user && user.id && user.email);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        refreshUser: fetchSession,
        setUserFromAuth,
        logout,
      }}
    >
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
