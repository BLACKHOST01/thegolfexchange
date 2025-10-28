"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import golfball from "@/public/placeholder.png";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

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

interface MenuItem {
  path: string;
  label: string;
}

const menuItems: MenuItem[] = [
  { path: "/shop", label: "Shop" },
  { path: "/coaching", label: "Coaching" },
  { path: "/tournaments", label: "Tournaments" },
  { path: "/contact", label: "Contact" },
  { path: "/blog", label: "Blog" },
  {path: "/user/dashboard/profile", label: "Profile" },
];

const NavBar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isLogoLoaded, setIsLogoLoaded] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  // Memoized cart quantity calculation
  const totalQty = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // Load cart data
  useEffect(() => {
    const loadCart = async (): Promise<void> => {
      try {
        const res = await fetch("/api/cart", {
          headers: { "x-user-id": user?.id || "demo-user-id" }, // Use actual user ID when available
        });

        if (res.ok) {
          const data = await res.json();
          setCartItems(data?.items ?? []);
        }
      } catch (err) {
        console.error("Failed to load cart", err);
      }
    };

    loadCart();
  }, [user?.id]); // Re-fetch when user changes

  // Event handlers
  const handleCartKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        router.push("/cart");
      }
    },
    [router]
  );

  const handleCartClick = useCallback((): void => {
    router.push("/cart");
  }, [router]);

  const closeMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Close mobile menu on outside click or ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        isMobileMenuOpen &&
        !menuRef.current?.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") closeMobileMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Prevent background scroll & handle focus
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
      // Focus first menu item when menu opens
      setTimeout(() => menuItemsRef.current[0]?.focus(), 100);
    } else {
      document.body.classList.remove("overflow-hidden");
      // Return focus to menu button when menu closes
      buttonRef.current?.focus();
    }
  }, [isMobileMenuOpen]);

  // Keyboard navigation in mobile menu
  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      const currentIndex = menuItemsRef.current.findIndex(
        (el) => el === document.activeElement
      );

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % menuItemsRef.current.length;
          menuItemsRef.current[nextIndex]?.focus();
          break;

        case "ArrowUp":
          event.preventDefault();
          const prevIndex =
            (currentIndex - 1 + menuItemsRef.current.length) %
            menuItemsRef.current.length;
          menuItemsRef.current[prevIndex]?.focus();
          break;

        case "Escape":
          closeMobileMenu();
          break;

        default:
          break;
      }
    },
    [closeMobileMenu]
  );

  const isActive = (path: string): boolean => pathname === path;

  return (
    <nav
      className="bg-white shadow-sm fixed w-full z-50"
      aria-label="Main navigation"
    >
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-white focus:p-2 focus:text-blue-500 focus:z-[60]"
      >
        Skip to main content
      </a>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="Home page"
          >
            {/* // In your NavBar component - update the Image component */}
            <Image
              src={golfball}
              alt="Logo"
              width={40} // Reduced from 102 for better performance
              height={40} // Make sure height matches width for square images
              className={`rounded-full transition-opacity ${
                isLogoLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ width: "auto", height: "auto" }} // Add this to maintain aspect ratio
              onLoad={() => setIsLogoLoaded(true)}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                setIsLogoLoaded(true);
              }}
              priority // Add this for above-the-fold images
            />
            {!isLogoLoaded && (
              <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full" />
            )}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive(item.path)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Auth Links */}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm">
                  Hi, {user.name}
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="ml-2 text-blue-600 font-medium hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      (Admin)
                    </Link>
                  )}
                </span>
                <button
                  onClick={logout}
                  className="bg-gray-100 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Login
              </Link>
            )}
          </div>

          {/* Cart & Mobile Menu Button Container */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <div
              className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
              onClick={handleCartClick}
              onKeyDown={handleCartKeyDown}
              tabIndex={0}
              role="button"
              aria-label={`Shopping cart with ${totalQty} items`}
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {totalQty > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {totalQty > 99 ? "99+" : totalQty}
                </span>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              ref={buttonRef}
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex flex-col h-full" onKeyDown={handleMenuKeyDown}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Menu</h2>
          </div>

          <nav
            className="flex-1 flex flex-col p-4 space-y-1"
            aria-label="Mobile navigation"
          >
            {menuItems.map((item, index) => (
              <Link
                key={item.path}
                href={item.path}
                ref={(el) => {
                  menuItemsRef.current[index] = el;
                }}
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-md text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isActive(item.path)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                }`}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                {item.label}
              </Link>
            ))}

            {/* Auth Section (mobile) */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-600">
                    Signed in as{" "}
                    <span className="font-medium">{user.name}</span>
                  </div>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="block w-full text-left bg-blue-50 text-blue-700 px-4 py-3 rounded mb-2 hover:bg-blue-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      tabIndex={isMobileMenuOpen ? 0 : -1}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="block w-full text-left bg-gray-50 text-gray-700 px-4 py-3 rounded hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    tabIndex={isMobileMenuOpen ? 0 : -1}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block bg-blue-600 text-white px-4 py-3 rounded text-center font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default NavBar;
