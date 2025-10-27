// components/GuestOrderHistory.tsx
"use client";

import React from 'react';
import { useCart } from '@/app/context/CartContext';

export const GuestOrderHistory = () => {
  const { guestOrders, currentOrder } = useCart();

  // Add clearGuestOrders function since it doesn't exist in your context
  const clearGuestOrders = () => {
    if (window.confirm('Are you sure you want to clear all order history? This cannot be undone.')) {
      localStorage.removeItem('guest-orders');
      localStorage.removeItem('current-order');
      window.location.reload(); // Refresh to update state
    }
  };

  if (guestOrders.length === 0) {
    return (
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-4">Order History</h2>
        <p className="text-gray-500">No orders found.</p>
        <p className="text-sm text-gray-400 mt-2">
          Your guest orders will appear here after checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Order History</h2>
        <button
          onClick={clearGuestOrders}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Current Order (Most Recent) */}
      {currentOrder && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800 mb-2">Latest Order</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Order #{currentOrder.orderNumber}</p>
              <p className="text-sm text-gray-600">
                Total: ${currentOrder.totalAmount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Status: <span className={`font-medium ${
                  currentOrder.status === 'PAID' ? 'text-green-600' : 
                  currentOrder.status === 'PENDING' ? 'text-yellow-600' : 
                  currentOrder.status === 'SHIPPED' ? 'text-blue-600' :
                  currentOrder.status === 'DELIVERED' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {currentOrder.status}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Date: {new Date(currentOrder.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
              Latest
            </span>
          </div>
        </div>
      )}

      {/* All Orders */}
      <div className="space-y-4">
        {guestOrders.map((order) => (
          <div key={order.id} className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">Order #{order.orderNumber}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded font-medium ${
                  order.status === 'PAID' 
                    ? 'bg-blue-100 text-blue-800' 
                    : order.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.status === 'SHIPPED'
                    ? 'bg-purple-100 text-purple-800'
                    : order.status === 'DELIVERED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {order.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} • Total: ${order.totalAmount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  Items: {order.items.map(item => item.product?.title || 'Unknown Item').join(', ')}
                </p>
              </div>
            </div>

            {/* Shipping Address Preview */}
            {order.shippingAddress && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Ships to: {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Guest Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          💡 <strong>Guest User Notice:</strong> These orders are stored in your browser. 
          Clearing browser data will remove this history.{' '}
          <a href="/auth/signup" className="underline font-medium">Sign up</a> to save your order history permanently.
        </p>
      </div>

      {/* Order Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-blue-50 rounded">
          <p className="text-lg font-bold text-blue-700">{guestOrders.length}</p>
          <p className="text-xs text-blue-600">Total Orders</p>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <p className="text-lg font-bold text-green-700">
            ${guestOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
          </p>
          <p className="text-xs text-green-600">Total Spent</p>
        </div>
        <div className="p-2 bg-purple-50 rounded">
          <p className="text-lg font-bold text-purple-700">
            {guestOrders.reduce((sum, order) => sum + order.items.length, 0)}
          </p>
          <p className="text-xs text-purple-600">Total Items</p>
        </div>
      </div>
    </div>
  );
};