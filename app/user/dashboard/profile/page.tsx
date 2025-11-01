"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

interface OrderSummary {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemsCount: number;
  orderNumber?: string;
}

interface Address {
  id: string;
  title: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  phone?: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
}

interface Review {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  image: string;
  addedAt: string;
  inStock: boolean;
}

interface LoyaltyPoints {
  total: number;
  available: number;
  used: number;
  level: string;
  nextLevel: string;
  progress: number;
}

interface NotificationSettings {
  email: {
    orders: boolean;
    promotions: boolean;
    security: boolean;
  };
  push: {
    orders: boolean;
    promotions: boolean;
  };
  sms: {
    orders: boolean;
    security: boolean;
  };
}

type MessageType = "success" | "error" | "info";

interface Message {
  type: MessageType;
  text: string;
}

type ActiveTab =
  | "profile"
  | "orders"
  | "security"
  | "addresses"
  | "payments"
  | "reviews"
  | "wishlist"
  | "loyalty"
  | "notifications";

// Component for Guest Orders View
const GuestOrdersView = ({
  guestOrders,
  currentOrder,
  getStatusStyles,
}: any) => {
  const router = useRouter();

  const handleOrderClick = (id: string) => {
    router.push(`/orders/${id}`); // 👈 change this path if your route differs
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Recent Orders
      </h2>

      {!guestOrders || guestOrders.length === 0 ? (
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
          {guestOrders.map((order: any) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.id)} // 👈 makes it clickable
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Order #{order.id?.slice(-8) || "N/A"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.itemsCount || 0} item
                    {order.itemsCount !== 1 ? "s" : ""} • $
                    {(order.totalAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                      order.status
                    )}`}
                  >
                    {/* {order.status || "PENDING"} */}
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component for Profile Tab
const ProfileTab = ({
  user,
  formData,
  setFormData,
  updating,
  handleProfileUpdate,
  avatarPreview,
  avatarFile,
  avatarUploading,
  setAvatarFile,
  setAvatarPreview,
  setMessage,
  handleAvatarUpload,
  handleCancelAvatarUpload,
  handleAvatarChange,
  handleImageError,
}: any) => {
  const getCurrentAvatarUrl = () => {
    if (avatarPreview && avatarFile) return avatarPreview;
    if (user?.avatar) {
      let avatarUrl = user.avatar;
      if (!user.avatar.startsWith("http") && !user.avatar.startsWith("/")) {
        avatarUrl = `/uploads/avatars/${user.avatar}`;
      }
      const timestamp = new Date().getTime();
      return `${avatarUrl}?v=${timestamp}`;
    }
    return avatarPreview || "";
  };

  const currentAvatarUrl = getCurrentAvatarUrl();

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Personal Information
      </h2>

      {/* Avatar Section */}
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative">
          {currentAvatarUrl ? (
            <div className="relative">
              <img
                src={currentAvatarUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                onError={handleImageError}
                key={user?.avatar || "avatar"}
              />
              <div
                id="avatar-fallback"
                className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 absolute top-0 left-0"
                style={{ display: "none" }}
              >
                <span className="text-gray-500 text-2xl font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <span className="text-gray-500 text-2xl font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition"
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
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
          <p className="text-gray-500">{user?.email}</p>
          {avatarFile && (
            <div className="mt-2 flex space-x-2">
              <button
                onClick={handleAvatarUpload}
                disabled={avatarUploading}
                className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition"
              >
                {avatarUploading ? "Uploading..." : "Save Avatar"}
              </button>
              <button
                onClick={handleCancelAvatarUpload}
                className="bg-gray-500 text-white px-4 py-1 rounded text-sm hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={updating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {updating ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Component for Orders Tab
const OrdersTab = ({ orders, loading, getStatusStyles }: any) => {
  const router = useRouter();

  const handleOrderClick = (id: string) => {
    router.push(`/orders/${id}`); // 👈 change this path if your route differs
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Order History
      </h2>
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
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
          <p className="text-gray-500">Your order history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order.id}
              onClick={() => handleOrderClick(order.id)} // 👈 make it clickable
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Order #{order.id?.slice(-8) || "N/A"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.itemsCount || 0} item
                    {order.itemsCount !== 1 ? "s" : ""} • $
                    {(order.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
                      order.status
                    )}`}
                  >
                    {order.status || "PENDING"}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component for Addresses Tab
const AddressesTab = ({
  addresses,
  addressForm,
  setAddressForm,
  handleAddAddress,
}: any) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">
      Manage Addresses
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Address Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">Add New Address</h3>
        <form onSubmit={handleAddAddress} className="space-y-4">
          <input
            type="text"
            placeholder="Address Title (e.g., Home, Work)"
            value={addressForm.title || ""}
            onChange={(e) =>
              setAddressForm({ ...addressForm, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Street Address"
            value={addressForm.street || ""}
            onChange={(e) =>
              setAddressForm({ ...addressForm, street: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="City"
              value={addressForm.city || ""}
              onChange={(e) =>
                setAddressForm({ ...addressForm, city: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="State"
              value={addressForm.state || ""}
              onChange={(e) =>
                setAddressForm({ ...addressForm, state: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Address
          </button>
        </form>
      </div>

      {/* Address List */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Your Addresses</h3>
        <div className="space-y-4">
          {!addresses || addresses.length === 0 ? (
            <p className="text-gray-500">No addresses saved yet</p>
          ) : (
            addresses.map((address: any) => (
              <div
                key={address.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900">{address.title}</h4>
                <p className="text-sm text-gray-600">{address.street}</p>
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state}
                </p>
                {address.isDefault && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Default
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
);

// Component for Payments Tab
const PaymentsTab = ({
  paymentMethods,
  addingPayment,
  setAddingPayment,
}: any) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">
      Payment Methods
    </h2>
    <div className="space-y-4">
      {!paymentMethods || paymentMethods.length === 0 ? (
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No payment methods
          </h3>
          <p className="text-gray-500 mb-4">
            Add a payment method for faster checkout
          </p>
          <button
            onClick={() => setAddingPayment(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Payment Method
          </button>
        </div>
      ) : (
        paymentMethods.map((payment: any) => (
          <div
            key={payment.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {payment.brand}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    **** **** **** {payment.last4}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires {payment.expiry}
                  </p>
                </div>
              </div>
              {payment.isDefault && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Default
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Component for Reviews Tab
const ReviewsTab = ({ reviews, reviewStats }: any) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">My Reviews</h2>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Review Stats */}
      <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">Review Summary</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {reviewStats?.average?.toFixed(1) || "0.0"}
          </div>
          <div className="text-yellow-400 mb-2">★★★★★</div>
          <p className="text-sm text-gray-600">
            {reviewStats?.total || 0} reviews
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="lg:col-span-2">
        {!reviews || reviews.length === 0 ? (
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-500">Your reviews will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {review.productName}
                  </h4>
                  <div className="flex text-yellow-400">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{review.comment}</p>
                <p className="text-sm text-gray-500">
                  Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Component for Wishlist Tab
const WishlistTab = ({
  wishlist,
  loading,
  removeFromWishlist,
  router,
}: any) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">My Wishlist</h2>
    {loading ? (
      <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded"></div>
        ))}
      </div>
    ) : !wishlist || wishlist.length === 0 ? (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Your wishlist is empty
        </h3>
        <p className="text-gray-500 mb-4">Save items you love for later</p>
        <button
          onClick={() => router.push("/shop")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Start Shopping
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((item: any) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
          >
            <div className="aspect-w-1 aspect-h-1 mb-4">
              <img
                src={item.image}
                alt={item.productName}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">
              {item.productName}
            </h4>
            <p className="text-lg font-semibold text-gray-900 mb-4">
              ${(item.price || 0).toFixed(2)}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/product/${item.productId}`)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                View Product
              </button>
              <button
                onClick={() => removeFromWishlist(item.productId)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Component for Loyalty Tab
const LoyaltyTab = ({ loyaltyPoints }: any) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">
      Loyalty Program
    </h2>
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">
            {loyaltyPoints?.level || "Bronze"} Member
          </h3>
          <p className="text-yellow-100">
            {loyaltyPoints?.available || 0} points available
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{loyaltyPoints?.total || 0}</div>
          <p className="text-yellow-100">Total Points</p>
        </div>
      </div>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h4 className="font-medium text-gray-900 mb-4">
        Progress to {loyaltyPoints?.nextLevel || "Silver"}
      </h4>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${loyaltyPoints?.progress || 0}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600">
        {loyaltyPoints?.progress || 0}% complete
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-4 border border-gray-200 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {loyaltyPoints?.available || 0}
        </div>
        <p className="text-gray-600">Available Points</p>
      </div>
      <div className="text-center p-4 border border-gray-200 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {loyaltyPoints?.used || 0}
        </div>
        <p className="text-gray-600">Points Used</p>
      </div>
      <div className="text-center p-4 border border-gray-200 rounded-lg">
        <div className="text-2xl font-bold text-purple-600">
          {loyaltyPoints?.total || 0}
        </div>
        <p className="text-gray-600">Total Earned</p>
      </div>
    </div>
  </div>
);

// Component for Notifications Tab
const NotificationsTab = ({
  notificationSettings,
  setNotificationSettings,
  updateNotificationSettings,
}: any) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-6">
      Notification Settings
    </h2>
    <div className="space-y-6">
      {/* Email Notifications */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Email Notifications
        </h3>
        <div className="space-y-3">
          {Object.entries(notificationSettings?.email || {}).map(
            ([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                </span>
                <button
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      email: { ...notificationSettings.email, [key]: !value },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Push Notifications
        </h3>
        <div className="space-y-3">
          {Object.entries(notificationSettings?.push || {}).map(
            ([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                </span>
                <button
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      push: { ...notificationSettings.push, [key]: !value },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )
          )}
        </div>
      </div>

      <button
        onClick={updateNotificationSettings}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Save Settings
      </button>
    </div>
  </div>
);

// Component for Security Tab
const SecurityTab = ({
  passwordData,
  setPasswordData,
  updating,
  handlePasswordChange,
}: any) => (
  <div className="p-6">
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
          onChange={(e) =>
            setPasswordData({
              ...passwordData,
              currentPassword: e.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
          onChange={(e) =>
            setPasswordData({ ...passwordData, newPassword: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
          onChange={(e) =>
            setPasswordData({
              ...passwordData,
              confirmPassword: e.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          required
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updating}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {updating ? "Updating..." : "Change Password"}
        </button>
      </div>
    </form>
  </div>
);

// Main ProfilePage Component
export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const { guestOrders, currentOrder, loadGuestOrders } = useCart();

  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  // Profile Data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  // Security
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    title: "",
    street: "",
    city: "",
    state: "",
    country: "USA",
    postalCode: "",
    isDefault: false,
    phone: "",
  });

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [addingPayment, setAddingPayment] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Loyalty
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints>({
    total: 0,
    available: 0,
    used: 0,
    level: "Bronze",
    nextLevel: "Silver",
    progress: 0,
  });

  // Notifications
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      email: { orders: true, promotions: true, security: true },
      push: { orders: true, promotions: true },
      sms: { orders: false, security: true },
    });

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Orders
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        if (user) {
          // Load basic profile data
          setFormData({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            dateOfBirth: "",
            gender: "",
          });

          // Load avatar
          if (user.avatar) {
            let avatarUrl = user.avatar;
            if (
              !user.avatar.startsWith("http") &&
              !user.avatar.startsWith("/")
            ) {
              avatarUrl = `/uploads/avatars/${user.avatar}`;
            }
            const timestamp = new Date().getTime();
            setAvatarPreview(`${avatarUrl}?v=${timestamp}`);
          } else {
            setAvatarPreview("");
          }

          // Load additional data based on active tab
          await loadTabData(activeTab);
        } else {
          await loadGuestOrders();
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        setMessage({ type: "error", text: "Failed to load profile data" });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, activeTab]);

  // Load data for specific tab
  const loadTabData = async (tab: ActiveTab) => {
    if (!user?.token) return;

    try {
      switch (tab) {
        case "orders":
          await fetchRecentOrders();
          break;
        case "addresses":
          await fetchAddresses();
          break;
        case "payments":
          await fetchPaymentMethods();
          break;
        case "reviews":
          await fetchReviews();
          break;
        case "wishlist":
          await fetchWishlist();
          break;
        case "loyalty":
          await fetchLoyaltyPoints();
          break;
        case "notifications":
          await fetchNotificationSettings();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
    }
  };

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    if (!user?.token) return;

    setOrdersLoading(true);
    try {
      const res = await fetch("/api/users/me/orders?limit=10", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        const orders = await res.json();
        setRecentOrders(Array.isArray(orders) ? orders : []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!user?.token) return;

    try {
      const res = await fetch("/api/users/me/addresses", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        const addressesData = await res.json();
        setAddresses(Array.isArray(addressesData) ? addressesData : []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    if (!user?.token) return;

    try {
      const res = await fetch("/api/users/me/payment-methods", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        const payments = await res.json();
        setPaymentMethods(Array.isArray(payments) ? payments : []);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    if (!user?.token) return;

    try {
      const res = await fetch("/api/users/me/reviews", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        const reviewsData = await res.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);

        // Calculate review stats
        const total = reviewsData.length;
        const average =
          total > 0
            ? reviewsData.reduce(
                (acc: number, review: Review) => acc + review.rating,
                0
              ) / total
            : 0;
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsData.forEach((review: Review) => {
          distribution[review.rating as keyof typeof distribution]++;
        });

        setReviewStats({ total, average, distribution });
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  // Fetch wishlist
  const fetchWishlist = async () => {
    if (!user?.token) return;

    setWishlistLoading(true);
    try {
      const res = await fetch("/api/users/me/wishlist", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        const wishlistData = await res.json();
        setWishlist(Array.isArray(wishlistData) ? wishlistData : []);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Fetch loyalty points
  const fetchLoyaltyPoints = async () => {
    if (!user?.token) return;

    try {
      const res = await fetch("/api/users/me/loyalty", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        const loyaltyData = await res.json();
        setLoyaltyPoints(loyaltyData);
      }
    } catch (error) {
      console.error("Error fetching loyalty points:", error);
    }
  };

  // Fetch notification settings
  const fetchNotificationSettings = async () => {
    if (!user?.token) return;

    try {
      const res = await fetch("/api/users/me/notifications", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        const settings = await res.json();
        setNotificationSettings(settings);
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    }
  };

  // Profile update handler
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
      updateUser(updatedUser);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUpdating(false);
    }
  };

  // Password change handler
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

  // Avatar file selection handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Please select a JPG, PNG, or WebP image file",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear any existing messages
    setMessage(null);
  };

  // Avatar upload handler
  const handleAvatarUpload = async () => {
    if (!avatarFile || !user?.id) {
      setMessage({ type: "error", text: "No file selected or user not found" });
      return;
    }

    setAvatarUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Upload failed with status: ${res.status}`
        );
      }

      const data = await res.json();

      if (data.success && data.user) {
        // Update user in context with the complete user object from server
        updateUser(data.user);

        // Clear the file but keep the preview from the updated user data
        setAvatarFile(null);

        setMessage({ type: "success", text: "Avatar updated successfully!" });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      setMessage({ type: "error", text: error.message });

      // Reset to current user avatar on error
      if (user?.avatar) {
        setAvatarPreview(
          user.avatar.startsWith("http") || user.avatar.startsWith("/")
            ? user.avatar
            : `/uploads/avatars/${user.avatar}`
        );
      } else {
        setAvatarPreview("");
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  // Cancel avatar upload
  const handleCancelAvatarUpload = () => {
    setAvatarFile(null);
    // Reset preview to current user avatar from database
    if (user?.avatar) {
      let avatarUrl = user.avatar;
      if (!user.avatar.startsWith("http") && !user.avatar.startsWith("/")) {
        avatarUrl = `/uploads/avatars/${user.avatar}`;
      }
      const timestamp = new Date().getTime();
      setAvatarPreview(`${avatarUrl}?v=${timestamp}`);
    } else {
      setAvatarPreview("");
    }
    setMessage(null);
  };

  // Address management
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;

    try {
      const res = await fetch("/api/users/me/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (res.ok) {
        const newAddress = await res.json();
        setAddresses((prev) => [...prev, newAddress]);
        setAddressForm({
          title: "",
          street: "",
          city: "",
          state: "",
          country: "Nigeria",
          postalCode: "",
          isDefault: false,
          phone: "",
        });
        setMessage({ type: "success", text: "Address added successfully!" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add address" });
    }
  };

  // Wishlist management
  const removeFromWishlist = async (productId: string) => {
    if (!user?.token) return;

    try {
      const res = await fetch(`/api/users/me/wishlist/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        setWishlist((prev) =>
          prev.filter((item) => item.productId !== productId)
        );
        setMessage({ type: "success", text: "Removed from wishlist" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove from wishlist" });
    }
  };

  // Notification settings update
  const updateNotificationSettings = async () => {
    if (!user?.token) return;

    try {
      const res = await fetch("/api/users/me/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(notificationSettings),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Notification settings updated!" });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update notification settings",
      });
    }
  };

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    console.error("Image failed to load:", img.src);

    // Try to reload with cache busting if it's not already there
    if (!img.src.includes("?v=")) {
      const timestamp = new Date().getTime();
      img.src = `${img.src.split("?")[0]}?v=${timestamp}`;
    } else {
      // If still fails, hide the image and show fallback
      img.style.display = "none";

      // Show the fallback element
      const fallback = document.getElementById("avatar-fallback");
      if (fallback) {
        fallback.style.display = "flex";
      }
    }
  };

  // Status styles helper
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

  // Input change handlers
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isGuestUser = !user;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isGuestUser ? "Guest Orders" : "My Dashboard"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isGuestUser
              ? "View your recent orders as a guest user"
              : "Manage your account, orders, and preferences"}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : message.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center">
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          {!isGuestUser && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <nav className="space-y-1">
                  {[
                    { id: "profile", name: "Profile", icon: "👤" },
                    { id: "orders", name: "Orders", icon: "📦" },
                    { id: "addresses", name: "Addresses", icon: "🏠" },
                    { id: "payments", name: "Payment Methods", icon: "💳" },
                    { id: "reviews", name: "My Reviews", icon: "⭐" },
                    { id: "wishlist", name: "Wishlist", icon: "❤️" },
                    { id: "loyalty", name: "Loyalty Points", icon: "🎯" },
                    { id: "notifications", name: "Notifications", icon: "🔔" },
                    { id: "security", name: "Security", icon: "🔒" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as ActiveTab)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center space-x-3 ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>

                {/* Account Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </h3>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="capitalize">
                      {user?.role?.toLowerCase()} account
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
            {/* Guest User View */}
            {isGuestUser ? (
              <GuestOrdersView
                guestOrders={guestOrders}
                currentOrder={currentOrder}
                getStatusStyles={getStatusStyles}
                router={router}
              />
            ) : (
              /* Logged-in User Tabs */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <ProfileTab
                    user={user}
                    formData={formData}
                    setFormData={setFormData}
                    updating={updating}
                    handleProfileUpdate={handleProfileUpdate}
                    avatarPreview={avatarPreview}
                    avatarFile={avatarFile}
                    avatarUploading={avatarUploading}
                    setAvatarFile={setAvatarFile}
                    setAvatarPreview={setAvatarPreview}
                    setMessage={setMessage}
                    handleAvatarUpload={handleAvatarUpload}
                    handleCancelAvatarUpload={handleCancelAvatarUpload}
                    handleAvatarChange={handleAvatarChange}
                    handleImageError={handleImageError}
                  />
                )}

                {/* Orders Tab */}
                {activeTab === "orders" && (
                  <OrdersTab
                    orders={recentOrders}
                    loading={ordersLoading}
                    getStatusStyles={getStatusStyles}
                  />
                )}

                {/* Addresses Tab */}
                {activeTab === "addresses" && (
                  <AddressesTab
                    addresses={addresses}
                    addressForm={addressForm}
                    setAddressForm={setAddressForm}
                    handleAddAddress={handleAddAddress}
                  />
                )}

                {/* Payments Tab */}
                {activeTab === "payments" && (
                  <PaymentsTab
                    paymentMethods={paymentMethods}
                    addingPayment={addingPayment}
                    setAddingPayment={setAddingPayment}
                  />
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <ReviewsTab reviews={reviews} reviewStats={reviewStats} />
                )}

                {/* Wishlist Tab */}
                {activeTab === "wishlist" && (
                  <WishlistTab
                    wishlist={wishlist}
                    loading={wishlistLoading}
                    removeFromWishlist={removeFromWishlist}
                    router={router}
                  />
                )}

                {/* Loyalty Tab */}
                {activeTab === "loyalty" && (
                  <LoyaltyTab loyaltyPoints={loyaltyPoints} />
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <NotificationsTab
                    notificationSettings={notificationSettings}
                    setNotificationSettings={setNotificationSettings}
                    updateNotificationSettings={updateNotificationSettings}
                  />
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <SecurityTab
                    passwordData={passwordData}
                    setPasswordData={setPasswordData}
                    updating={updating}
                    handlePasswordChange={handlePasswordChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
