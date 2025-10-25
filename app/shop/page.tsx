"use client";

import React, { useState, useEffect } from "react";
import { ShopCard } from "../components/ui/ShopCard";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  images?: any[]; // Change to any[] since the API might return non-strings
}

export default function ShopClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        const res = await fetch(
          `/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(
            debouncedSearch
          )}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        // Debug: log what images look like
        if (data.products && data.products.length > 0) {
          console.log(
            "API Images data:",
            data.products.map((p: Product) => ({
              id: p.id,
              images: p.images,
              imageTypes: p.images?.map((img) => typeof img),
            }))
          );
        }

        setProducts(data.products);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, [debouncedSearch, page]);
  // Function to highlight matched search term in title (fancier)
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, idx) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span
              key={idx}
              className="bg-yellow-200 text-yellow-800 font-semibold px-1 rounded"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Robust helper function to get valid image URL
  const getValidImage = (images?: any[]): string | undefined => {
    if (!images || images.length === 0) return undefined;

    const firstImage = images[0];

    // Comprehensive validation for different data types
    if (typeof firstImage === "string" && firstImage.trim() !== "") {
      return firstImage;
    }

    // If it's an object with a url property (common in APIs)
    if (firstImage && typeof firstImage === "object" && firstImage.url) {
      return firstImage.url;
    }

    // If it's an object with a src property
    if (firstImage && typeof firstImage === "object" && firstImage.src) {
      return firstImage.src;
    }

    // Log unexpected types for debugging
    if (firstImage && typeof firstImage !== "string") {
      console.warn("Unexpected image type:", typeof firstImage, firstImage);
    }

    return undefined;
  };

  return (
    <section className="py-20 px-4">
      {/* Search Input */}
      <div className="mb-8 flex justify-center">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-l-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Product Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.length > 0 ? (
          products.map((p) => (
            <ShopCard
              key={p.id}
              id={p.id}
              title={highlightText(p.title, debouncedSearch)}
              description={p.description}
              price={p.price}
              image={getValidImage(p.images)}
              condition={p.condition}
            />
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500">
            No products found for "{debouncedSearch}"
          </p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            Previous
          </button>

          <span className="text-gray-700 font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
