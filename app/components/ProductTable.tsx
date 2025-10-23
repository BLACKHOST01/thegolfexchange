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
  itemsPerPage?: number;
}

export default function ProductTable({
  products,
  onDelete,
  itemsPerPage = 6,
}: ProductTableProps) {
  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="w-full">
      {/* 📱 Mobile View (Expandable Cards) */}
      <div className="grid grid-cols-1 sm:hidden gap-4">
        {currentProducts.map((product) => (
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
            {currentProducts.map((p) => (
              <ProductRow key={p.id} product={p} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔢 Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            ← Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ===============================
// ✅ Desktop Table Row
// ===============================
function ProductRow({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: string) => void;
}) {
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

// ===============================
// ✅ Mobile Card View (Expandable)
// ===============================
function ProductCard({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: string) => void;
}) {
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || "/placeholder.png");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg shadow-sm bg-white p-4 transition hover:shadow-md">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
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
          <p className="text-gray-600 text-sm capitalize">
            {product.condition}
          </p>
          <p className="text-green-700 font-semibold">
            ${product.price.toLocaleString()}
          </p>
        </div>
        <span className="text-gray-500 text-sm">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="mt-3 border-t pt-3 text-sm text-gray-600">
          <p>
            <span className="font-semibold">ID:</span> {product.id}
          </p>
          <p>
            <span className="font-semibold">Condition:</span>{" "}
            {product.condition}
          </p>
          <p>
            <span className="font-semibold">Price:</span> $
            {product.price.toLocaleString()}
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
