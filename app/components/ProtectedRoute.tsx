"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "USER"; // restricts to known roles
}

/**
 * Protects a route by ensuring the user is authenticated
 * and optionally has the correct role.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("ProtectedRoute:", { user, requiredRole }); // Debug line

    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (
        requiredRole &&
        user.role?.toUpperCase() !== requiredRole.toUpperCase()
      ) {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Checking authentication...
      </div>
    );
  }

  // ✅ Render children only if authorized
  if (
    user &&
    (!requiredRole ||
      user.role?.toUpperCase() === requiredRole.toUpperCase())
  ) {
    return <>{children}</>;
  }

  return null;
};
