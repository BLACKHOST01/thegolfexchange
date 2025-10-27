"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

interface OrderSummary {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemsCount: number;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { guestOrders, currentOrder, loadGuestOrders } = useCart();

  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "security">(
    "profile"
  );
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fix 1: Properly handle user data loading
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
    setLoading(false);
  }, [user]);
  // Add this temporary function to debug
  const testOrdersAPI = async () => {
    if (!user?.token) {
      console.log("No user token");
      return;
    }

    try {
      console.log("Testing orders API...");
      console.log("User token exists:", !!user.token);
      console.log("User ID:", user.id);

      const response = await fetch("/api/users/me/orders?limit=5", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      console.log("API Response Status:", response.status);
      console.log("API Response OK:", response.ok);

      if (response.ok) {
        const orders = await response.json();
        console.log("Orders from API:", orders);
        setRecentOrders(orders);
      } else {
        const errorText = await response.text();
        console.log("API Error:", errorText);
      }
    } catch (error) {
      console.error("Test API Error:", error);
    }
  };

  // Call this temporarily in your useEffect
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          console.log("User is logged in, fetching orders...");
          await testOrdersAPI(); // Temporary: Use test function first
          // await fetchRecentOrders(); // Comment this out temporarily
        } else {
          await loadGuestOrders();
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage({ type: "error", text: "Failed to load data" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);
  // Add to your existing state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar || ""
  );

  // Add this function to handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add this function to upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile || !user?.token) return;

    setUpdating(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload avatar");
      }

      const data = await res.json();

      // Update user in context
      const updatedUser = { ...user, avatar: data.avatarUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("storage"));

      setMessage({ type: "success", text: "Avatar updated successfully!" });
      setAvatarFile(null);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  // Fix 2: Proper dependency array and error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          await fetchRecentOrders();
        } else {
          // Only load guest orders if we're not logged in
          await loadGuestOrders();
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage({ type: "error", text: "Failed to load data" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]); // Removed loadGuestOrders from dependencies to prevent infinite loops
  const fetchRecentOrders = async () => {
    if (!user?.token) {
      console.log("No user token available");
      return;
    }

    try {
      console.log("Fetching orders for user:", user.id);

      const res = await fetch("/api/users/me/orders?limit=5", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      console.log("Orders API response status:", res.status);

      if (res.ok) {
        const orders = await res.json();
        console.log("Raw orders data:", orders);

        // Make sure orders is an array
        const ordersArray = Array.isArray(orders) ? orders : [];
        console.log("Processed orders:", ordersArray);

        setRecentOrders(ordersArray);

        if (ordersArray.length === 0) {
          // Fix: Now "info" is allowed in the message type
          setMessage({
            type: "info",
            text: "No orders found. Your order history will appear here after you make purchases.",
          });
        }
      } else {
        // Handle API errors
        const errorData = await res.json().catch(() => null);
        setMessage({
          type: "error",
          text: errorData?.error || "Failed to load orders",
        });
      }
    } catch (error: any) {
      console.error("Network error fetching orders:", error);
      setMessage({
        type: "error",
        text: "Unable to load orders. Please try again later.",
      });
    }
  };
  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          console.log("User is logged in, fetching orders...");
          await testOrdersAPI(); // Temporary: Use test function first
        } else {
          await loadGuestOrders();
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setMessage({ type: "error", text: "Failed to load data" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Fix 3: Better type safety for guest orders
  const getGuestOrdersDisplay = (): OrderSummary[] => {
    if (!guestOrders || !Array.isArray(guestOrders)) return [];

    return guestOrders.map((order: any) => {
      // Calculate itemsCount safely
      let itemsCount = 0;
      if (order.items && Array.isArray(order.items)) {
        itemsCount = order.items.reduce((sum: number, item: any) => {
          return sum + (item.quantity || 0);
        }, 0);
      }

      return {
        id:
          order.id ||
          order.orderNumber ||
          `guest-${Math.random().toString(36).substr(2, 9)}`,
        totalAmount: order.totalAmount || 0,
        status: (order.status || "PENDING").toUpperCase(),
        createdAt: order.createdAt || new Date().toISOString(),
        itemsCount: itemsCount,
      };
    });
  };

  const getDisplayOrders = (): OrderSummary[] => {
    if (user) {
      return recentOrders;
    } else {
      return getGuestOrdersDisplay();
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) {
      setMessage({
        type: "error",
        text: "You must be logged in to update your profile",
      });
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const updatedUser = await res.json();
      // Update the user in context and localStorage
      const newUserData = { ...user, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUserData));
      window.dispatchEvent(new Event("storage"));

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) {
      setMessage({
        type: "error",
        text: "You must be logged in to change your password",
      });
      return;
    }

    setUpdating(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setUpdating(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      setUpdating(false);
      return;
    }

    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to change password");
      }

      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChangeInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fix 4: Improved storage event listener
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        // AuthContext will handle the update
        console.log("User data updated from storage");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isGuestUser = !user;
  const displayOrders = getDisplayOrders();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fix 5: Better order status display logic
  const getStatusStyles = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (
      statusUpper === "DELIVERED" ||
      statusUpper === "CONFIRMED" ||
      statusUpper === "COMPLETED"
    ) {
      return "bg-green-100 text-green-800";
    } else if (statusUpper === "CANCELLED" || statusUpper === "FAILED") {
      return "bg-red-100 text-red-800";
    } else if (statusUpper === "PENDING" || statusUpper === "PROCESSING") {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isGuestUser ? "Guest Orders" : "My Profile"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isGuestUser
              ? "View your recent orders as a guest user"
              : "Manage your account settings and preferences"}
          </p>

          {isGuestUser && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Guest Mode
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your orders are stored in this browser. For permanent
                      order history and account features,{" "}
                      <button
                        onClick={() => router.push("/auth/signup")}
                        className="font-medium underline hover:text-yellow-600"
                      >
                        create an account
                      </button>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation - Only show for logged-in users */}
          {!isGuestUser && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      activeTab === "profile"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Personal Information
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      activeTab === "orders"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Order History
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      activeTab === "security"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Security
                  </button>
                </nav>

                {/* Account Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Account Info
                  </h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="capitalize">
                      {user?.role?.toLowerCase() || "user"} account
                    </p>
                    <button
                      onClick={logout}
                      className="text-red-600 hover:text-red-800 transition mt-2"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={isGuestUser ? "lg:col-span-4" : "lg:col-span-3"}>
            {/* For Guest Users: Always show orders tab */}
            {isGuestUser ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Recent Orders
                </h2>

                {displayOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg
                        className="w-16 h-16 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No orders yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Your guest order history will appear here after checkout
                    </p>
                    <button
                      onClick={() => router.push("/shop")}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current order highlight for guest users */}
                    {currentOrder && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center mb-2">
                          <svg
                            className="w-5 h-5 text-green-600 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <h3 className="font-semibold text-green-800">
                            Latest Order
                          </h3>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              Order #{currentOrder.orderNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              {currentOrder.items?.reduce(
                                (sum, item) => sum + (item.quantity || 0),
                                0
                              ) || 0}{" "}
                              items • $
                              {(currentOrder.totalAmount || 0).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Placed on{" "}
                              {new Date(
                                currentOrder.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                              currentOrder.status
                            )}`}
                          >
                            {currentOrder.status}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* All guest orders */}
                    {displayOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Order #{order.id.slice(-8)}
                              {currentOrder && order.id === currentOrder.id && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Latest
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {order.itemsCount} item
                              {order.itemsCount !== 1 ? "s" : ""} • $
                              {order.totalAmount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.createdAt).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Guest user CTA */}
                {displayOrders.length > 0 && (
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Want to save your order history?
                    </h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Create an account to access your order history from any
                      device and get exclusive benefits.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => router.push("/auth/signup")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        Create Account
                      </button>
                      <button
                        onClick={() => router.push("/auth/login")}
                        className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition text-sm"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* For Logged-in Users: Show all tabs */
              <>
                {/* Personal Information Tab */}
                {activeTab === "profile" && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Personal Information
                    </h2>

                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="relative">
                        {avatarPreview || user?.avatar ? (
                          <img
                            src={avatarPreview || user?.avatar}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                            <span className="text-gray-500 text-2xl font-semibold">
                              {user?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {user?.name}
                        </h3>
                        <p className="text-gray-500">{user?.email}</p>
                        {avatarFile && (
                          <button
                            onClick={handleAvatarUpload}
                            disabled={updating}
                            className="mt-2 bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            {updating ? "Uploading..." : "Save Avatar"}
                          </button>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Full Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              name: user?.name || "",
                              email: user?.email || "",
                              phone: user?.phone || "",
                            })
                          }
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          disabled={updating}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? "Updating..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                {/* Order History Tab for logged-in users */}
                {activeTab === "orders" && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Recent Orders
                    </h2>

                    {displayOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-4">
                          <svg
                            className="w-16 h-16 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No orders yet
                        </h3>
                        <p className="text-gray-500">
                          Your order history will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayOrders.map((order) => (
                          <div
                            key={order.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  Order #{order.id.slice(-8)}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {order.itemsCount} item
                                  {order.itemsCount !== 1 ? "s" : ""} • $
                                  {order.totalAmount.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                                    order.status
                                  )}`}
                                >
                                  {order.status}
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Change Password
                    </h2>

                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div>
                        <label
                          htmlFor="currentPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChangeInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChangeInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChangeInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={updating}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? "Updating..." : "Change Password"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
