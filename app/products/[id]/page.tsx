// /app/products/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
};

export default function ProductPage() {
  const params = useParams();
  const id = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`).then((r) => r.json()).then(setProduct).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function addToCart() {
    try {
      // For demo use a placeholder user id - replace with real session id
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "demo-user-id" },
        body: JSON.stringify({ productId: id, quantity: qty }),
      });
      const data = await res.json();
      if (res.ok) alert("Added to cart");
      else alert(data?.error ?? "Error");
    } catch (err) {
      console.error(err);
      alert("Error adding to cart");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!product) return <div className="p-6">Not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <img src={product.images?.[0] ?? "/placeholder.png"} alt={product.title} className="w-full h-96 object-cover rounded" />
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="mt-2">{product.description}</p>
          <div className="mt-4 text-xl font-semibold">₦{product.price}</div>
          <div className="mt-4 flex items-center gap-2">
            <label>Quantity</label>
            <input type="number" className="border p-1 w-20" min={1} max={product.stock || 99} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </div>
          <div className="mt-4">
            <button onClick={addToCart} className="px-4 py-2 rounded bg-black text-white">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}
