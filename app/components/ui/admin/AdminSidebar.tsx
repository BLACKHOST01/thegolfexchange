"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement | null>(null); // ✅ Typed ref

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Users", icon: Users, href: "/admin/users" },
    { name: "Orders", icon: Package, href: "/admin/orders" },
    { name: "Analytics", icon: BarChart3, href: "/admin/analytics" },
    { name: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  const handleLogout = async () => {
    console.log("Logging out...");
  };

  // 🧠 Close sidebar when clicking outside (for mobile only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {  // ✅ Typed event
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 768
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🧭 Auto-close when clicking a link (for mobile only)
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-900 text-white p-2 rounded-md shadow-md hover:bg-blue-800 transition"
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        animate={{ width: isOpen ? 240 : 0 }}
        className={`bg-blue-900 text-white h-screen fixed md:sticky top-0 left-0 z-40 
          flex flex-col shadow-xl transition-all duration-300 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-bold"
          >
            Admin
          </motion.h1>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:block text-gray-300 hover:text-white"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={i} href={item.href} onClick={handleLinkClick}>
                <motion.div
                  whileHover={{ scale: 1.05, x: 5 }}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all duration-200 
                    ${isActive ? "bg-blue-800 text-white" : "hover:bg-blue-800 text-gray-200"}`}
                >
                  <div className="relative group">
                    <Icon size={20} />
                    {/* Tooltip when collapsed */}
                    {!isOpen && (
                      <span
                        className="absolute left-12 top-1/2 -translate-y-1/2 
                                   bg-gray-800 text-xs text-white px-2 py-1 rounded 
                                   opacity-0 group-hover:opacity-100 whitespace-nowrap z-50"
                      >
                        {item.name}
                      </span>
                    )}
                  </div>
                  {isOpen && <span className="text-sm">{item.name}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-blue-800">
          <motion.div
            whileHover={{ scale: 1.05, x: 5 }}
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-red-600 cursor-pointer transition-all"
          >
            <LogOut size={20} />
            {isOpen && <span className="text-sm">Logout</span>}
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}
