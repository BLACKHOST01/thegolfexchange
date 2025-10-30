// components/BitcoinPayment.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  walletAddr: string;
  createdAt: string;
  confirmations?: number;
  requiredConfirmations?: number;
  networkFee?: number;
  txHash?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
}

interface ExchangeRate {
  BTC: number;
  ETH?: number;
  LTC?: number;
}

interface BitcoinPaymentProps {
  transaction: Transaction;
  order: Order;
  onPaymentConfirmed?: () => void;
}

export default function BitcoinPayment({
  transaction,
  order,
  onPaymentConfirmed,
}: BitcoinPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isPolling, setIsPolling] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  const handlePaymentConfirmed = () => {
    setIsPaymentConfirmed(true);
    // You can add additional client-side logic here
    console.log("Payment confirmed!");
  };
  if (isPaymentConfirmed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-4xl mb-2">✅</div>
        <h3 className="text-lg font-medium text-green-800 mb-2">
          Payment Confirmed!
        </h3>
        <p className="text-green-600">
          Thank you for your payment. Your order is being processed.
        </p>
      </div>
    );
  }

  // Fetch real exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        // Using CoinGecko API for real rates
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin&vs_currencies=usd"
        );
        const data = await response.json();
        setExchangeRate({
          BTC: data.bitcoin.usd,
          ETH: data.ethereum.usd,
          LTC: data.litecoin.usd,
        });
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        // Fallback rates
        setExchangeRate({
          BTC: 50000, // Example fallback
          ETH: 3000,
          LTC: 150,
        });
      }
    };

    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate amounts based on selected cryptocurrency
  const calculateCryptoAmount = useCallback(
    (usdAmount: number, crypto: string) => {
      if (!exchangeRate) return 0;

      const rate = exchangeRate[crypto as keyof ExchangeRate];
      return rate ? usdAmount / rate : 0;
    },
    [exchangeRate]
  );

  const cryptoAmount = calculateCryptoAmount(order.totalAmount, selectedCrypto);
  const btcAmount = calculateCryptoAmount(order.totalAmount, "BTC");

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsPolling(false);
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Poll for payment status and transaction details
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/transactions/${transaction.id}/status`
        );
        if (response.ok) {
          const data = await response.json();

          // Update transaction with new data (confirmations, etc.)
          if (data.confirmations !== undefined) {
            setTransactionHistory((prev) => [
              ...prev,
              {
                timestamp: new Date().toISOString(),
                confirmations: data.confirmations,
                status: data.status,
              },
            ]);
          }

          if (data.status === "completed") {
            setIsPolling(false);
            onPaymentConfirmed?.();
          }
        }
      } catch (error) {
        console.error("Error polling transaction status:", error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [transaction.id, isPolling, onPaymentConfirmed]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getConfirmationProgress = useCallback(() => {
    const confirmations = transaction.confirmations || 0;
    const required = transaction.requiredConfirmations || 3;
    const percentage = Math.min((confirmations / required) * 100, 100);

    return {
      percentage,
      confirmations,
      required,
      status: confirmations >= required ? "Complete" : "Pending",
    };
  }, [transaction.confirmations, transaction.requiredConfirmations]);

  const progress = getConfirmationProgress();
  const bitcoinUri = `bitcoin:${transaction.walletAddr}?amount=${btcAmount}`;

  if (isExpired) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-4xl mb-2">⏰</div>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Payment Expired
          </h3>
          <p className="text-red-600">
            The payment window has expired. Please initiate a new payment if you
            still wish to complete your order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <BitcoinPayment
        transaction={transaction}
        order={order}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      {/* Cryptocurrency Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Cryptocurrency
        </label>
        <div className="grid grid-cols-3 gap-3">
          {["BTC", "ETH", "LTC"].map((crypto) => (
            <button
              key={crypto}
              onClick={() => setSelectedCrypto(crypto)}
              className={`p-3 border rounded-lg text-center transition-colors ${
                selectedCrypto === crypto
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="font-medium">{crypto}</div>
              {exchangeRate && (
                <div className="text-xs text-gray-600 mt-1">
                  $
                  {exchangeRate[crypto as keyof ExchangeRate]?.toLocaleString()}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Timer & Amount */}
      <div
        className={`border rounded-lg p-4 transition-colors ${
          timeLeft < 300
            ? "bg-red-50 border-red-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Time to complete payment
            </p>
            <p
              className={`text-2xl font-bold ${
                timeLeft < 300 ? "text-red-900" : "text-gray-900"
              }`}
            >
              {formatTime(timeLeft)}
            </p>
            {timeLeft < 300 && (
              <p className="text-xs text-red-600 mt-1">
                Hurry! Payment expires soon
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-700">Amount due</p>
            <p className="text-xl font-bold text-gray-900">
              {cryptoAmount.toFixed(8)} {selectedCrypto}
            </p>
            <p className="text-sm text-gray-600">
              ≈ ${order.totalAmount.toFixed(2)} USD
            </p>
            {exchangeRate && (
              <p className="text-xs text-gray-500">
                1 {selectedCrypto} = $
                {exchangeRate[
                  selectedCrypto as keyof ExchangeRate
                ]?.toLocaleString()}{" "}
                USD
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Network Fees Information */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-800 mb-2 flex items-center">
          ⚡ Network Fees Information
        </h4>
        <div className="text-sm text-orange-700 space-y-2">
          <p>
            <strong>Sender pays network fees:</strong> When sending{" "}
            {selectedCrypto}, you'll need to pay an additional network fee for
            the transaction to be processed.
          </p>
          <p>
            <strong>Recommended fee:</strong> Use your wallet's recommended fee
            for timely confirmation.
          </p>
          <p>
            <strong>Important:</strong> Send exactly{" "}
            <strong>
              {cryptoAmount.toFixed(8)} {selectedCrypto}
            </strong>
            {` (excluding network fees)`}
          </p>
        </div>
      </div>

      {/* QR Code */}
      {selectedCrypto === "BTC" && (
        <div className="text-center">
          <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 inline-block">
            <QRCodeCanvas
              value={bitcoinUri}
              size={200}
              level="M"
              includeMargin={true}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Scan QR code with your Bitcoin wallet
          </p>
        </div>
      )}

      {/* Wallet Address */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {selectedCrypto} Wallet Address
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            readOnly
            value={transaction.walletAddr}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 truncate"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={() => copyToClipboard(transaction.walletAddr)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            disabled={copied}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Send exactly{" "}
          <strong>
            {cryptoAmount.toFixed(8)} {selectedCrypto}
          </strong>{" "}
          to this address
        </p>
      </div>

      {/* Blockchain Confirmation Progress */}
      {transaction.confirmations !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-3">
            Blockchain Confirmations
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-blue-700">
              <span>Progress</span>
              <span>
                {progress.confirmations} of {progress.required} confirmations
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-blue-600">
              {progress.confirmations >= progress.required
                ? "✅ Payment fully confirmed!"
                : "⏳ Waiting for blockchain confirmations..."}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {transactionHistory.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">
            Transaction Updates
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {transactionHistory.map((entry, index) => (
              <div
                key={index}
                className="flex justify-between text-sm text-gray-600"
              >
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span>
                  {entry.confirmations > 0
                    ? `${entry.confirmations} confirmation${
                        entry.confirmations > 1 ? "s" : ""
                      }`
                    : "Transaction detected"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Payment Instructions</h4>
        <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
          <li>Open your {selectedCrypto} wallet</li>
          {selectedCrypto === "BTC" && (
            <li>Scan the QR code or copy the wallet address</li>
          )}
          <li>
            Send exactly{" "}
            <strong>
              {cryptoAmount.toFixed(8)} {selectedCrypto}
            </strong>
          </li>
          <li>Include sufficient network fee for timely confirmation</li>
          <li>Wait for blockchain confirmation (usually 10-30 minutes)</li>
          <li>Your order will update automatically</li>
        </ol>
      </div>

      {/* Status */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
          {transaction.confirmations
            ? `Confirming (${progress.confirmations}/${progress.required})`
            : "Waiting for payment"}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {isPolling
            ? "Polling for status updates..."
            : "Payment monitoring complete"}
        </p>
      </div>
    </div>
  );
}
