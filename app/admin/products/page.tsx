"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Pagination from "@/app/components/Pagination";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  RefreshCw,
  Download,
  ChevronUp,
  ChevronDown,
  Check,
  Eye,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  stock: number;
  isFeatured: boolean;
  isUsed: boolean;
  category?: {
    name: string;
  };
  seller?: {
    name: string;
  };
  images: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [featuredFilter, setFeaturedFilter] = useState("ALL");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Bulk actions
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Sorting
  const [sortBy, setSortBy] = useState<
    "title" | "price" | "stock" | "createdAt"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch products with search and filters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (conditionFilter !== "ALL")
        params.append("condition", conditionFilter);
      if (stockFilter !== "ALL") params.append("stock", stockFilter);
      if (featuredFilter !== "ALL") params.append("featured", featuredFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch products: ${res.status} ${res.statusText}`
        );
      }

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
      setCurrentPage(1); // Reset to first page when filters change
      setSelectedProducts([]); // Clear selection on refresh
    } catch (err: any) {
      setError(err.message);
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    conditionFilter,
    stockFilter,
    featuredFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle individual product delete
  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    )
      return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Delete failed: ${res.status}`);
      }

      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`
      )
    )
      return;

    try {
      await Promise.all(
        selectedProducts.map((id) =>
          fetch(`/api/products/${id}`, { method: "DELETE" })
        )
      );
      setSelectedProducts([]);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message);
      console.error("Bulk delete error:", err);
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });

      if (!res.ok) {
        throw new Error("Failed to update product");
      }

      fetchProducts();
    } catch (err: any) {
      setError(err.message);
      console.error("Toggle featured error:", err);
    }
  };

  // Quick stock update
  const handleStockUpdate = async (id: string, newStock: number) => {
    setUpdatingStockId(id);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!res.ok) {
        throw new Error("Failed to update stock");
      }

      fetchProducts();
    } catch (err: any) {
      setError(err.message);
      console.error("Stock update error:", err);
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = [
      "Title",
      "Price",
      "Stock",
      "Condition",
      "Featured",
      "Category",
      "Seller",
    ];
    const csvData = products.map((product) => [
      `"${product.title.replace(/"/g, '""')}"`,
      product.price,
      product.stock,
      product.condition,
      product.isFeatured ? "Yes" : "No",
      product.category?.name || "N/A",
      product.seller?.name || "N/A",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `products-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle sorting
  const handleSort = (column: "title" | "price" | "stock" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(
      (p) => p.stock < 10 && p.stock > 0
    ).length;
    const outOfStockProducts = products.filter((p) => p.stock === 0).length;
    const featuredProducts = products.filter((p) => p.isFeatured).length;
    const newProducts = products.filter((p) => p.condition === "NEW").length;
    const usedProducts = products.filter((p) => p.condition === "USED").length;

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      featuredProducts,
      newProducts,
      usedProducts,
    };
  }, [products]);

  // Select/deselect all products on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(currentProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Toggle individual product selection
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts((prev) => [...prev, productId]);
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && products.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Products
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Products ({stats.totalProducts})
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your product inventory and listings
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={handleExport}
            disabled={products.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Condition Filter */}
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">All Conditions</option>
          <option value="NEW">New</option>
          <option value="USED">Used</option>
        </select>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">All Stock</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>

        {/* Featured Filter */}
        <select
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">All Products</option>
          <option value="FEATURED">Featured</option>
          <option value="NOT_FEATURED">Not Featured</option>
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProducts}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.newProducts}
              </p>
            </div>
            <Filter className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Used</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.usedProducts}
              </p>
            </div>
            <Filter className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.featuredProducts}
              </p>
            </div>
            <Filter className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.lowStockProducts}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.outOfStockProducts}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {selectedProducts.length} product
              {selectedProducts.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {debouncedSearch ||
              conditionFilter !== "ALL" ||
              stockFilter !== "ALL" ||
              featuredFilter !== "ALL"
                ? "No products match your filters"
                : "No products found"}
            </p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create Your First Product
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === currentProducts.length &&
                          currentProducts.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center gap-1">
                        Product
                        {sortBy === "title" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("price")}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {sortBy === "price" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("stock")}
                    >
                      <div className="flex items-center gap-1">
                        Stock
                        {sortBy === "stock" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentProducts.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      index={index}
                      currentPage={currentPage}
                      isSelected={selectedProducts.includes(product.id)}
                      onSelect={handleSelectProduct}
                      onDelete={handleDelete}
                      onToggleFeatured={handleToggleFeatured}
                      onStockUpdate={handleStockUpdate}
                      deletingId={deletingId}
                      updatingStockId={updatingStockId}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrev={handlePrev}
                  onNext={handleNext}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Product Row Component
const ProductRow = React.memo(function ProductRow({
  product,
  index,
  currentPage,
  isSelected,
  onSelect,
  onDelete,
  onToggleFeatured,
  onStockUpdate,
  deletingId,
  updatingStockId,
}: {
  product: Product;
  index: number;
  currentPage: number;
  isSelected: boolean;
  onSelect: (productId: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, currentFeatured: boolean) => void;
  onStockUpdate: (id: string, newStock: number) => void;
  deletingId: string | null;
  updatingStockId: string | null;
}) {
  const [imageError, setImageError] = useState(false);
  const [stockValue, setStockValue] = useState(product.stock);

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600 bg-red-100";
    if (stock < 10) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getConditionColor = (condition: string) => {
    return condition === "NEW"
      ? "text-green-600 bg-green-100"
      : "text-blue-600 bg-blue-100";
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setStockValue(Math.max(0, value));
  };

  const handleStockBlur = () => {
    if (stockValue !== product.stock) {
      onStockUpdate(product.id, stockValue);
    }
  };

  const handleStockKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (stockValue !== product.stock) {
        onStockUpdate(product.id, stockValue);
      }
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Checkbox */}
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(product.id, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      {/* Product Info */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {/* // In the ProductRow component, replace the image section with: */}
          <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
            {product.images.length > 0 ? (
              <img
                src={`/api/images/${product.images[0].id}`}
                alt={product.title}
                className="w-full h-full object-cover"
                width={48}
                height={48}
                // onError={() => setImageError(true)}
                // unoptimized // Since we're serving from our own API
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkgyMFYyNkgxMlYxNloiIGZpbGw9IiM5Q0EwQUIiLz4KPHBhdGggZD0iTTI4IDE2SDM2VjI2SDI4VjE2WiIgZmlsbD0iIzlDQTBBQiIvPgo8cGF0aCBkPSJNMTIgMjhIMjBWMzhIMTJWMjhaIiBmaWxsPSIjOUNBMEFCIi8+CjxwYXRoIGQ9Ik0yOCAyOEgzNlYzOEgyOFYyOFoiIGZpbGw9IiM5Q0EwQUIiLz4KPC9zdmc+Cg==";
                  setImageError(true);
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {product.title}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {product.category?.name || "Uncategorized"}
            </p>
            <p className="text-xs text-gray-400">
              By {product.seller?.name || "Unknown"}
            </p>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-4">
        <p className="text-sm font-medium text-gray-900">
          ${product.price.toFixed(2)}
        </p>
      </td>

      {/* Stock with inline editing */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={stockValue}
            onChange={handleStockChange}
            onBlur={handleStockBlur}
            onKeyPress={handleStockKeyPress}
            disabled={updatingStockId === product.id}
            className={`w-20 px-2 py-1 border rounded text-xs font-medium transition-colors ${
              product.stock === 0
                ? "border-red-300 bg-red-50"
                : product.stock < 10
                ? "border-yellow-300 bg-yellow-50"
                : "border-green-300 bg-green-50"
            } disabled:opacity-50`}
            min="0"
          />
          {updatingStockId === product.id && (
            <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />
          )}
        </div>
      </td>

      {/* Condition */}
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(
            product.condition
          )}`}
        >
          {product.condition}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <button
          onClick={() => onToggleFeatured(product.id, product.isFeatured)}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
            product.isFeatured
              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          {product.isFeatured ? "Featured" : "Standard"}
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/products/${product.id}`}
            target="_blank"
            className="inline-flex items-center p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Link>

          <Link
            href={`/admin/products/${product.id}/edit`}
            className="inline-flex items-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>

          <button
            onClick={() => onDelete(product.id)}
            disabled={deletingId === product.id}
            className="inline-flex items-center p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition disabled:opacity-50"
            title="Delete"
          >
            {deletingId === product.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
});
