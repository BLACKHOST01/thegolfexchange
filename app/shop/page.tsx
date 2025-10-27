"use client";

import React, { useState, useEffect } from "react";
import { ShopCard } from "../components/ui/ShopCard";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  stock: number;
  images?: Array<{
    id: string;
    name: string;
    mimeType: string;
  }>;
}

export default function ShopClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 6;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(
            debouncedSearch
          )}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();

        // Handle different response structures
        let productsArray: Product[] = [];
        if (Array.isArray(data)) {
          productsArray = data;
        } else if (data.products && Array.isArray(data.products)) {
          productsArray = data.products;
        }

        setProducts(productsArray);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedSearch, page]);

  // Get valid image URL for ShopCard
  const getValidImage = (images?: any[]): string | undefined => {
    if (!images || images.length === 0) {
      return undefined;
    }

    const firstImage = images[0];

    // If image has an ID, use our API route
    if (firstImage && firstImage.id) {
      return `/api/images/${firstImage.id}`;
    }

    return undefined;
  };

  if (loading && products.length === 0) {
    return (
      <section className="py-20 px-4">
        <div className="mb-8 flex justify-center">
          <div className="border border-gray-300 rounded-md px-4 py-2 w-64 bg-gray-100 animate-pulse"></div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white p-4 rounded-lg shadow"
            >
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2 mb-2"></div>
              <div className="bg-gray-200 h-6 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      {/* Search Input */}
      <div className="mb-8 flex justify-center">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Product Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.length > 0 ? (
          products.map((product) => (
            <ShopCard
              key={product.id}
              id={product.id}
              title={product.title}
              description={product.description}
              price={product.price}
              stock={product.stock}
              image={getValidImage(product.images)}
              condition={product.condition as "NEW" | "USED"}
              sellerName="ProGolfShop"
              category="Drivers"
            />
          ))
        ) : (
          <div className="text-center col-span-full py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">
              {debouncedSearch
                ? `No products found for "${debouncedSearch}"`
                : "No products available"}
            </p>
            {debouncedSearch && (
              <button
                onClick={() => setSearch("")}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-gray-700 font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(page + 1, totalPages))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
