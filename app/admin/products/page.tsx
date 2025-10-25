"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProductTable from "@/app/components/ProductTable";
import Pagination from "@/app/components/Pagination";

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  images?: string[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
      }

      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="px-6 py-6 w-full max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 w-full max-w-7xl mx-auto text-center">
        <p className="text-red-500 mb-4 font-medium">⚠️ {error}</p>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Manage Products ({products.length})
        </h1>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No products found.</p>
            <Link
              href="/admin/products/new"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Your First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <ProductTable
              products={currentProducts}
              onDelete={handleDelete}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </div>
        )}
      </div>
    </div>
  );
}
