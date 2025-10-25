"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/app/components/Pagination";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
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

// Reusable Avatar Component
function UserAvatar({
  src,
  alt,
  size = 50,
}: {
  src?: string;
  alt: string;
  size?: number;
}) {
  const [avatarSrc, setAvatarSrc] = useState(src || "/avatar-placeholder.png");

  return (
    <Image
      src={avatarSrc}
      alt={alt}
      width={size}
      height={size}
      className="object-cover rounded-full"
      onError={() => setAvatarSrc("/avatar-placeholder.png")}
    />
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch users with search and filters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter !== "ALL") params.append("role", roleFilter);

      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();

        if (errorData.details) {
          // Show detailed error about related records
          const details = errorData.details;
          const message =
            `This user has related records that must be handled first:\n\n` +
            `🛒 Cart: ${details.cart} item(s)\n` +
            `📦 Products: ${details.products} product(s)\n` +
            `📋 Orders: ${details.orders} order(s)\n` +
            `⭐ Reviews: ${details.reviews} review(s)\n` +
            `✉️ Sent Messages: ${details.sentMessages} message(s)\n` +
            `📨 Received Messages: ${details.receivedMessages} message(s)\n\n` +
            `Please remove these records or transfer them to another user before deletion.`;

          if (details.productTitles && details.productTitles.length > 0) {
            alert(
              message +
                `\n\nSome products: ${details.productTitles.join(", ")}${
                  details.products > 5 ? "..." : ""
                }`
            );
          } else {
            alert(message);
          }
        } else {
          throw new Error(errorData.error || "Failed to delete user");
        }
        return;
      }

      // Success - refresh the user list
      fetchUsers();

      // Optional: Show success message
      alert("User deleted successfully!");
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Failed to delete user: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
          <div className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg w-full sm:w-auto text-center animate-pulse">
            Loading...
          </div>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
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
              <svg
                className="h-5 w-5 text-red-400"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading users
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchUsers}
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
  if (users.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Manage Users (0)</h1>
          <Link
            href="/admin/users/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full sm:w-auto text-center"
          >
            + Add User
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="text-center py-12">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || roleFilter !== "ALL"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first user"}
          </p>
          {!searchTerm && roleFilter === "ALL" && (
            <Link
              href="/admin/users/new"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              + Add User
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Manage Users ({users.length})
        </h1>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full sm:w-auto text-center"
        >
          + Add User
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 sm:hidden gap-4">
        {currentUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden min-w-[600px]">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700">
              <th className="p-3 border-b">Avatar</th>
              <th className="p-3 border-b">Name</th>
              <th className="p-3 border-b">Email</th>
              <th className="p-3 border-b">Role</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b">Joined</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onDelete={handleDelete}
                deletingId={deletingId}
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
function UserRow({
  user,
  onDelete,
  deletingId,
}: {
  user: User;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="p-3 border-b">
        <UserAvatar src={user.avatar} alt={user.name} />
      </td>
      <td className="p-3 border-b font-medium text-gray-900">{user.name}</td>
      <td className="p-3 border-b text-gray-700">{user.email}</td>
      <td className="p-3 border-b">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.role === "ADMIN"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="p-3 border-b">
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              user.isVerified ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <span className="text-sm text-gray-600">
            {user.isVerified ? "Verified" : "Pending"}
          </span>
        </div>
      </td>
      <td className="p-3 border-b text-gray-600">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="p-3 border-b space-x-2">
        <Link
          href={`/admin/users/${user.id}/edit`}
          className="inline-block px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(user.id)}
          disabled={deletingId === user.id}
          className="inline-block px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deletingId === user.id ? "Deleting..." : "Delete"}
        </button>
      </td>
    </tr>
  );
}

// Mobile Expandable Card
function UserCard({
  user,
  onDelete,
  deletingId,
}: {
  user: User;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg shadow-sm bg-white p-4 transition hover:shadow-md">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <UserAvatar src={user.avatar} alt={user.name} size={60} />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{user.name}</h3>
          <p className="text-gray-600 text-sm">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {user.role}
            </span>
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-1 ${
                  user.isVerified ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-xs text-gray-600">
                {user.isVerified ? "Verified" : "Pending"}
              </span>
            </div>
          </div>
        </div>
        <span className="text-gray-500 text-sm">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3 text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">Joined:</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          {user.phone && (
            <div className="flex justify-between">
              <span className="font-semibold">Phone:</span>
              <span>{user.phone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-semibold">ID:</span>
            <span className="text-xs font-mono truncate max-w-[120px]">
              {user.id}
            </span>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="flex-1 text-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(user.id)}
              disabled={deletingId === user.id}
              className="flex-1 text-center px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingId === user.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
