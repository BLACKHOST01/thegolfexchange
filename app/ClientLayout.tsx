"use client";

import { usePathname } from "next/navigation";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ✅ Global User Panel
const UserPanel = () => {
  const { user, logout } = useAuth();

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-gray-700">
        Welcome, <span className="font-semibold">{user.name}</span>
        {user.role && (
          <span className="text-sm text-gray-500 ml-1">({user.role})</span>
        )}
      </span>
      <button
        onClick={logout}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  ) : (
    <a
      href="/login"
      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
    >
      Login
    </a>
  );
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <AuthProvider>
      <CartProvider>
        {!isAdmin && (
          <>
            <Navbar />
            <div className="absolute top-4 right-4">
              <UserPanel />
            </div>
          </>
        )}
        <main>{children}</main>
        {!isAdmin && <Footer />}
      </CartProvider>
    </AuthProvider>
  );
}
