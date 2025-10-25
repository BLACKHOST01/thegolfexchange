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
  currentPage?: number;
  totalPages?: number;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function ProductTable({
  products,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="w-full">
      {/* 📱 Mobile View */}
      <div className="grid grid-cols-1 sm:hidden gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onDelete={onDelete} />
        ))}
      </div>

      {/* 💻 Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow rounded-lg overflow-hidden min-w-[600px]">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-700">
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
      </div>
    </div>
  );
}

// ✅ Row and Card components remain unchanged
function ProductRow({ product, onDelete }: { product: Product; onDelete: (id: string) => void }) {
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || "/placeholder.png");
  return (
    <tr className="hover:bg-gray-50 transition-colors">
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
      <td className="p-3 border-b font-medium">${product.price.toLocaleString()}</td>
      <td className="p-3 border-b capitalize">{product.condition}</td>
      <td className="p-3 border-b space-x-2">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="inline-block px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(product.id)}
          className="inline-block px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function ProductCard({ product, onDelete }: { product: Product; onDelete: (id: string) => void }) {
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || "/placeholder.png");
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex flex-col border border-gray-200 rounded-lg shadow-sm bg-white p-4 transition hover:shadow-md"
      onClick={() => setExpanded((prev) => !prev)}
    >
      <div className="flex items-center gap-4 cursor-pointer">
        <Image
          src={imgSrc}
          alt={product.title}
          width={80}
          height={80}
          className="object-cover rounded-md"
          onError={() => setImgSrc("/placeholder.png")}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{product.title}</h3>
          <p className="text-gray-600 text-sm capitalize">{product.condition}</p>
          <p className="text-green-700 font-semibold">${product.price.toLocaleString()}</p>
        </div>
        <span className="text-gray-500 text-sm">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3 text-sm text-gray-600">
          <p>
            <span className="font-semibold">ID:</span> {product.id}
          </p>
          <p>
            <span className="font-semibold">Condition:</span> {product.condition}
          </p>
          <p>
            <span className="font-semibold">Price:</span> ${product.price.toLocaleString()}
          </p>

          <div className="flex justify-end mt-4 gap-2">
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="flex-1 text-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(product.id)}
              className="flex-1 text-center px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
