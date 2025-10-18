// /app/cart/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type CartItem = {
  id: string;
  quantity: number;
  product: { id: string; title: string; price: number; images?: string[] };
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/cart", { headers: { "x-user-id": "demo-user-id" } });
    const data = await res.json();
    setItems(data?.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateQty(itemId: string, qty: number) {
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": "demo-user-id" },
      body: JSON.stringify({ cartItemId: itemId, quantity: qty }),
    });
    load();
  }

  async function removeItem(itemId: string) {
    await fetch(`/api/cart?id=${itemId}`, {
      method: "DELETE",
      headers: { "x-user-id": "demo-user-id" },
    });
    load();
  }

  async function checkout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "demo-user-id" },
      body: JSON.stringify({ provider: "offline" }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Order created: " + data.order.id);
      setItems([]);
    } else {
      alert(data?.error || "Checkout failed");
    }
  }

  if (loading) return <div className="p-6">Loading cart…</div>;
  if (!items.length) return <div className="p-6">Your cart is empty.</div>;

  const total = items.reduce((s, it) => s + it.quantity * it.product.price, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Your Cart</h2>
      <div className="space-y-4">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between border p-4 rounded">
            <div className="flex items-center gap-4">
              <img src={it.product.images?.[0] ?? "/placeholder.png"} alt={it.product.title} className="w-20 h-20 object-cover rounded" />
              <div>
                <div className="font-semibold">{it.product.title}</div>
                <div>₦{it.product.price}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" className="w-20 p-1 border" value={it.quantity} min={1} onChange={(e) => updateQty(it.id, Number(e.target.value))} />
              <button className="px-3 py-1 border rounded" onClick={() => removeItem(it.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div className="text-lg font-bold">Total: ₦{total}</div>
        <button className="px-4 py-2 bg-black text-white rounded" onClick={checkout}>Checkout</button>
      </div>
    </div>
  );
}
