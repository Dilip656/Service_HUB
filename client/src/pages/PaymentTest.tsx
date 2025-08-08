import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

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

const PaymentTest: React.FC = () => {
  const [amount, setAmount] = useState<string>('100');
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');

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
            description: 'Test payment from ServiceHub'
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

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');
      setPaymentStatus('idle');

      // Validate amount
      const orderAmount = parseFloat(amount);
      if (isNaN(orderAmount) || orderAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order
      const orderData = await createOrder(orderAmount);
      
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ServiceHub',
        description: 'Test Payment',
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            console.log('Payment successful:', response);
            
            // Verify payment with backend
            const verificationResult = await verifyPayment(response);
            
            if (verificationResult.success) {
              setPaymentStatus('success');
              setPaymentDetails(verificationResult);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            setPaymentStatus('failed');
            setError((error as Error).message);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '+919999999999',
        },
        notes: {
          address: 'Test Address',
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
      });

      paymentObject.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setError((error as Error).message);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setPaymentStatus('idle');
    setPaymentDetails(null);
    setError('');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CreditCard className="h-6 w-6" />
            Razorpay Payment Test
          </CardTitle>
          <CardDescription>
            Test the Razorpay payment integration with real payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentStatus === 'idle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  data-testid="input-payment-amount"
                />
                <p className="text-sm text-gray-500">
                  Minimum amount: ₹1. Use test card details for testing.
                </p>
              </div>

              <Button 
                onClick={handlePayment} 
                disabled={loading}
                className="w-full"
                data-testid="button-pay-now"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ₹{amount}
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="text-error-message">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {paymentStatus === 'success' && paymentDetails && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-700">Payment Successful!</h3>
                <p className="text-gray-600">Your payment has been processed successfully.</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-left space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">Payment ID:</span>
                  <span className="font-mono text-xs break-all" data-testid="text-payment-id">
                    {paymentDetails.payment_id}
                  </span>
                  
                  <span className="font-medium">Order ID:</span>
                  <span className="font-mono text-xs break-all" data-testid="text-order-id">
                    {paymentDetails.order_id}
                  </span>
                  
                  <span className="font-medium">Amount:</span>
                  <span data-testid="text-payment-amount">
                    ₹{paymentDetails.amount} {paymentDetails.currency}
                  </span>
                  
                  <span className="font-medium">Status:</span>
                  <span className="capitalize text-green-600" data-testid="text-payment-status">
                    {paymentDetails.status}
                  </span>
                </div>
              </div>

              <Button onClick={resetPayment} variant="outline" data-testid="button-new-payment">
                Make Another Payment
              </Button>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-700">Payment Failed</h3>
                <p className="text-gray-600">There was an issue processing your payment.</p>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="text-failure-reason">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={resetPayment} variant="outline" data-testid="button-try-again">
                Try Again
              </Button>
            </div>
          )}

          <div className="border-t pt-6">
            <h4 className="font-medium mb-2">Test Card Details:</h4>
            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
              <div><strong>Card Number:</strong> 4111 1111 1111 1111</div>
              <div><strong>Expiry:</strong> Any future date</div>
              <div><strong>CVV:</strong> Any 3 digits</div>
              <div><strong>Name:</strong> Any name</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use these test credentials in Razorpay's test mode for safe testing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentTest;