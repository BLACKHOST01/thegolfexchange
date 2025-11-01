"use client";

import React from "react";
import { useCart } from "@/app/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface ShopCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  condition: "NEW" | "USED"; // Match Prisma enum
  stock: number;
  sellerName?: string;
  category?: string;
  productId?: string; // Add productId to match Prisma schema
  images?: string[]; // Support multiple images
}

export function ShopCard({
  id,
  title,
  description,
  price,
  image,
  images,
  condition,
  stock,
  sellerName,
  category,
  productId,
}: ShopCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use the first image from images array or fallback to image prop
    const productImages = images && images.length > 0 ? images : (image ? [image] : []);

    addToCart(
      {
        id: productId || id, // Use productId if available, fallback to id
        title,
        price,
        images: productImages,
        stock,
        name: title, // Map title to name for CartItem compatibility
        condition, // Pass condition to match Prisma schema
        productId: productId || id, // Ensure productId is set
      },
      1
    );

    // Optional: Show a more sophisticated notification instead of alert
    // You could use a toast notification library here
    toast.success(`Added ${title} to cart!`);
  };

  // Get the primary image to display
  const primaryImage = images && images.length > 0 ? images[0] : image;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-4 h-full flex flex-col group">
      <Link href={`/products/${id}`} className="flex flex-col flex-grow">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={title}
              width={300}
              height={200}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-12 h-12"
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
            </div>
          )}
          
          {/* Condition Badge */}
          <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${
            condition === "NEW" 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}>
            {condition}
          </div>

          {/* Stock Badge */}
          {stock <= 10 && stock > 0 && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full border border-orange-200">
              {stock} left
            </div>
          )}
          {stock === 0 && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200">
              Sold Out
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-grow">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {description}
          </p>

          {/* Additional Info */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-600">
                ${price.toFixed(2)}
              </span>
              
              {/* Multiple Images Indicator */}
              {images && images.length > 1 && (
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l5 5m0-5l-5 5" />
                  </svg>
                  {images.length} photos
                </div>
              )}
            </div>

            {category && (
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {category}
              </div>
            )}

            {sellerName && (
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sold by {sellerName}
              </div>
            )}
          </div>

          {/* Stock Info */}
          <div className={`text-sm font-medium ${
            stock > 10
              ? "text-green-600"
              : stock > 0
              ? "text-orange-600"
              : "text-red-600"
          }`}>
            {stock > 10
              ? "In Stock"
              : stock > 0
              ? `Low Stock - ${stock} remaining`
              : "Out of Stock"}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={stock === 0}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-4 flex items-center justify-center transition-colors font-medium"
      >
        {stock === 0 ? (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Out of Stock
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}