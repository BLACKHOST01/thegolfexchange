"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "USER";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // ✅ Always call hooks at top level
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // only run after mount
    console.log("ProtectedRoute:", { user, requiredRole });

    if (!loading) {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      if (requiredRole && user.role?.toUpperCase() !== requiredRole.toUpperCase()) {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, requiredRole, router, mounted]);

  // ✅ Show loading state until mounted
  if (!mounted || loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Checking authentication...
      </div>
    );
  }

  // ✅ Render children only if authorized
  if (user && (!requiredRole || user.role?.toUpperCase() === requiredRole.toUpperCase())) {
    return <>{children}</>;
  }

  return null;
};
