"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  LogOut,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="flex min-h-screen bg-gray-100 relative">
        {/* Mobile Top Bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white shadow-md flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold text-blue-600">Admin Panel</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-200 transition"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed lg:static top-0 left-0 h-full bg-white shadow-lg p-5 flex flex-col w-64 transform transition-transform duration-300 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-blue-600">Admin Panel</h2>
          </div>

          <nav className="flex flex-col space-y-2 flex-grow mt-10 lg:mt-0">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-100"
                  }`}
                >
                  <Icon size={20} />
                  {link.label}
                </Link>
              );
            })}
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
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto transition-all duration-300 w-full ${
            sidebarOpen ? "lg:ml-64" : ""
          } mt-14 lg:mt-0`}
        >
          {children}
        </main>

        {/* Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
