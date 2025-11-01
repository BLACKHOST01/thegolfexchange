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
import toast from "react-hot-toast";
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Enhanced: Add token validation helper
  const isValidToken = (token: string): boolean => {
    if (!token) return false;
    
    try {
      // Simple check for JWT token structure
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  // Enhanced: Load user from localStorage with validation
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate token and user structure
          if (parsedUser?.token && isValidToken(parsedUser.token) && parsedUser.id) {
            setUser(parsedUser);
            
            // Optional: Verify token with backend on app start
            try {
              const res = await fetch("/api/auth/verify", {
                headers: {
                  Authorization: `Bearer ${parsedUser.token}`,
                },
              });
              
              if (!res.ok) {
                throw new Error("Token verification failed");
              }
            } catch (error) {
              toast.error("Token verification failed, logging out:");
              logout();
            }
          } else {
            console.warn("Invalid stored user data, clearing...");
            localStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Enhanced: Sync user data across tabs with better error handling
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        try {
          if (e.newValue) {
            const newUser = JSON.parse(e.newValue);
            if (newUser?.id && newUser?.token) {
              setUser(newUser);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error parsing user from storage event:", error);
        }
      }
    };

    const handleCustomUserUpdate = (e: CustomEvent) => {
      try {
        if (e.detail?.user) {
          setUser(e.detail.user);
        }
      } catch (error) {
        console.error("Error handling custom user update:", error);
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

    if (!userData.id || !userData.email) {
      console.error("Incomplete user data:", userData);
      throw new Error("Incomplete user data received");
    }

    return {
      id: userData.id,
      name: userData.name || userData.email.split('@')[0], // Fallback name
      email: userData.email,
      role: (userData.role || "USER")?.toUpperCase() as "ADMIN" | "USER",
      token: token,
      phone: userData.phone,
      avatar: userData.avatar,
      isVerified: userData.isVerified ?? userData.verified ?? false,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login API response:", data);

      if (!res.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      const normalizedUser = normalizeUser(data);
      console.log("Normalized user:", normalizedUser);

      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      // Enhanced: Dispatch storage event for cross-tab sync
      window.dispatchEvent(
        new StorageEvent("storage", { 
          key: "user", 
          newValue: JSON.stringify(normalizedUser) 
        })
      );

      // Enhanced: Redirect based on role with delay for better UX
      setTimeout(() => {
        if (normalizedUser.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/shop");
        }
      }, 100);
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Signup failed");
      }

      const normalizedUser = normalizeUser(data);

      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      // Enhanced: Dispatch storage event for cross-tab sync
      window.dispatchEvent(
        new StorageEvent("storage", { 
          key: "user", 
          newValue: JSON.stringify(normalizedUser) 
        })
      );

      setTimeout(() => {
        if (normalizedUser.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/shop");
        }
      }, 100);
    } catch (error: any) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    
    // Enhanced: Clear all auth-related storage
    localStorage.removeItem("token");
    sessionStorage.clear();
    
    // Enhanced: Dispatch events for cross-tab sync
    window.dispatchEvent(
      new StorageEvent("storage", { key: "user", newValue: null })
    );
    
    // Enhanced: Dispatch custom logout event
    window.dispatchEvent(new CustomEvent("authLogout"));
    
    router.push("/auth/login");
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) {
      console.warn("Attempted to update user when no user is logged in");
      return;
    }

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    // Enhanced: Dispatch both storage and custom events for better sync
    window.dispatchEvent(
      new StorageEvent("storage", { 
        key: "user", 
        newValue: JSON.stringify(updatedUser) 
      })
    );
    
    window.dispatchEvent(
      new CustomEvent("userUpdated", { detail: { user: updatedUser } })
    );
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!user?.token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};