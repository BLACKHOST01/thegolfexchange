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
    window.addEventListener(
      "userUpdated",
      handleCustomUserUpdate as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "userUpdated",
        handleCustomUserUpdate as EventListener
      );
    };
  }, []);

  const normalizeUser = (data: any): User => {
    console.log("Raw data for normalization:", data);

    // Handle different response structures
    const userData = data.user || data;
    const token =
      data.token || data.accessToken || data.access_token || userData.token;

    if (!token) {
      console.error("No token found in response:", data);
      throw new Error("Authentication token missing");
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: (userData.role || "USER")?.toUpperCase() as "ADMIN" | "USER",
      token: token,
      phone: userData.phone,
      avatar: userData.avatar,
      isVerified: userData.isVerified,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  };

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Login API response:", data); // Add this line

    if (!res.ok) throw new Error(data.error || "Login failed");

    const normalizedUser = normalizeUser(data);
    console.log("Normalized user:", normalizedUser); // Add this line

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
    window.dispatchEvent(
      new StorageEvent("storage", { key: "user", newValue: null })
    );
    router.push("/auth/login");
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    // Dispatch custom event for same-tab sync
    window.dispatchEvent(
      new CustomEvent("userUpdated", { detail: { user: updatedUser } })
    );
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
