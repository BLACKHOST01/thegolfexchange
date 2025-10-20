"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";

interface ShopCardProps {
  id: string;
  title: React.ReactNode;
  description: string;
  price: number;
  image?: string;
  condition?: string;
  highlighted?: boolean;
}

export const ShopCard: React.FC<ShopCardProps> = ({
  id,
  title,
  description,
  price,
  image,
  condition,
  highlighted = false,
}) => {
  const { user } = useAuth();
  const { addItem } = useCart(); // ✅ fixed: use addItem

  const handleAddToCart = () => {
    if (!user) {
      alert("⚠️ Please log in to add items to your cart.");
      return;
    }
    addItem(id, 1); // ✅ use addItem instead of addToCart
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition border ${
        highlighted ? "border-blue-600" : "border-transparent"
      }`}
    >
      {/* Product Image */}
      {image && (
        <div className="relative w-full h-52">
          <Image
            src={image}
            alt={typeof title === "string" ? title : ""}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </div>
      )}

      {/* Card Body */}
      <div className="p-5 flex flex-col items-center text-center space-y-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {condition && (
          <span className="text-sm text-gray-500 uppercase">{condition}</span>
        )}
        <p className="text-sm text-gray-500">{description}</p>
        <p className="text-2xl font-bold text-blue-600">
          ₦{price.toLocaleString()}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mt-3">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              href={`/products/${id}`}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              View Details
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }}>
            <button
              onClick={handleAddToCart}
              className={`px-5 py-2 rounded-xl font-medium transition ${
                user
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-700 cursor-not-allowed"
              }`}
            >
              {user ? "Add to Cart" : "Login to Add"}
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
