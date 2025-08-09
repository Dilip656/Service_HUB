import { useState, useEffect } from 'react';
import { X, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { paymentAPI } from '@/lib/api';
import { useNotification } from '@/components/ui/notification';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: {
    bookingId: number;
    providerId: number;
    userId: number;
    amount: string;
    serviceName: string;
  };
  onPaymentSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
}

export default function PaymentModal({ isOpen, onClose, bookingDetails, onPaymentSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const { showNotification } = useNotification();

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createOrder = async (orderAmount: number) => {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: orderAmount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            description: `Payment for ${bookingDetails.serviceName}`,
            bookingId: bookingDetails.bookingId
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Order created:', data);
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentData: any) => {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
          bookingId: bookingDetails.bookingId,
          userId: bookingDetails.userId,
          providerId: bookingDetails.providerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Payment verified:', data);
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const formatAmountInINR = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setPaymentStatus('idle');

      // Validate amount
      const orderAmount = parseFloat(bookingDetails.amount);
      if (isNaN(orderAmount) || orderAmount <= 0) {
        throw new Error('Invalid amount');
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order
      const orderData = await createOrder(orderAmount);
      
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Check if we're in demo mode (development without Razorpay keys)
      if (orderData.isDemoMode) {
        // Simulate payment success for demo mode
        console.log('Demo mode payment - simulating success');
        setPaymentStatus('processing');
        
        // Simulate payment processing delay
        setTimeout(async () => {
          try {
            const demoPaymentData = {
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: `demo_pay_${Date.now()}`,
              razorpay_signature: 'demo_signature'
            };
            
            const verificationResult = await verifyPayment(demoPaymentData);
            
            if (verificationResult.success) {
              setPaymentStatus('success');
              setPaymentDetails(verificationResult);
              showNotification('Demo payment successful! Booking confirmed.', 'success');
              onPaymentSuccess();
            } else {
              throw new Error('Demo payment verification failed');
            }
          } catch (error) {
            console.error('Demo payment failed:', error);
            setPaymentStatus('failed');
            setError('Demo payment simulation failed');
            showNotification('Demo payment failed', 'error');
          }
        }, 2000);
        
        return;
      }

      // Get user data for prefill
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ServiceHub',
        description: bookingDetails.serviceName,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            console.log('Payment successful:', response);
            
            // Verify payment with backend
            const verificationResult = await verifyPayment(response);
            
            if (verificationResult.success) {
              setPaymentStatus('success');
              setPaymentDetails(verificationResult);
              showNotification('Payment successful! Booking confirmed.', 'success');
              onPaymentSuccess();
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            setPaymentStatus('failed');
            setError((error as Error).message);
            showNotification('Payment verification failed', 'error');
          }
        },
        prefill: {
          name: user.name || 'Customer',
          email: user.email || 'customer@servicehub.com',
          contact: user.phone || '+919999999999',
        },
        notes: {
          address: 'ServiceHub Booking',
        },
        theme: {
          color: '#3B82F6',
        },
      };

      // Open Razorpay checkout
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response);
        setPaymentStatus('failed');
        setError(response.error.description || 'Payment failed');
        showNotification(response.error.description || 'Payment failed', 'error');
      });

      paymentObject.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setError((error as Error).message);
      setPaymentStatus('failed');
      showNotification((error as Error).message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setPaymentDetails(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="button-close-payment"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="p-6 border-b bg-gray-50">
          <div className="text-sm text-gray-600">Payment for</div>
          <div className="font-semibold text-gray-900" data-testid="text-service-name">
            {bookingDetails.serviceName}
          </div>
          <div className="text-2xl font-bold text-primary mt-2" data-testid="text-amount">
            {formatAmountInINR(bookingDetails.amount)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Amount in Indian Rupees</div>
        </div>

        {/* Payment Content */}
        <div className="p-6">
          {paymentStatus === 'success' && paymentDetails ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your booking has been confirmed. Payment ID: {paymentDetails.payment_id}
              </p>
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    window.location.href = '/user-dashboard';
                  }, 100);
                }}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                data-testid="button-view-dashboard"
              >
                View Dashboard
              </button>
            </div>
          ) : paymentStatus === 'processing' ? (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600 mb-4">
                Please wait while we process your payment...
              </p>
              <div className="text-sm text-gray-500">
                This may take a few seconds
              </div>
            </div>
          ) : paymentStatus === 'failed' ? (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-4">{error || 'Something went wrong with your payment'}</p>
              <div className="space-y-2">
                <button
                  onClick={resetPayment}
                  className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  data-testid="button-retry-payment"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6 text-center">
                <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payment Gateway</h3>
                <p className="text-gray-600 text-sm">
                  Powered by Razorpay - India's most trusted payment gateway
                </p>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-primary text-white py-4 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 text-lg"
                data-testid="button-pay-now"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Loading Payment...
                  </div>
                ) : (
                  `Pay ${formatAmountInINR(bookingDetails.amount)}`
                )}
              </button>

              {/* Payment Methods Info */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Accepted Payment Methods:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Credit/Debit Cards (Visa, Mastercard, RuPay)</div>
                  <div>• UPI (PhonePe, GooglePay, Paytm, etc.)</div>
                  <div>• Net Banking</div>
                  <div>• Wallets (Paytm, PhonePe, Amazon Pay)</div>
                </div>
              </div>

              {/* Security Note */}
              <div className="text-xs text-gray-500 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">256-bit SSL Encrypted</span>
                </div>
                <p>Your payment information is completely secure and encrypted.</p>
                <p className="mt-1">Transaction will be processed by Razorpay.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}