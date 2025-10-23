"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProductTable from "@/app/components/ProductTable";

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  if (loading) return <p className="text-center py-8">Loading products...</p>;
  if (error)
    return <p className="text-red-500 text-center py-4 font-medium">⚠️ {error}</p>;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Manage Products
        </h1>
        <Link
          href="/admin/products/new"
          className="w-full sm:w-auto text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          + Add Product
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
        {products.length === 0 ? (
          <p className="text-center py-6 text-gray-500">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <ProductTable products={products} onDelete={handleDelete} />
          </div>
        )}
      </div>
    </div>
  );
}
