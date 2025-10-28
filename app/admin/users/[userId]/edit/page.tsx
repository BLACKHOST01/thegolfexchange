"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/app/components/UserAvatar";

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

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  avatar?: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  general?: string;
}

// Loading Component
function LoadingState() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-4xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex justify-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Component
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-4xl mx-auto">
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
              Error Loading User
            </h3>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Users
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    role: "USER",
    isVerified: false,
  });
  const [originalData, setOriginalData] = useState<UserFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch user data
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch user");
      }

      const userData: User = await res.json();
      setUser(userData);

      const initialFormData: UserFormData = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || "",
        role: userData.role,
        isVerified: userData.isVerified,
        avatar: userData.avatar,
      };

      setFormData(initialFormData);
      setOriginalData(initialFormData);
      if (userData.avatar) {
        setAvatarPreview(userData.avatar);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);

  // Check if form has changes
  const hasChanges =
    originalData &&
    (formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      formData.phone !== originalData.phone ||
      formData.role !== originalData.role ||
      formData.isVerified !== originalData.isVerified ||
      formData.avatar !== originalData.avatar);

  // Handle input changes
  const handleInputChange = (
    field: keyof UserFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation errors when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    if (!formData.role) {
      errors.role = "Role is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ FIXED: Avatar upload handler with proper state updates
  const handleAvatarChange = async (file: File) => {
    setAvatarUploading(true);
    setAvatarFile(file);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("avatar", file);

      console.log("Uploading avatar for user:", userId);

      const uploadRes = await fetch(`/api/users/${userId}/avatar`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(
          errorData.error || `Upload failed with status: ${uploadRes.status}`
        );
      }

      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.avatarUrl) {
        const newAvatarUrl = uploadData.avatarUrl;
        
        // ✅ Update formData with new avatar URL
        setFormData(prev => ({
          ...prev,
          avatar: newAvatarUrl
        }));
        
        // ✅ Update preview
        setAvatarPreview(newAvatarUrl);
        
        // ✅ Update user state
        if (user) {
          setUser(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
        }

        setSuccessMessage("Avatar uploaded successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error(uploadData.error || "Upload failed");
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      setError(`Failed to upload avatar: ${error.message}`);
    } finally {
      setAvatarUploading(false);
      setAvatarFile(null);
    }
  };

  // ✅ FIXED: Handle form submission with proper avatar inclusion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Include the avatar in the update data
      const updateData = {
        ...formData,
        // avatar is already included in formData from the upload
      };

      console.log("Updating user with data:", updateData);

      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      const updatedUser = await res.json();
      
      // ✅ Update all states with the new data
      setUser(updatedUser);
      setFormData({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        avatar: updatedUser.avatar,
      });
      setOriginalData({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        avatar: updatedUser.avatar,
      });
      
      setAvatarFile(null);
      setSuccessMessage("User updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || null);
    setValidationErrors({});
    setError(null);
    setSuccessMessage(null);
  };

  // Handle delete user
  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      router.push("/admin/users");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error && !user) {
    return <ErrorState error={error} onRetry={fetchUser} />;
  }

  if (!user) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The user you're looking for doesn't exist.
          </p>
          <Link
            href="/admin/users"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <Link
            href="/admin/users"
            className="text-gray-600 hover:text-gray-900 transition flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Users
          </Link>
        </div>
        <p className="text-gray-600">Update user information and permissions</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-3"
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
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
          {/* Left Column - Avatar */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center">
              <UserAvatar
                src={avatarPreview || user.avatar}
                alt={formData.name}
                size={160}
                editable={true}
                onAvatarChange={handleAvatarChange}
                isUploading={avatarUploading}
              />
              <p className="text-sm text-gray-500 mt-4 text-center">
                Click on the avatar to upload a new image. JPG, PNG or WebP, max
                5MB.
              </p>
              {avatarFile && !avatarUploading && (
                <p className="text-sm text-blue-600 mt-2">
                  New avatar selected: {avatarFile.name}
                </p>
              )}
              {avatarUploading && (
                <p className="text-sm text-blue-600 mt-2">
                  Uploading avatar...
                </p>
              )}
            </div>

            {/* User Metadata */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                User Information
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">User ID</dt>
                  <dd className="font-mono text-gray-900 text-xs truncate">
                    {user.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">Joined</dt>
                  <dd className="text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">Status</dt>
                  <dd className="text-gray-900">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        formData.isVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {formData.isVerified ? "Verified" : "Pending"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 p-4 border border-red-200 rounded-lg bg-red-50">
              <h3 className="font-medium text-red-800 mb-3">Danger Zone</h3>
              <p className="text-sm text-red-700 mb-4">
                Once you delete a user, there is no going back. Please be
                certain.
              </p>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Delete User
              </button>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  validationErrors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter user's full name"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  validationErrors.email ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter email address"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
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
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  validationErrors.phone ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter phone number (optional)"
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.phone}
                </p>
              )}
            </div>

            {/* Role and Verification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Field */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Role *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    validationErrors.role ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="MODERATOR">Moderator</option>
                </select>
                {validationErrors.role && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.role}
                  </p>
                )}
              </div>

              {/* Verification Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Status
                </label>
                <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={formData.isVerified}
                    onChange={(e) =>
                      handleInputChange("isVerified", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isVerified" className="text-sm text-gray-700">
                    Email Verified
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formData.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {formData.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {formData.isVerified
                    ? "User can access all features"
                    : "User may have limited access until verified"}
                </p>
              </div>
            </div>

            {/* Role Description */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">
                Role Permissions
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {formData.role === "ADMIN" && (
                  <>
                    <li>• Full access to all administrative features</li>
                    <li>• Can manage users, products, and orders</li>
                    <li>• Can modify system settings</li>
                  </>
                )}
                {formData.role === "MODERATOR" && (
                  <>
                    <li>• Can manage user content and reviews</li>
                    <li>• Can handle user reports and disputes</li>
                    <li>• Limited access to administrative features</li>
                  </>
                )}
                {formData.role === "USER" && (
                  <>
                    <li>• Standard user permissions</li>
                    <li>• Can place orders and write reviews</li>
                    <li>• No administrative access</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {hasChanges && (
              <span className="text-blue-600 font-medium">
                You have unsaved changes
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}