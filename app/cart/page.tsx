"use client";

import React from "react";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem, checkout } = useCart();

  if (loading) return <div className="p-6">Loading cart…</div>;
  if (!cart || !cart.items?.length)
    return <div className="p-6">Your cart is empty.</div>;

  const total = cart.items.reduce(
    (s, it) => s + it.quantity * it.product.price,
    0
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Your Cart</h2>
      <div className="space-y-4">
        {cart.items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between border p-4 rounded"
          >
            <div className="flex items-center gap-4">
              <img
                src={it.product.images?.[0] ?? "/placeholder.png"}
                alt={it.product.title}
                className="w-20 h-20 object-cover rounded"
              />
              <div>
                <div className="font-semibold">{it.product.title}</div>
                <div>${it.product.price}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-20 p-1 border"
                value={it.quantity}
                min={1}
                onChange={(e) =>
                  updateQuantity(it.id, Number(e.target.value))
                }
              />
              <button
                className="px-3 py-1 border rounded"
                onClick={() => removeItem(it.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div className="text-lg font-bold">Total: ${total}</div>
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={checkout}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
