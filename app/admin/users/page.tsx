"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  if (loading) return <p className="text-center py-8">Loading users...</p>;
  if (error)
    return (
      <p className="text-red-500 text-center py-4 font-medium">⚠️ {error}</p>
    );

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full sm:w-auto text-center"
        >
          + Add User
        </Link>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 sm:hidden gap-4">
        {currentUsers.map((user) => (
          <UserCard key={user.id} user={user} onDelete={handleDelete} />
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
              <th className="p-3 border-b">Joined</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <UserRow key={user.id} user={user} onDelete={handleDelete} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            ← Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ===============================
// Desktop Table Row
// ===============================
function UserRow({
  user,
  onDelete,
}: {
  user: User;
  onDelete: (id: string) => void;
}) {
  const [avatarSrc, setAvatarSrc] = useState(user.avatar || "/avatar-placeholder.png");

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="p-3 border-b">
        <Image
          src={avatarSrc}
          alt={user.name}
          width={50}
          height={50}
          className="object-cover rounded-full"
          onError={() => setAvatarSrc("/avatar-placeholder.png")}
        />
      </td>
      <td className="p-3 border-b">{user.name}</td>
      <td className="p-3 border-b">{user.email}</td>
      <td className="p-3 border-b capitalize">{user.role}</td>
      <td className="p-3 border-b">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="p-3 border-b space-x-2">
        <Link
          href={`/admin/users/${user.id}/edit`}
          className="inline-block px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(user.id)}
          className="inline-block px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

// ===============================
// Mobile Expandable Card
// ===============================
function UserCard({
  user,
  onDelete,
}: {
  user: User;
  onDelete: (id: string) => void;
}) {
  const [avatarSrc, setAvatarSrc] = useState(user.avatar || "/avatar-placeholder.png");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg shadow-sm bg-white p-4 transition hover:shadow-md">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <Image
          src={avatarSrc}
          alt={user.name}
          width={60}
          height={60}
          className="object-cover rounded-full"
          onError={() => setAvatarSrc("/avatar-placeholder.png")}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{user.name}</h3>
          <p className="text-gray-600 text-sm">{user.email}</p>
          <p className="text-gray-700 font-medium capitalize">{user.role}</p>
        </div>
        <span className="text-gray-500 text-sm">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3 text-sm text-gray-600">
          <p>
            <span className="font-semibold">Joined:</span>{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
          <p>
            <span className="font-semibold">ID:</span> {user.id}
          </p>
          <div className="flex justify-end mt-4 gap-2">
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="flex-1 text-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(user.id)}
              className="flex-1 text-center px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
