"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import golfball from "@/public/golf-ball.webp";


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
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const menuItemsRef = useRef([]);
  const pathname = usePathname();

  // Handle outside clicks & ESC key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        !menuRef.current?.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  // Manage body scroll & focus trapping
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
      menuItemsRef.current[0]?.focus();
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isMobileMenuOpen]);

  // Keyboard navigation inside mobile menu
  const handleKeyDown = useCallback((event) => {
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

  const isActive = (path) => pathname === path;

  return (
    <nav
      className="bg-white shadow-sm relative z-50"
      aria-label="Main navigation"
    >
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-white focus:p-2 focus:text-blue-500"
      >
        Skip to main content
      </a>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-gray-800 flex items-center"
            aria-label="Home page"
          >
            <span className="flex items-center flex-row-reverse">
              <Image
                src={golfball}
                alt="Company Logo"
                className={`w-8 h-8 ml-2 rounded-full transition-opacity ${
                  isLogoLoaded ? "opacity-100" : "opacity-0"
                }`}
                width="32"
                height="32"
                loading="lazy"
                onLoad={() => setIsLogoLoaded(true)}
                onError={(e) => {
                  e.target.style.display = "none";
                  setIsLogoLoaded(true);
                }}
              />
              {!isLogoLoaded && (
                <div className="w-8 h-8 ml-2 bg-gray-200 animate-pulse rounded-full" />
              )}
            </span>
            <span className="ml-2 font-semibold text-gray-900">
              TheGolfExchange
            </span>
          </Link>

          {/* Desktop Menu */}
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
          </div>

          {/* Mobile Menu Toggle */}
          <button
            ref={buttonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {/* Menu icon */}
            <svg
              className={`h-6 w-6 ${isMobileMenuOpen ? "hidden" : "block"}`}
              xmlns="http://www.w3.org/2000/svg"
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
            {/* Close icon */}
            <svg
              className={`h-6 w-6 ${isMobileMenuOpen ? "block" : "hidden"}`}
              xmlns="http://www.w3.org/2000/svg"
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
          </button>
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
      >
        <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
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
                ref={(el) => (menuItemsRef.current[index] = el)}
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
          </nav>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={() => setIsMobileMenuOpen(false)}
      />
    </nav>
  );
};

export default NavBar;
