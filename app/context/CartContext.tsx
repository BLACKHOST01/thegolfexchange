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
  error: string | null;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = "demo-user-id"; // ✅ replace later with auth user ID

  async function loadCart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", { 
        headers: { "x-user-id": userId } 
      });
      if (!res.ok) throw new Error("Failed to load cart");
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error("Error loading cart:", err);
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  async function addItem(productId: string, quantity = 1) {
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to add item");
      }
      await loadCart();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function updateQuantity(cartItemId: string, quantity: number) {
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ cartItemId, quantity }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to update item");
      }
      await loadCart();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function removeItem(cartItemId: string) {
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ cartItemId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to remove item");
      }
      await loadCart();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function checkout() {
    setError(null);
    
    // Validate cart before checkout
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Validate all items have required fields
    const invalidItems = cart.items.filter(item => 
      !item.product?.id || item.quantity <= 0
    );

    if (invalidItems.length > 0) {
      throw new Error("Some items in your cart are invalid");
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          // Include provider if your API requires it
          provider: "offline"
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }
      
      // Clear cart on success
      setCart({ id: "", items: [] });
      alert("✅ Order placed successfully!");
      
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message);
      throw err;
    }
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
        error,
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