import { useState, useEffect } from 'react';
import { CreditCard, Building2, QrCode, Copy, CheckCircle } from 'lucide-react';
import { useNotification } from '@/components/ui/notification';

export default function PaymentInfo() {
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [copied, setCopied] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    // Load payment configuration
    const merchantUpiId = localStorage.getItem('merchantUpiId');
    const merchantName = localStorage.getItem('merchantName');
    const bankDetails = localStorage.getItem('bankDetails');
    const razorpayKeyId = localStorage.getItem('razorpayKeyId');

    if (merchantUpiId) {
      setPaymentConfig({
        merchantUpiId,
        merchantName: merchantName || 'ServiceHub',
        bankDetails: bankDetails ? JSON.parse(bankDetails) : null,
        razorpayKeyId
      });
    }
  }, []);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      showNotification('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(''), 2000);
    });
  };

  if (!paymentConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Configure your payment details in the admin panel to start receiving payments.
          </p>
          <button
            onClick={() => window.location.href = '/admin'}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Configuration</h1>
          <p className="text-gray-600">Your current payment setup for receiving customer payments</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* UPI Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <QrCode className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">UPI Payment Setup</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant UPI ID</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={paymentConfig.merchantUpiId}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(paymentConfig.merchantUpiId, 'upi')}
                    className="ml-2 p-2 text-gray-500 hover:text-primary transition-colors"
                  >
                    {copied === 'upi' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Name</label>
                <input
                  type="text"
                  value={paymentConfig.merchantName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Payment Flow:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>1. Customer selects UPI payment</li>
                  <li>2. Payment app opens with your UPI ID</li>
                  <li>3. Customer completes payment</li>
                  <li>4. Money goes directly to your account</li>
                  <li>5. You receive instant notification</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Razorpay Configuration */}
          {paymentConfig.razorpayKeyId && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Building2 className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Razorpay Integration</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key ID</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={paymentConfig.razorpayKeyId.substring(0, 12) + '...'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(paymentConfig.razorpayKeyId, 'razorpay')}
                      className="ml-2 p-2 text-gray-500 hover:text-primary transition-colors"
                    >
                      {copied === 'razorpay' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Razorpay Benefits:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Accept cards, UPI, wallets</li>
                    <li>• Auto-settlement to bank</li>
                    <li>• Payment success confirmation</li>
                    <li>• Transaction dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {paymentConfig.bankDetails && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Building2 className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder</label>
                  <input
                    type="text"
                    value={paymentConfig.bankDetails.accountHolderName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={`****${paymentConfig.bankDetails.accountNumber.slice(-4)}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(paymentConfig.bankDetails.accountNumber, 'account')}
                      className="ml-2 p-2 text-gray-500 hover:text-primary transition-colors"
                    >
                      {copied === 'account' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={paymentConfig.bankDetails.ifscCode}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(paymentConfig.bankDetails.ifscCode, 'ifsc')}
                      className="ml-2 p-2 text-gray-500 hover:text-primary transition-colors"
                    >
                      {copied === 'ifsc' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Receive Payments</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Customer Makes Payment</h4>
                  <p className="text-sm text-gray-600">When customers book services, they pay using their preferred method</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Instant Payment</h4>
                  <p className="text-sm text-gray-600">Money goes directly to your UPI account or bank account</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Service Confirmation</h4>
                  <p className="text-sm text-gray-600">Booking is confirmed and you can provide the service</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Make sure your UPI ID is active and linked to your bank account. 
                  Test the payment flow before going live with customers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/admin'}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}