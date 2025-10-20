"use client";

import React from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="p-10">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-4">
          Welcome, admin! You have full access here.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <div className="bg-white shadow-md p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Users</h2>
            <p className="text-gray-500 mt-2">Manage registered users</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Products</h2>
            <p className="text-gray-500 mt-2">Add or edit shop products</p>
          </div>
          <div className="bg-white shadow-md p-6 rounded-xl">
            <h2 className="text-xl font-semibold">Orders</h2>
            <p className="text-gray-500 mt-2">View user orders and stats</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
