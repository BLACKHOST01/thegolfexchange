"use client";

import { usePathname } from "next/navigation";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext"; // ✅ import

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <CartProvider>
      {!isAdmin && <Navbar />}
      <main>{children}</main>
      {!isAdmin && <Footer />}
    </CartProvider>
  );
}
