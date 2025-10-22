"use client";
import React from "react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  images?: string[];
}

interface ProductTableProps {
  products: Product[];
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, onDelete }: ProductTableProps) {
  return (
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
              ${p.price.toLocaleString()}
            </td>
            <td className="p-3 border-b">{p.condition}</td>
            <td className="p-3 border-b space-x-2">
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit
              </Link>
              <Link
                href={`/admin/products/${p.id}/delete`}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
