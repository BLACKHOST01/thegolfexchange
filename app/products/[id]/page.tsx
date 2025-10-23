"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment?: string;
  user: { name: string };
};

type Seller = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
};

type Category = { id: string; name: string };
type Subcategory = { id: string; name: string };

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  condition: string;
  category?: Category;
  subcategory?: Subcategory;
  seller: Seller;
  reviews: Review[];
};

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { addItem, loading: cartLoading } = useCart();

  // Fetch product
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!product?.images.length) return;
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) =>
          prev === product.images.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) =>
          prev === 0 ? product.images.length - 1 : prev - 1
        );
      } else if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [product]);

  // Auto slide
  useEffect(() => {
    if (!product?.images?.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [product]);

  async function handleAddToCart() {
    if (!product) return;
    try {
      await addItem(product.id, qty);
      alert(`${product.title} added to cart`);
    } catch (err) {
      console.error(err);
      alert("Error adding to cart");
    }
  }

  if (loading)
    return <div className="p-6 text-center text-gray-500">Loading…</div>;
  if (!product)
    return (
      <div className="p-6 text-center text-gray-500">Product not found</div>
    );

  return (
    <div className="p-6 mt-22 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="relative w-full h-96 rounded overflow-hidden shadow">
          {product.images.length > 0 ? (
            <>
              <Image
                src={product?.images?.[0] || "/placeholder.png"}
                alt={product?.title || "No image"}
                width={600}
                height={400}
                className="rounded-lg object-cover"
              />

              {/* Prev button */}
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Next button */}
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-3 h-3 rounded-full ${
                      i === currentIndex ? "bg-white" : "bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <Image
              src="/placeholder.png"
              alt="No image"
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Details Section */}
        <div>
          <h1 className="text-3xl font-semibold">{product.title}</h1>
          <p className="mt-3 text-gray-700">{product.description}</p>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <span>Condition:</span>
            <span className="font-medium">{product.condition}</span>
          </div>

          <div className="mt-2 text-gray-500 text-sm">
            Category:{" "}
            <span className="font-medium">{product.category?.name ?? "—"}</span>
            {product.subcategory && (
              <>
                {" "}
                /{" "}
                <span className="font-medium">{product.subcategory.name}</span>
              </>
            )}
          </div>

          <div className="mt-5 text-2xl font-bold text-green-600">
            ${product.price.toLocaleString()}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <label className="text-sm font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              max={product.stock || 99}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="border rounded p-2 w-20 text-center"
            />
          </div>

          <button
            onClick={handleAddToCart}
            disabled={cartLoading}
            className={`mt-6 px-5 py-2 rounded text-white ${
              cartLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-gray-800"
            }`}
          >
            {cartLoading ? "Adding..." : "Add to Cart"}
          </button>

          <div className="mt-4 text-sm text-gray-500">
            {product.stock > 0
              ? `${product.stock} item(s) available`
              : "Out of stock"}
          </div>

          {/* Seller Info */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold text-lg">Seller Info</h3>
            <div className="mt-1 text-sm text-gray-700">
              <p>{product.seller?.name}</p>
              <p>{product.seller?.email}</p>
              {product.seller?.phone && <p>{product.seller.phone}</p>}
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold text-lg">Customer Reviews</h3>
            {product.reviews.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {product.reviews.map((r) => (
                  <li key={r.id} className="text-sm">
                    <strong>{r.user.name}</strong> ({r.rating}/5): {r.comment}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX OVERLAY */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 text-white p-2 hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          <Image
            src={product.images[currentIndex]}
            alt={product.title}
            width={900}
            height={600}
            className="object-contain max-h-[90vh] rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
