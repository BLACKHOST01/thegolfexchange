"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Product = {
  id: string;
  title: string;
  price: number;
  images?: string[];
};

type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

type Cart = {
  id: string;
  items: CartItem[];
};

type CartContextType = {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  checkout: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = "demo-user-id"; // ✅ replace later with auth user ID

  async function loadCart() {
    setLoading(true);
    const res = await fetch("/api/cart", { headers: { "x-user-id": userId } });
    const data = await res.json();
    setCart(data);
    setLoading(false);
  }

  async function addItem(productId: string, quantity = 1) {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!res.ok) throw new Error("Failed to add item");
    await loadCart();
  }

  async function updateQuantity(cartItemId: string, quantity: number) {
    const res = await fetch("/api/cart", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ cartItemId, quantity }), // ✅ corrected key
    });
    if (!res.ok) throw new Error("Failed to update item");
    await loadCart();
  }

  async function removeItem(cartItemId: string) {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ cartItemId }), // ✅ renamed
    });
    if (!res.ok) throw new Error("Failed to remove item");
    await loadCart();
  }

  async function checkout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ provider: "offline" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Checkout failed");
    alert("✅ Order placed successfully!");
    setCart({ id: "", items: [] });
  }

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addItem,
        updateQuantity,
        removeItem,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
