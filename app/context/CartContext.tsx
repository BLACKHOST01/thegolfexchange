"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Update interfaces to match Prisma schema
export interface CartItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  quantity: number;
  stock: number;
  name: string;
  productId: string; // Add productId to match Prisma
  condition: "NEW" | "USED"; // Add condition to match Prisma
}

// Update GuestOrder to match Prisma Order model
export interface GuestOrder {
  id: string;
  orderNumber: string;
  items: OrderItem[]; // Change to OrderItem[] to match Prisma
  totalAmount: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED"; // Use Prisma enum values
  createdAt: string;
  shippingAddress?: ShippingAddress; // Use Prisma ShippingAddress structure
  notes?: Note[]; // Use Prisma Note structure
}

// Add missing interfaces to match Prisma
export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  productId: string;
  product: {
    title: string;
    images: string[];
    condition: "NEW" | "USED";
  };
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Note {
  content: string;
  type: "INTERNAL" | "CUSTOMER";
  createdAt: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  guestOrders: GuestOrder[];
  clearGuestOrders: () => void;
  currentOrder: GuestOrder | null;
  loadGuestOrders: () => void;
  addGuestOrder: (
    orderData: Omit<GuestOrder, "id" | "orderNumber" | "createdAt">
  ) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "shopping-cart";
const GUEST_ORDERS_KEY = "guest-orders";
const CURRENT_ORDER_KEY = "current-order";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [guestOrders, setGuestOrders] = useState<GuestOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<GuestOrder | null>(null);

  // Load cart and orders from localStorage on mount
  useEffect(() => {
    loadCartFromStorage();
    loadGuestOrders();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cartItems]);

  // Save guest orders when they change
  useEffect(() => {
    try {
      localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(guestOrders));
    } catch (error) {
      console.error("Error saving guest orders:", error);
    }
  }, [guestOrders]);

  // Save current order when it changes
  useEffect(() => {
    try {
      if (currentOrder) {
        localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(currentOrder));
      } else {
        localStorage.removeItem(CURRENT_ORDER_KEY);
      }
    } catch (error) {
      console.error("Error saving current order:", error);
    }
  }, [currentOrder]);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Error loading cart from storage:", error);
    }
  };

  const loadGuestOrders = () => {
    try {
      const savedOrders = localStorage.getItem(GUEST_ORDERS_KEY);
      const savedCurrentOrder = localStorage.getItem(CURRENT_ORDER_KEY);

      if (savedOrders) {
        setGuestOrders(JSON.parse(savedOrders));
      }
      if (savedCurrentOrder) {
        setCurrentOrder(JSON.parse(savedCurrentOrder));
      }
    } catch (error) {
      console.error("Error loading guest orders:", error);
    }
  };

  // Add item to cart
  const addToCart = (
    product: Omit<CartItem, "quantity">,
    quantity: number = 1
  ) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          alert(`Only ${product.stock} items available in stock!`);
          return prevItems;
        }

        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        // Add new item to cart
        if (quantity > product.stock) {
          alert(`Only ${product.stock} items available in stock!`);
          return prevItems;
        }

        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Check stock limit
    const item = cartItems.find((item) => item.id === productId);
    if (item && quantity > item.stock) {
      alert(`Only ${item.stock} items available in stock!`);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Add guest order - updated to match Prisma structure
  const addGuestOrder = (
    orderData: Omit<GuestOrder, "id" | "orderNumber" | "createdAt">
  ) => {
    const order: GuestOrder = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: `TGE-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      ...orderData,
    };

    const updatedOrders = [order, ...guestOrders];
    setGuestOrders(updatedOrders);
    setCurrentOrder(order);
    clearCart(); // Clear cart after successful order
  };

  // Calculate total price
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate total item count
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const clearGuestOrders = () => {
    setGuestOrders([]);
    setCurrentOrder(null);
    try {
      localStorage.removeItem(GUEST_ORDERS_KEY);
      localStorage.removeItem(CURRENT_ORDER_KEY);
    } catch (error) {
      console.error("Error clearing guest orders from localStorage:", error);
    }
  };
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        total,
        itemCount,
        guestOrders,
        currentOrder,
        loadGuestOrders,
        clearGuestOrders,
        addGuestOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
