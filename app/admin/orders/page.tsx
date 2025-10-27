"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  transaction?: {
    id: string;
    provider: string;
    status: string;
  };
  shippingAddress?: {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: {
      id: string;
      name: string;
    }[];
  };
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
}

// Simple Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex justify-between items-center mt-6">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
      >
        Next
      </button>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch orders with search and filters
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch orders");
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (err: any) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrder(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update order");
      }

      // Update local state instead of refetching all orders
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err: any) {
      console.error("Update error:", err);
      alert(`Failed to update order: ${err.message}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Manage Orders</h1>
          <div className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg w-full sm:w-auto text-center animate-pulse">
            Loading...
          </div>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchOrders}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Manage Orders (0)</h1>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders by customer name, email, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== "ALL" 
              ? "Try adjusting your search or filters" 
              : "No orders have been placed yet"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Manage Orders ({orders.length})
        </h1>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          Total Revenue: ${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search orders by customer name, email, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-800">{orders.filter(o => o.status === "PENDING").length}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === "PAID").length}</div>
          <div className="text-sm text-gray-600">Paid</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === "SHIPPED").length}</div>
          <div className="text-sm text-gray-600">Shipped</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === "DELIVERED").length}</div>
          <div className="text-sm text-gray-600">Delivered</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">{orders.filter(o => o.status === "CANCELLED").length}</div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 sm:hidden gap-4">
        {currentOrders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onStatusUpdate={handleStatusUpdate}
            updatingOrder={updatingOrder}
          />
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700">
              <th className="p-3 border-b">Order ID</th>
              <th className="p-3 border-b">Customer</th>
              <th className="p-3 border-b">Items</th>
              <th className="p-3 border-b">Amount</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b">Date</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => (
              <OrderRow 
                key={order.id} 
                order={order} 
                onStatusUpdate={handleStatusUpdate}
                updatingOrder={updatingOrder}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}

// Desktop Table Row
function OrderRow({
  order,
  onStatusUpdate,
  updatingOrder,
}: {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  updatingOrder: string | null;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="p-3 border-b">
        <div className="font-mono text-sm text-gray-600">
          {order.id.slice(0, 8)}...
        </div>
      </td>
      <td className="p-3 border-b">
        <div>
          <div className="font-medium text-gray-900">{order.buyer.name}</div>
          <div className="text-sm text-gray-600">{order.buyer.email}</div>
        </div>
      </td>
      <td className="p-3 border-b">
        <div className="text-sm text-gray-700">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          <div className="text-xs text-gray-500 mt-1">
            {order.items[0]?.product.title}
            {order.items.length > 1 && ` + ${order.items.length - 1} more`}
          </div>
        </div>
      </td>
      <td className="p-3 border-b font-medium text-gray-900">
        ${order.totalAmount.toFixed(2)}
      </td>
      <td className="p-3 border-b">
        <StatusBadge status={order.status} />
      </td>
      <td className="p-3 border-b text-gray-600">
        <div className="text-sm">
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(order.createdAt).toLocaleTimeString()}
        </div>
      </td>
      <td className="p-3 border-b space-y-2">
        <select
          value={order.status}
          onChange={(e) => onStatusUpdate(order.id, e.target.value)}
          disabled={updatingOrder === order.id}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <Link
          href={`/admin/orders/${order.id}`}
          className="block text-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
        >
          View Details
        </Link>
      </td>
    </tr>
  );
}

// Mobile Expandable Card
function OrderCard({
  order,
  onStatusUpdate,
  updatingOrder,
}: {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  updatingOrder: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg shadow-sm bg-white p-4 transition hover:shadow-md">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800">Order #{order.id.slice(0, 8)}</h3>
              <p className="text-gray-600 text-sm">{order.buyer.name}</p>
              <p className="text-gray-500 text-xs">{order.buyer.email}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-lg font-bold text-gray-900">
              ${order.totalAmount.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <span className="text-gray-500 text-sm">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3 text-sm text-gray-600 space-y-3">
          {/* Order Items */}
          <div>
            <h4 className="font-semibold mb-2">Order Items ({order.items.length})</h4>
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="flex-1">{item.product.title}</span>
                  <span className="text-gray-700">
                    {item.quantity} × ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="text-gray-500 text-center">
                  + {order.items.length - 3} more items
                </div>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div>
            <label className="font-semibold block mb-2">Update Status</label>
            <select
              value={order.status}
              onChange={(e) => onStatusUpdate(order.id, e.target.value)}
              disabled={updatingOrder === order.id}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link
              href={`/admin/orders/${order.id}`}
              className="flex-1 text-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              View Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}