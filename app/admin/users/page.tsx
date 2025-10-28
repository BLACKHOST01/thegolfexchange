"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/app/components/Pagination";

// Types
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

interface ApiError {
  error: string;
  details?: {
    cart: number;
    products: number;
    orders: number;
    reviews: number;
    sentMessages: number;
    receivedMessages: number;
    productTitles?: string[];
  };
}

interface MessageModal {
  open: boolean;
  title: string;
  message: string;
  type: 'error' | 'success' | 'warning';
  userData?: any;
}

interface Filters {
  search: string;
  role: string;
  status: string;
  dateRange: {
    from: string;
    to: string;
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

// Reusable Avatar Component
const UserAvatar = React.memo(function UserAvatar({
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
});

// Message Modal Component
function MessageModal({ modal, onClose }: { modal: MessageModal; onClose: () => void }) {
  if (!modal.open) return null;

  const getIcon = () => {
    switch (modal.type) {
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getBackgroundColor = () => {
    switch (modal.type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md rounded-lg border-2 ${getBackgroundColor()} p-6 shadow-xl`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {modal.title}
            </h3>
            <div className="text-sm text-gray-700 whitespace-pre-line mb-4">
              {modal.message}
            </div>
            {modal.userData && (
              <div className="bg-gray-100 rounded-lg p-3 text-xs font-mono mb-4 max-h-32 overflow-y-auto">
                {JSON.stringify(modal.userData, null, 2)}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Boundary Component
class UserErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('User management error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
          <p className="text-red-700 mt-2">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [messageModal, setMessageModal] = useState<MessageModal>({
    open: false,
    title: '',
    message: '',
    type: 'error'
  });

  // Search and Filter states
  const [filters, setFilters] = useState<Filters>({
    search: '',
    role: 'ALL',
    status: 'ALL',
    dateRange: {
      from: '',
      to: ''
    }
  });

  const debouncedFilters = useDebounce(filters, 300);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Close modal
  const closeModal = useCallback(() => {
    setMessageModal(prev => ({ ...prev, open: false }));
  }, []);

  // Create error message for deletion constraints
  const createErrorMessage = useCallback((details: ApiError['details']) => {
    if (!details) return '';
    
    let message = `This user has related records that must be handled first:\n\n`;
    
    if (details.cart > 0) message += `🛒 Cart: ${details.cart} item(s)\n`;
    if (details.products > 0) message += `📦 Products: ${details.products} product(s)\n`;
    if (details.orders > 0) message += `📋 Orders: ${details.orders} order(s)\n`;
    if (details.reviews > 0) message += `⭐ Reviews: ${details.reviews} review(s)\n`;
    if (details.sentMessages > 0 || details.receivedMessages > 0) {
      message += `✉️ Messages: ${details.sentMessages} sent, ${details.receivedMessages} received\n`;
    }
    
    message += `\nPlease remove these records or transfer them to another user before deletion.`;
    
    if (details.productTitles && details.productTitles.length > 0) {
      message += `\n\nSome products: ${details.productTitles.slice(0, 3).join(", ")}${details.productTitles.length > 3 ? "..." : ""}`;
    }
    
    return message;
  }, []);

  // Fetch users with search and filters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (debouncedFilters.search) params.append("search", debouncedFilters.search);
      if (debouncedFilters.role !== "ALL") params.append("role", debouncedFilters.role);
      if (debouncedFilters.status !== "ALL") params.append("status", debouncedFilters.status);
      if (debouncedFilters.dateRange.from) params.append("from", debouncedFilters.dateRange.from);
      if (debouncedFilters.dateRange.to) params.append("to", debouncedFilters.dateRange.to);

      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
      setCurrentPage(1); // Reset to first page when filters change
      setSelectedUsers(new Set()); // Clear selections
    } catch (err: any) {
      setError(err.message);
      setMessageModal({
        open: true,
        title: "Error Loading Users",
        message: err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData: ApiError = await res.json();

        if (errorData.details) {
          setMessageModal({
            open: true,
            title: "Cannot Delete User",
            message: createErrorMessage(errorData.details),
            type: 'warning',
            userData: errorData.details
          });
          return;
        }
        throw new Error(errorData.error || "Failed to delete user");
      }

      // Success - refresh the user list
      await fetchUsers();
      
      setMessageModal({
        open: true,
        title: "Success",
        message: "User deleted successfully!",
        type: 'success'
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      setMessageModal({
        open: true,
        title: "Delete Failed",
        message: err.message,
        type: 'error'
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`)) return;

    try {
      const results = await Promise.allSettled(
        Array.from(selectedUsers).map(id => 
          fetch(`/api/users/${id}`, { method: "DELETE" })
        )
      );

      const errors = results.filter((result): result is PromiseRejectedResult => 
        result.status === 'rejected'
      );

      if (errors.length > 0) {
        setMessageModal({
          open: true,
          title: "Bulk Delete Completed with Errors",
          message: `Successfully deleted ${selectedUsers.size - errors.length} users. ${errors.length} users could not be deleted.`,
          type: 'warning'
        });
      } else {
        setMessageModal({
          open: true,
          title: "Success",
          message: `Successfully deleted ${selectedUsers.size} users!`,
          type: 'success'
        });
      }

      await fetchUsers();
    } catch (err: any) {
      setMessageModal({
        open: true,
        title: "Bulk Delete Failed",
        message: err.message,
        type: 'error'
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      const res = await fetch('/api/users/export');
      if (!res.ok) throw new Error('Failed to export users');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setMessageModal({
        open: true,
 title: "Export Failed",
        message: err.message,
        type: 'error'
      });
    }
  };

  // Selection handlers
  const toggleUserSelection = (id: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllUsers = () => {
    setSelectedUsers(prev => {
      if (prev.size === currentUsers.length) {
        return new Set();
      } else {
        return new Set(currentUsers.map(user => user.id));
      }
    });
  };

  // Pagination logic with useMemo
  const { currentUsers, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentUsers = users.slice(startIndex, startIndex + itemsPerPage);
    
    return { currentUsers, totalPages };
  }, [users, currentPage, itemsPerPage]);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  // Update filter handlers
  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateDateRange = (key: keyof Filters['dateRange'], value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value
      }
    }));
  };

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

  return (
    <UserErrorBoundary>
      <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
        {/* Message Modal */}
        <MessageModal modal={messageModal} onClose={closeModal} />

        {/* Header */}
        <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Manage Users ({users.length})
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link
              href="/admin/users/new"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center"
            >
              + Add User
            </Link>
            <button
              onClick={handleExportUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedUsers.size} user(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search users"
              />
            </div>
            <select
              value={filters.role}
              onChange={(e) => updateFilter('role', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by role"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by status"
            >
              <option value="ALL">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          
          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateRange.from}
                onChange={(e) => updateDateRange('from', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateRange.to}
                onChange={(e) => updateDateRange('to', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setFilters({
                search: '',
                role: 'ALL',
                status: 'ALL',
                dateRange: { from: '', to: '' }
              })}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && !messageModal.open && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
        )}

        {/* Empty state */}
        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.role !== "ALL" || filters.status !== "ALL"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first user"}
            </p>
            {!filters.search && filters.role === "ALL" && filters.status === "ALL" && (
              <Link
                href="/admin/users/new"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                + Add User
              </Link>
            )}
          </div>
        )}

        {/* Users Table/Cards */}
        {users.length > 0 && (
          <>
            {/* Mobile Cards */}
            <div className="grid grid-cols-1 sm:hidden gap-4">
              {currentUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                  isSelected={selectedUsers.has(user.id)}
                  onSelect={toggleUserSelection}
                />
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden min-w-[600px]">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-700">
                    <th className="p-3 border-b w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === currentUsers.length && currentUsers.length > 0}
                        onChange={selectAllUsers}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label="Select all users"
                      />
                    </th>
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
                      isSelected={selectedUsers.has(user.id)}
                      onSelect={toggleUserSelection}
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
          </>
        )}
      </div>
    </UserErrorBoundary>
  );
}

// Desktop Table Row
const UserRow = React.memo(function UserRow({
  user,
  onDelete,
  deletingId,
  isSelected,
  onSelect,
}: {
  user: User;
  onDelete: (id: string) => void;
  deletingId: string | null;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="p-3 border-b">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(user.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label={`Select user ${user.name}`}
        />
      </td>
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
          aria-label={`Delete user ${user.name}`}
          aria-busy={deletingId === user.id}
        >
          {deletingId === user.id ? "Deleting..." : "Delete"}
        </button>
      </td>
    </tr>
  );
});

// Mobile Expandable Card
const UserCard = React.memo(function UserCard({
  user,
  onDelete,
  deletingId,
  isSelected,
  onSelect,
}: {
  user: User;
  onDelete: (id: string) => void;
  deletingId: string | null;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg shadow-sm bg-white p-4 transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(user.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label={`Select user ${user.name}`}
        />
        <div
          className="flex items-center gap-4 cursor-pointer flex-1"
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
              aria-label={`Delete user ${user.name}`}
              aria-busy={deletingId === user.id}
            >
              {deletingId === user.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});