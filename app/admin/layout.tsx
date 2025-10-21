"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/users", label: "Users" },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg p-5 flex flex-col">
          <h2 className="text-2xl font-bold text-blue-600 mb-6">Admin Panel</h2>

          <nav className="flex flex-col space-y-2 flex-grow">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md font-medium transition ${
                  pathname === link.href
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-blue-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Info + Logout */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            {user && (
              <div className="text-sm text-gray-600 mb-3">
                Logged in as <span className="font-semibold">{user.name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
