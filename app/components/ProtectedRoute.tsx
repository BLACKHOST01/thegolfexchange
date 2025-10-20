"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // optional: "admin", "user", etc.
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (requiredRole && user.role !== requiredRole) {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  return <>{user && (!requiredRole || user.role === requiredRole) && children}</>;
};
