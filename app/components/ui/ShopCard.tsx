"use client";

import React, { useState } from "react";
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
  const { addItem } = useCart();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleAddToCart = () => {
    if (!user) {
      alert("⚠️ Please log in to add items to your cart.");
      return;
    }
    addItem(id, 1);
  };

  // Enhanced image validation
  const isValidImage = image && image.trim() !== "" && !imageError;

  // Handle image load complete
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
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
      {/* Product Image with enhanced validation and loading states */}
      <div className="relative w-full h-52 bg-gray-100 dark:bg-gray-800">
        {isValidImage ? (
          <>
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse z-10"></div>
            )}
            
            {/* Actual image */}
            <Image
              src={image}
              alt={typeof title === "string" ? title : "Product image"}
              fill
              className="object-cover transition-opacity duration-300"
              style={{ opacity: imageLoading ? 0 : 1 }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority={false}
            />
          </>
        ) : (
          // Fallback when no valid image
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg 
              className="w-12 h-12 mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 flex flex-col items-center text-center space-y-3">
        <h3 className="text-lg font-semibold line-clamp-2 min-h-[3.5rem] flex items-center justify-center">
          {title}
        </h3>
        
        {condition && (
          <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {condition}
          </span>
        )}
        
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5rem]">
          {description}
        </p>
        
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          ${price.toLocaleString()}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex-1"
          >
            <Link
              href={`/products/${id}`}
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors duration-200 font-medium"
            >
              View Details
            </Link>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex-1"
          >
            <button
              onClick={handleAddToCart}
              disabled={!user}
              className={`w-full px-4 py-2 rounded-xl font-medium transition-colors duration-200 ${
                user
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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