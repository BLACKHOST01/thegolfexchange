"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">👤 Profile</h1>

        <div className="space-y-3 text-gray-700">
          <p>
            <span className="font-semibold">Name:</span> {user.name}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-semibold">Role:</span>{" "}
            <span
              className={`px-2 py-1 rounded ${
                user.role === "ADMIN"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {user.role}
            </span>
          </p>
        </div>

        <button
          onClick={logout}
          className="mt-6 px-5 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition"
        >
          Logout
        </button>

        {user.role === "ADMIN" && (
          <button
            onClick={() => router.push("/admin")}
            className="mt-4 px-5 py-2 bg-gray-800 text-white font-semibold rounded hover:bg-gray-900 transition"
          >
            Go to Admin Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
