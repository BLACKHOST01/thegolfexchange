"use client";

import React, { useEffect, useState } from "react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Products</h1>

      <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border-b">Image</th>
            <th className="p-3 border-b">Title</th>
            <th className="p-3 border-b">Price</th>
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
                  className="w-16 h-16 rounded object-cover"
                />
              </td>
              <td className="p-3 border-b">{p.title}</td>
              <td className="p-3 border-b">₦{p.price.toLocaleString()}</td>
              <td className="p-3 border-b space-x-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Edit
                </button>
                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
