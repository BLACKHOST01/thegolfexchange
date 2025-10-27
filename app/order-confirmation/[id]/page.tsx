"use client";

import { useCart } from '@/app/context/CartContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrder, guestOrders } = useCart();
  
  const orderId = params.id as string;
  
  // Find the order - first check currentOrder, then search guestOrders
  const order = currentOrder?.id === orderId ? currentOrder : guestOrders.find(order => order.id === orderId);

  useEffect(() => {
    // If no order found after a moment, redirect to home
    if (!order && guestOrders.length > 0) {
      // If we have guest orders but this specific order isn't found, maybe show error
      console.log('Order not found:', orderId);
    }
  }, [order, guestOrders, orderId]);

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find the order you're looking for. It may have been completed in a different session.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/products"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Continue Shopping
              </Link>
              <Link 
                href="/"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-2">Thank you for your purchase</p>
          <p className="text-gray-700">
            Order #: <span className="font-semibold">{order.orderNumber}</span>
          </p>
          <p className="text-gray-600 text-sm mt-1">
            A confirmation email has been sent to your email address
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-3 border-b">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <Image 
                          src={item.product.images[0]} 
                          alt={item.product.title}
                          width={64}
                          height={64}
                          className="object-cover rounded"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">No Image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.product.title}
                      </h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-500">Condition: {item.product.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">${item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                    <p className="text-gray-600">
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                      {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Order Status</h3>
                    <p className="text-gray-600">
                      Status: <span className={`font-medium ${
                        order.status === 'PAID' ? 'text-green-600' : 
                        order.status === 'PENDING' ? 'text-yellow-600' : 
                        order.status === 'SHIPPED' ? 'text-blue-600' :
                        order.status === 'DELIVERED' ? 'text-green-600' :
                        'text-red-600'
                      }`}>
                        {order.status}
                      </span>
                    </p>
                    <p className="text-gray-600 mt-2">
                      Order Date: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    order.status === 'PAID' ? 'text-green-600' : 
                    order.status === 'PENDING' ? 'text-yellow-600' : 
                    order.status === 'SHIPPED' ? 'text-blue-600' :
                    order.status === 'DELIVERED' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              {order.notes && order.notes.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-1">Order Notes</h3>
                  <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                    {order.notes.map((note, index) => (
                      <li key={index}>{note.content}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Link 
                  href="/shop"
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors block text-center"
                >
                  Continue Shopping
                </Link>
                <button
                  onClick={() => window.print()}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Print Receipt
                </button>
                <Link 
                  href="/"
                  className="w-full text-center text-gray-600 hover:text-gray-800 block py-2"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="max-w-4xl mx-auto mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Order Support</h3>
              <p className="text-gray-600 text-sm mb-2">
                If you have any questions about your order, please contact our support team.
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span> support@thegolfexchange.com<br />
                <span className="font-medium">Phone:</span> (555) 123-4567
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Shipping Information</h3>
              <p className="text-gray-600 text-sm">
                Most orders ship within 1-2 business days. You will receive a shipping confirmation 
                email with tracking information once your order has shipped.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}