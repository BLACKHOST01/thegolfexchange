// app/orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import BitcoinPayment from '@/app/components/BitcoinPayment';
import { prisma } from '@/lib/prisma'; // Changed to named import

interface OrderPageProps {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const {id} = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      buyer: true,
      guestCustomer: true,
      items: {
        include: {
          product: true
        }
      },
      shippingAddress: true,
      notes: true,
      transaction: true, // Singular as per your schema
    }
  });

  if (!order) {
    notFound();
  }

  // Get the pending transaction (singular as per your schema)
  const pendingTransaction = order.transaction;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order #{order.orderNumber}</h1>
      
      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
            <p><strong>Status:</strong> {order.status}</p>
          </div>
          <div>
            <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-medium">{item.product?.title || 'Product'}</p>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <p className="font-medium">${item.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          <div className="space-y-1">
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
        {order.buyer ? (
          <div className="space-y-2">
            <p><strong>Buyer:</strong> {order.buyer.name} ({order.buyer.email})</p>
          </div>
        ) : order.guestCustomer ? (
          <div className="space-y-2">
            <p><strong>Guest Customer:</strong> {order.guestCustomer.firstName} {order.guestCustomer.lastName}</p>
            <p><strong>Email:</strong> {order.guestCustomer.email}</p>
            {order.guestCustomer.phone && <p><strong>Phone:</strong> {order.guestCustomer.phone}</p>}
          </div>
        ) : (
          <p className="text-gray-500">No customer information available</p>
        )}
      </div>

      {/* Notes */}
      {order.notes && order.notes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Notes</h2>
          <div className="space-y-2">
            {order.notes.map((note) => (
              <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-1">
                <p className="text-gray-700">{note.content}</p>
                <p className="text-sm text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bitcoin Payment Section */}
      {pendingTransaction && pendingTransaction.status === 'pending' && order.status === 'PENDING' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment</h2>
          <BitcoinPayment 
            transaction={{
              id: pendingTransaction.id,
              amount: pendingTransaction.amount,
              currency: pendingTransaction.currency,
              status: pendingTransaction.status,
              walletAddr: pendingTransaction.walletAddr || '',
              createdAt: pendingTransaction.createdAt.toISOString(),
              confirmations: 0, // You'll need to add this field to your Transaction model
              requiredConfirmations: 3, // You'll need to add this field to your Transaction model
              networkFee: pendingTransaction.amount * 0.01, // Calculate or fetch actual fee
              txHash: pendingTransaction.txHash || '',
            }}
            order={{
              id: order.id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              status: order.status,
            }}
           
          />
        </div>
      )}

      {/* Order already paid */}
      {order.status === 'PAID' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-4xl mb-2">✅</div>
          <h3 className="text-lg font-medium text-green-800 mb-2">
            Payment Completed
          </h3>
          <p className="text-green-600">
            Your order has been paid and is being processed.
          </p>
        </div>
      )}

      {/* No pending transaction but order is still pending */}
      {!pendingTransaction && order.status === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Payment Required
          </h3>
          <p className="text-yellow-600">
            No pending payment found. Please contact support if you need to make a payment.
          </p>
        </div>
      )}
    </div>
  );
}