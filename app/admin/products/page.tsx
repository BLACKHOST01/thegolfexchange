"use client";

import React, { useEffect, useState } from "react";

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    image: "",
    condition: "NEW",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Fetch products from API
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
      console.error("Error fetching products:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Create Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      alert("Please enter both title and price.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title,
        price: Number(formData.price),
        condition: formData.condition,
        images: formData.image ? [formData.image] : [],
        sellerId: "admin", // Replace with logged-in admin ID later
        stock: 10,
        description: "No description provided",
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add product");

      alert("✅ Product added successfully");
      setIsAddModalOpen(false);
      setFormData({ title: "", price: "", image: "", condition: "NEW" });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Delete Product
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");

      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("🗑️ Product deleted successfully");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Delete failed");
    }
  };

  // ✅ Open Edit Modal
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      price: product.price.toString(),
      image: product.images?.[0] || "",
      condition: product.condition,
    });
    setIsEditModalOpen(true);
  };

  // ✅ Update Product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title,
        price: Number(formData.price),
        condition: formData.condition,
        images: formData.image ? [formData.image] : [],
      };

      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update product");

      alert("✅ Product updated successfully");
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Render loading/error
  if (loading) return <p className="p-4 text-gray-600">Loading products...</p>;
  if (error) return <p className="p-4 text-red-500">⚠️ {error}</p>;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Add Product
        </button>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border-b">Image</th>
              <th className="p-3 border-b">Title</th>
              <th className="p-3 border-b">Price</th>
              <th className="p-3 border-b">Condition</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3 border-b">
                  <img
                    src={p.images?.[0] || "/placeholder.png"}
                    alt={p.title}
                    className="w-16 h-16 rounded object-cover border"
                  />
                </td>
                <td className="p-3 border-b">{p.title}</td>
                <td className="p-3 border-b font-medium">
                  ₦{p.price.toLocaleString()}
                </td>
                <td className="p-3 border-b">{p.condition}</td>
                <td className="p-3 border-b space-x-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ Add Modal */}
      {isAddModalOpen && (
        <Modal
          title="Add Product"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddProduct}
          formData={formData}
          handleChange={handleChange}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ✅ Edit Modal */}
      {isEditModalOpen && (
        <Modal
          title="Edit Product"
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateProduct}
          formData={formData}
          handleChange={handleChange}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// ✅ Reusable Modal Component
function Modal({
  title,
  onClose,
  onSubmit,
  formData,
  handleChange,
  isSubmitting,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: { title: string; price: string; image: string; condition: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Product title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (₦)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter price"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="NEW">NEW</option>
              <option value="USED">USED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white rounded ${
                isSubmitting ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
