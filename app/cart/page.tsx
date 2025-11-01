"use client";

import { useCart } from '@/app/context/CartContext';
import { CartItem } from '@/app/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast, {Toaster} from "react-hot-toast";


export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, total, itemCount, clearCart } = useCart();
  const router = useRouter();

  // Handle remove item
  const handleRemoveItem = (item: CartItem) => {
    if (window.confirm(`Remove ${item.title || item.name} from cart?`)) {
      removeFromCart(item.id);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(item);
      return;
    }
    
    if (newQuantity > item.stock) {
      toast(`Only ${item.stock} items available in stock!`);
      return;
    }
    
    updateQuantity(item.id, newQuantity);
  };

  // Render cart item
  const renderItem = (item: CartItem) => {
    const itemTotal = item.price * item.quantity;
    
    return (
      <div key={item.id} className="flex items-center space-x-4 py-6 border-b">
        {/* Product Image */}
        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
          {item.images && item.images.length > 0 ? (
            <Image
              src={item.images[0]}
              alt={item.title || item.name}
              width={96}
              height={96}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {item.title || item.name}
            </h3>
            <p className="ml-4 text-lg font-medium text-gray-900">
              ${itemTotal.toFixed(2)}
            </p>
          </div>
          <p className="mt-1 text-sm text-gray-500">${item.price.toFixed(2)} each</p>
          
          {/* Stock Status */}
          <div className="mt-2">
            {item.stock < 10 && item.stock > 0 ? (
              <p className="text-sm text-orange-600">Only {item.stock} left in stock!</p>
            ) : item.stock === 0 ? (
              <p className="text-sm text-red-600">Out of stock</p>
            ) : (
              <p className="text-sm text-green-600">In stock</p>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="mt-4 flex items-center space-x-3">
            <label htmlFor={`quantity-${item.id}`} className="text-sm font-medium text-gray-700">
              Quantity:
            </label>
            <div className="flex items-center border border-gray-300 rounded">
              <button
                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="px-3 py-1 text-gray-900 border-x border-gray-300">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            
            {/* Remove Button */}
            <button
              onClick={() => handleRemoveItem(item)}
              className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle checkout redirection to Order Review
  const handleCheckout = () => {
    // Validate cart items before proceeding to order review
    const outOfStockItems = cartItems.filter(item => item.stock === 0);
    if (outOfStockItems.length > 0) {
      toast.error('Some items in your cart are out of stock. Please remove them before checking out.');
      return;
    }

    const lowStockItems = cartItems.filter(item => item.quantity > item.stock);
    if (lowStockItems.length > 0) {
      toast.error('Some items in your cart exceed available stock. Please adjust quantities before checking out.');
      return;
    }

    // Redirect to order review page
    router.push('/order-review');
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    router.push('/shop');
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Your Shopping Cart
            </h1>
            <div className="mt-12">
              <div className="rounded-lg bg-gray-50 p-12">
                <div className="mx-auto h-24 w-24 text-gray-400">
                  <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Your cart is empty</h3>
                <p className="mt-2 text-gray-500">
                  Start shopping to add items to your cart
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleContinueShopping}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h1>

        <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          {/* Cart Items */}
          <section className="lg:col-span-7">
            <div className="border-b border-t border-gray-200">
              {cartItems.map(renderItem)}
            </div>

            {/* Clear Cart Button */}
            <div className="mt-6">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your entire cart?')) {
                    clearCart();
                  }
                }}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Clear entire cart
              </button>
            </div>
          </section>

          {/* Order Summary */}
          <section className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
            <h2 className="text-lg font-medium text-gray-900">Order summary</h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">${total.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-sm text-gray-600">Shipping estimate</dt>
                <dd className="text-sm font-medium text-gray-900">$0.00</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-sm text-gray-600">Tax estimate</dt>
                <dd className="text-sm font-medium text-gray-900">$0.00</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">${total.toFixed(2)}</dd>
              </div>
            </dl>

            <div className="mt-6 space-y-4">
              <button
                onClick={handleCheckout}
                className="w-full rounded-md border border-transparent bg-green-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-50"
              >
                Review Order & Checkout
              </button>
              
              <button
                onClick={handleContinueShopping}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50"
              >
                Continue Shopping
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                You'll have a chance to review your order before payment
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}