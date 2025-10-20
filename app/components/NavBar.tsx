"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import golfball from "@/public/golf-ball.webp";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext"; // ✅ Add Auth Context

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
  };
}

const menuItems = [
  { path: "/shop", label: "Shop" },
  { path: "/coaching", label: "Coaching" },
  { path: "/tournaments", label: "Tournaments" },
  { path: "/contact", label: "Contact" },
  { path: "/blog", label: "Blog" },
];

const NavBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuItemsRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth(); // ✅ Auth context

  /** ✅ Load cart count */
  async function loadCart() {
    try {
      const res = await fetch("/api/cart", {
        headers: { "x-user-id": "demo-user-id" },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCartItems(data?.items ?? []);
    } catch (err) {
      console.error("Failed to load cart", err);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  const totalQty = cartItems.reduce((sum, it) => sum + it.quantity, 0);

  /** ✅ Handle keyboard access for cart icon */
  const handleCartKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") router.push("/cart");
  };

  /** ✅ Close mobile menu on outside click or ESC */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        !menuRef.current?.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  /** ✅ Prevent background scroll & handle focus */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
      menuItemsRef.current[0]?.focus();
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isMobileMenuOpen]);

  /** ✅ Keyboard navigation in mobile menu */
  const handleMenuKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      const currentIndex = menuItemsRef.current.findIndex(
        (el) => el === document.activeElement
      );
      if (event.key === "ArrowDown") {
        const nextIndex = (currentIndex + 1) % menuItems.length;
        menuItemsRef.current[nextIndex]?.focus();
      } else {
        const prevIndex =
          (currentIndex - 1 + menuItems.length) % menuItems.length;
        menuItemsRef.current[prevIndex]?.focus();
      }
    }
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav
      className="bg-white shadow-sm fixed w-full z-50"
      aria-label="Main navigation"
    >
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-white focus:p-2 focus:text-blue-500"
      >
        Skip to main content
      </a>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* ✅ Logo */}
          <Link
            href="/"
            className="flex items-center text-gray-800"
            aria-label="Home page"
          >
            <Image
              src={golfball}
              alt="Logo"
              width={32}
              height={32}
              className={`rounded-full transition-opacity ${
                isLogoLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsLogoLoaded(true)}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                setIsLogoLoaded(true);
              }}
            />
            {!isLogoLoaded && (
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full ml-2" />
            )}
            <span className="ml-2 font-semibold text-gray-900">
              TheGolfExchange
            </span>
          </Link>

          {/* ✅ Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-blue-500"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* ✅ Auth Links */}
            {user ? (
              <>
                <span className="text-gray-700 text-sm">
                  Hi, {user.name}{" "}
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="ml-2 text-blue-600 font-medium"
                    >
                      (Admin)
                    </Link>
                  )}
                </span>
                <button
                  onClick={logout}
                  className="bg-gray-100 px-3 py-1 rounded text-sm hover:bg-gray-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Login
              </Link>
            )}
          </div>

          {/* ✅ Cart (desktop) */}
          <div
            className="relative cursor-pointer"
            onClick={() => router.push("/cart")}
            onKeyDown={handleCartKeyDown}
            tabIndex={0}
            role="button"
          >
            <ShoppingCart className="w-6 text-black h-6" />
            {totalQty > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalQty}
              </span>
            )}
          </div>

          {/* ✅ Mobile Menu Button */}
          <button
            ref={buttonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ✅ Mobile Menu */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col h-full" onKeyDown={handleMenuKeyDown}>
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Navigation</h2>
          </div>

          <nav
            className="flex-1 flex flex-col p-4 space-y-2"
            aria-label="Mobile navigation"
          >
            {menuItems.map((item, index) => (
              <Link
                key={item.path}
                href={item.path}
                ref={(el) => {
                  menuItemsRef.current[index] = el;
                }}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-md text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-50 text-blue-500"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-500"
                }`}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                {item.label}
              </Link>
            ))}

            {/* ✅ Auth (mobile) */}
            <div className="mt-4">
              {user ? (
                <>
                  <span className="block text-gray-700 mb-2">
                    Hi, {user.name}
                  </span>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="block bg-blue-100 text-blue-700 px-4 py-2 rounded mb-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block bg-blue-600 text-white px-4 py-2 rounded text-center"
                >
                  Login
                </Link>
              )}
            </div>

            {/* ✅ Cart (mobile) */}
            <div
              className="relative mt-4 cursor-pointer"
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push("/cart");
              }}
              onKeyDown={handleCartKeyDown}
              tabIndex={0}
              role="button"
            >
              <ShoppingCart className="w-6 text-black h-6" />
              {totalQty > 0 && (
                <span className="absolute -top-1 -right-2 bg-yellow-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalQty}
                </span>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* ✅ Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
    </nav>
  );
};

export default NavBar;
