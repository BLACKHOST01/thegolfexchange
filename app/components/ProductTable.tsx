"use client";

import React, { useState } from "react";
import Image from "next/image";
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
          <ProductRow key={p.id} product={p} onDelete={onDelete} />
        ))}
      </tbody>
    </table>
  );
}

// ===============================
// ✅ Row Component with Image Fallback
// ===============================
function ProductRow({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: string) => void;
}) {
  const [imgSrc, setImgSrc] = useState(
    product.images?.[0] || "/placeholder.png"
  );

  return (
    <tr className="hover:bg-gray-50">
      <td className="p-3 border-b">
        <Image
          src={imgSrc}
          alt={product.title}
          width={80}
          height={80}
          className="object-cover rounded-md"
          onError={() => setImgSrc("/placeholder.png")}
        />
      </td>
      <td className="p-3 border-b">{product.title}</td>
      <td className="p-3 border-b font-medium">
        ${product.price.toLocaleString()}
      </td>
      <td className="p-3 border-b capitalize">{product.condition}</td>
      <td className="p-3 border-b space-x-2">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(product.id)}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
