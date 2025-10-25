"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  token: string;
  phone?: string;
  avatar?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Sync user data across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (error) {
            console.error("Error parsing user from storage event:", error);
          }
        } else {
          setUser(null);
        }
      }
    };

    const handleCustomUserUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.user) {
        setUser(e.detail.user);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleCustomUserUpdate as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleCustomUserUpdate as EventListener);
    };
  }, []);

  const normalizeUser = (data: any): User => ({
    id: data.user?.id || data.id,
    name: data.user?.name || data.name,
    email: data.user?.email || data.email,
    role: (data.user?.role || data.role)?.toUpperCase() as "ADMIN" | "USER",
    token: data.token || data.user?.token,
    phone: data.user?.phone || data.phone,
    avatar: data.user?.avatar || data.avatar,
    isVerified: data.user?.isVerified || data.isVerified,
    createdAt: data.user?.createdAt || data.createdAt,
    updatedAt: data.user?.updatedAt || data.updatedAt,
  });

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    const normalizedUser = normalizeUser(data);

    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    if (normalizedUser.role === "ADMIN") router.push("/admin");
    else router.push("/shop");
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    const normalizedUser = normalizeUser(data);

    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    if (normalizedUser.role === "ADMIN") router.push("/admin");
    else router.push("/shop");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Dispatch event to sync across tabs
    window.dispatchEvent(new StorageEvent("storage", { key: "user", newValue: null }));
    router.push("/login");
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    // Dispatch custom event for same-tab sync
    window.dispatchEvent(new CustomEvent("userUpdated", { detail: { user: updatedUser } }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};