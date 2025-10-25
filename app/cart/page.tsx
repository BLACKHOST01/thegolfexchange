"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle, CreditCard } from "lucide-react";
import { useCart } from "../context/CartContext";

interface CartItemProps {
  item: any;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  isUpdating: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isUpdating 
}) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [inputValue, setInputValue] = useState(item.quantity.toString());

  // Validate item data
  const isValidItem = useMemo(() => 
    item?.product?.id && item?.quantity > 0 && item?.product?.price !== undefined
  , [item]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    
    setLocalQuantity(newQuantity);
    setInputValue(newQuantity.toString());
    onUpdateQuantity(item.id, newQuantity);
  }, [item.id, onUpdateQuantity]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 99) {
      setLocalQuantity(numValue);
      onUpdateQuantity(item.id, numValue);
    }
  }, [item.id, onUpdateQuantity]);

  const handleInputBlur = useCallback(() => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      setInputValue("1");
      setLocalQuantity(1);
      onUpdateQuantity(item.id, 1);
    } else if (numValue > 99) {
      setInputValue("99");
      setLocalQuantity(99);
      onUpdateQuantity(item.id, 99);
    }
  }, [inputValue, item.id, onUpdateQuantity]);

  const increment = useCallback(() => {
    handleQuantityChange(localQuantity + 1);
  }, [localQuantity, handleQuantityChange]);

  const decrement = useCallback(() => {
    handleQuantityChange(localQuantity - 1);
  }, [localQuantity, handleQuantityChange]);

  if (!isValidItem) {
    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-red-50 border-red-200">
        <div className="flex-1">
          <p className="text-red-700 font-medium">Invalid item</p>
          <p className="text-red-600 text-sm">This item is missing required information</p>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex-shrink-0">
        <Image
          src={item.product.images?.[0] ?? "/placeholder.png"}
          alt={item.product.title}
          width={80}
          height={80}
          className="w-20 h-20 object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.png";
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">
          {item.product.title}
        </h3>
        <p className="text-lg font-bold text-blue-600 mt-1">
          ${item.product.price.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Subtotal: ${(item.quantity * item.product.price).toFixed(2)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Quantity Controls */}
        <div className="flex items-center border rounded-lg">
          <button
            onClick={decrement}
            disabled={isUpdating || localQuantity <= 1}
            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={1}
            max={99}
            className="w-12 px-2 py-2 text-sm font-medium text-center border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isUpdating}
          />
          
          <button
            onClick={increment}
            disabled={isUpdating || localQuantity >= 99}
            className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          disabled={isUpdating}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={`Remove ${item.product.title} from cart`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem, checkout, error } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Filter out invalid items
  const validCartItems = useMemo(() => 
    cart?.items?.filter(item => 
      item?.product?.id && 
      item?.quantity > 0 && 
      item?.product?.price !== undefined
    ) || []
  , [cart]);

  const handleUpdateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, quantity);
      setCheckoutError(null);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [updateQuantity]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await removeItem(itemId);
      setCheckoutError(null);
    } catch (err) {
      console.error("Failed to remove item:", err);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [removeItem]);

  const handleCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    
    try {
      // Validate items before checkout
      const invalidItems = validCartItems.filter(item => 
        !item.product?.id || item.quantity <= 0
      );

      if (invalidItems.length > 0) {
        throw new Error("Some items in your cart are invalid. Please remove them and try again.");
      }

      if (validCartItems.length === 0) {
        throw new Error("Your cart is empty");
      }

      await checkout();
      // Success - cart will be cleared by the checkout function
    } catch (err: any) {
      console.error("Checkout failed:", err);
      setCheckoutError(err.message || "Checkout failed. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }, [checkout, validCartItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-4 p-4 border rounded-lg mb-4">
                <div className="w-20 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cart || validCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
          <a
            href="/shop"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  const subtotal = validCartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {validCartItems.length} item{validCartItems.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {checkoutError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-red-700 font-medium">Checkout Failed</p>
              <p className="text-red-600 text-sm mt-1">{checkoutError}</p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="space-y-4">
              {validCartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  isUpdating={updatingItems.has(item.id)}
                />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-white p-6 rounded-lg border shadow-sm sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                    {subtotal <= 50 && (
                      <span className="text-xs text-green-600 block">
                        Add ${(50 - subtotal).toFixed(2)} for free shipping
                      </span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || updatingItems.size > 0 || validCartItems.length === 0}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Checkout (${total.toFixed(2)})
                  </>
                )}
              </button>

              {/* Continue Shopping */}
              <a
                href="/shop"
                className="block text-center mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Continue Shopping
              </a>

              {/* Security Badge */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secure checkout
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}