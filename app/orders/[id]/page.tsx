"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  shippingAddress?: {
    id: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  items: OrderItem[];
  transaction?: {
    id: string;
    provider: string;
    status: string;
    amount: number;
    currency: string;
    providerRef?: string;
    createdAt: string;
  };
  notes?: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    author?: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    images: {
      id: string;
      name: string;
    }[];
    category?: {
      id: string;
      name: string;
    };
    seller?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PAID":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
}

// Timeline component for order status
function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const statusSteps = [
    { key: "PENDING", label: "Order Placed" },
    { key: "PAID", label: "Payment Confirmed" },
    { key: "SHIPPED", label: "Shipped" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex((step) => step.key === status);
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Order Timeline</h3>
      <div className="space-y-3">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isCurrent
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <div
                className={`font-medium ${
                  isCompleted
                    ? "text-green-700"
                    : isCurrent
                    ? "text-blue-700"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </div>
              {isCurrent && <StatusBadge status={currentStatus} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Safe data access helper functions
const getShippingAddress = (order: Order) => {
  if (!order.shippingAddress) {
    return {
      street: "No shipping address provided",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    };
  }
  return order.shippingAddress;
};

const getProductImage = (item: OrderItem) => {
  if (!item.product.images || item.product.images.length === 0) {
    return null;
  }
  // Construct image URL based on your image serving setup
  const image = item.product.images[0];
  return `/api/images/${image.id}`; // Adjust this based on your actual image route
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateNote, setUpdateNote] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${orderId}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Order not found");
        }
        throw new Error("Failed to fetch order details");
      }

      // FIX: Your API returns the order directly, not nested in data
      const orderData = await res.json();
      setOrder(orderData);
    } catch (err: any) {
      console.error("Fetch order error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          // Note: Your PUT endpoint doesn't currently handle notes
          // You might want to add that functionality
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update order");
      }

      // FIX: Your API returns { message: string, order: Order }
      const responseData = await res.json();
      setOrder(responseData.order);

      // Clear the note field after successful update
      setUpdateNote("");
    } catch (err: any) {
      console.error("Update error:", err);
      alert(`Failed to update order: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!order || !updateNote.trim()) return;

    try {
      // You'll need to create a separate API endpoint for adding notes
      // For now, we'll use a placeholder
      const res = await fetch(`/api/orders/${order.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: updateNote,
          type: "INTERNAL",
        }),
      });

      if (!res.ok) throw new Error("Failed to add note");

      setUpdateNote("");
      fetchOrder(); // Refresh to get the new note
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
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
    );
  }

  if (error || !order) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">
                Error loading order
              </h3>
              <p className="text-red-700 mt-1">{error || "Order not found"}</p>
            </div>
          </div>
          <div className="mt-6 flex space-x-3">
            <button
              onClick={fetchOrder}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
            <Link
              href="/admin/orders"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shippingAddress = getShippingAddress(order);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/orders"
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order Details
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                #{order.orderNumber} •{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <StatusBadge status={order.status} />
            <button
              onClick={() => router.refresh()}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items
            </h2>
            <div className="space-y-4">
              {/* FIX: order.items should now be defined from your API */}
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => {
                  const imageUrl = getProductImage(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.product.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.title}
                        </h3>
                        {item.product.category && (
                          <p className="text-sm text-gray-500">
                            {item.product.category.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                        {item.product.seller && (
                          <p className="text-sm text-gray-500">
                            Seller: {item.product.seller.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                        <Link
                          href={`/admin/products/${item.product.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm transition"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6"
                    />
                  </svg>
                  <p className="mt-2">No items found in this order</p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Shipping Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{shippingAddress.street}</p>
                  {shippingAddress.city && shippingAddress.state && (
                    <p>
                      {shippingAddress.city}, {shippingAddress.state}{" "}
                      {shippingAddress.postalCode}
                    </p>
                  )}
                  {shippingAddress.country && <p>{shippingAddress.country}</p>}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {order.buyer ? (
                    <>
                      <p>{order.buyer.name}</p>
                      <p>{order.buyer.email}</p>
                      {order.buyer.phone && <p>{order.buyer.phone}</p>}
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 italic">Guest Customer</p>
                      <p className="text-gray-500 italic">
                        No account information
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && order.notes.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Notes
              </h2>
              <div className="space-y-4">
                {order.notes.map((note) => (
                  <div
                    key={note.id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {note.author ? `By ${note.author.name}` : "System"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Order Actions */}
          {/* <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h3>
            
            <div className="space-y-4">
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Internal Note
                </label>
                <textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Add a note about this order..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!updateNote.trim() || updating}
                  className="mt-2 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div> */}
          {/*  */}
          {/* Order Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <OrderTimeline currentStatus={order.status} />
          </div>

          {/* Payment Information */}
          {order.transaction && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-gray-900">
                    {order.transaction.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="text-gray-900">
                    {order.transaction.provider}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <StatusBadge status={order.transaction.status} />
                  {/* <StatusBadge status={order.status} /> */}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-gray-900">
                    {order.transaction.currency}{" "}
                    {order.transaction.amount.toFixed(2)}
                  </span>
                </div>
                {order.transaction.providerRef && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider Reference:</span>
                    <span className="font-mono text-gray-900">
                      {order.transaction.providerRef}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed:</span>
                  <span className="text-gray-900">
                    {new Date(order.transaction.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-gray-900">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-mono text-gray-900">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-900">
                  {new Date(order.updatedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer ID:</span>
                <span className="font-mono text-gray-900">
                  {order.buyer ? order.buyer.id : "Guest (No ID)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
