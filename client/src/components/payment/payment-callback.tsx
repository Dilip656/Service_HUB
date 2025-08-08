import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('Processing payment...');

  useEffect(() => {
    // Get payment details from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const transactionId = urlParams.get('transactionId');
    const orderId = urlParams.get('orderId');

    // Simulate payment verification
    setTimeout(() => {
      if (status === 'success' || Math.random() > 0.2) {
        setPaymentStatus('success');
        setMessage('Payment completed successfully!');
        
        // Redirect to services page after 3 seconds
        setTimeout(() => {
          setLocation('/services');
        }, 3000);
      } else {
        setPaymentStatus('failed');
        setMessage('Payment failed or was cancelled.');
        
        // Redirect to booking page after 3 seconds
        setTimeout(() => {
          setLocation('/booking');
        }, 3000);
      }
    }, 2000);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {paymentStatus === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {paymentStatus === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to services page...</p>
          </>
        )}

        {paymentStatus === 'failed' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting back to booking...</p>
          </>
        )}
      </div>
    </div>
  );
}