import { useState } from 'react';
import { X, CreditCard, Smartphone, Phone, QrCode } from 'lucide-react';
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

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  gateway: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    icon: <Phone className="w-6 h-6 text-purple-600" />,
    description: 'Pay using PhonePe UPI',
    gateway: 'phonepe'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    icon: <CreditCard className="w-6 h-6 text-blue-600" />,
    description: 'Pay using Paytm Wallet/UPI',
    gateway: 'paytm'
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    icon: <Smartphone className="w-6 h-6 text-green-600" />,
    description: 'Pay using Google Pay UPI',
    gateway: 'googlepay'
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: <QrCode className="w-6 h-6 text-orange-600" />,
    description: 'Pay using any UPI app',
    gateway: 'upi'
  }
];

export default function PaymentModal({ isOpen, onClose, bookingDetails, onPaymentSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showNotification } = useNotification();

  const paymentMutation = useMutation({
    mutationFn: paymentAPI.createPayment,
    onSuccess: (data) => {
      showNotification('Payment initiated successfully!', 'success');
      onPaymentSuccess();
      onClose();
    },
    onError: (error: any) => {
      showNotification(error.message || 'Payment failed', 'error');
      setIsProcessing(false);
    },
  });

  const formatAmountInINR = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const generatePaymentId = () => {
    return `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      showNotification('Please select a payment method', 'error');
      return;
    }

    if (selectedMethod === 'upi' && !upiId) {
      showNotification('Please enter UPI ID', 'error');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate payment gateway integration
      const paymentId = generatePaymentId();
      const selectedPaymentMethod = paymentMethods.find(pm => pm.id === selectedMethod);
      
      // Create payment record
      const paymentData = {
        id: paymentId,
        bookingId: bookingDetails.bookingId,
        userId: bookingDetails.userId,
        providerId: bookingDetails.providerId,
        amount: bookingDetails.amount,
        currency: 'INR',
        paymentMethod: selectedPaymentMethod?.name || selectedMethod,
        paymentGateway: selectedPaymentMethod?.gateway || selectedMethod,
        transactionId: `TXN_${Date.now()}`,
        gatewayPaymentId: `${selectedMethod.toUpperCase()}_${Date.now()}`,
        status: 'Processing'
      };

      // For demo purposes, simulate different payment scenarios
      setTimeout(() => {
        const shouldSucceed = Math.random() > 0.1; // 90% success rate
        
        if (shouldSucceed) {
          // Update payment status to successful
          paymentMutation.mutate({
            ...paymentData,
            status: 'Successful'
          });
        } else {
          paymentMutation.mutate({
            ...paymentData,
            status: 'Failed',
            failureReason: 'Transaction declined by bank'
          });
        }
      }, 2000);

    } catch (error) {
      setIsProcessing(false);
      showNotification('Payment processing error', 'error');
    }
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
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="p-6 border-b bg-gray-50">
          <div className="text-sm text-gray-600">Payment for</div>
          <div className="font-semibold text-gray-900">{bookingDetails.serviceName}</div>
          <div className="text-2xl font-bold text-primary mt-2">
            {formatAmountInINR(bookingDetails.amount)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Amount in Indian Rupees</div>
        </div>

        {/* Payment Methods */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Choose Payment Method</h3>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {method.icon}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 border-2 rounded-full ${
                        selectedMethod === method.id 
                          ? 'border-primary bg-primary' 
                          : 'border-gray-300'
                      }`}>
                        {selectedMethod === method.id && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-[1px]"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* UPI ID Input */}
          {selectedMethod === 'upi' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
            </div>
          )}

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </div>
            ) : (
              `Pay ${formatAmountInINR(bookingDetails.amount)}`
            )}
          </button>

          {/* Security Note */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <div className="flex items-center justify-center mb-1">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              Secured by 256-bit SSL encryption
            </div>
            Your payment information is secure and encrypted
          </div>
        </div>
      </div>
    </div>
  );
}