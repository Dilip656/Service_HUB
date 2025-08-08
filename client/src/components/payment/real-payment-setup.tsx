import { useState } from 'react';
import { X, Upload, CreditCard, Building2 } from 'lucide-react';
import { useNotification } from '@/components/ui/notification';

interface RealPaymentSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: (paymentConfig: PaymentConfig) => void;
}

interface PaymentConfig {
  merchantUpiId: string;
  merchantName: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
}

export default function RealPaymentSetup({ isOpen, onClose, onSetupComplete }: RealPaymentSetupProps) {
  const [activeTab, setActiveTab] = useState<'upi' | 'razorpay' | 'bank'>('upi');
  const [config, setConfig] = useState<PaymentConfig>({
    merchantUpiId: '',
    merchantName: 'ServiceHub'
  });
  const { showNotification } = useNotification();

  const handleSubmit = () => {
    if (activeTab === 'upi' && !config.merchantUpiId) {
      showNotification('Please enter your UPI ID', 'error');
      return;
    }

    if (activeTab === 'razorpay' && (!config.razorpayKeyId || !config.razorpayKeySecret)) {
      showNotification('Please enter Razorpay credentials', 'error');
      return;
    }

    if (activeTab === 'bank' && !config.bankDetails?.accountNumber) {
      showNotification('Please enter bank details', 'error');
      return;
    }

    onSetupComplete(config);
    showNotification('Payment configuration saved successfully!', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Setup Real Payment Gateway</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('upi')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'upi'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              UPI Setup
            </button>
            <button
              onClick={() => setActiveTab('razorpay')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'razorpay'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Razorpay Setup
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'bank'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Bank Details
            </button>
          </div>

          {/* UPI Setup */}
          {activeTab === 'upi' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Setup UPI Payment</h3>
                <p className="text-gray-600 mb-4">
                  Enter your UPI ID where you want to receive payments. Customers will pay directly to this UPI ID.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your UPI ID *
                </label>
                <input
                  type="text"
                  value={config.merchantUpiId}
                  onChange={(e) => setConfig({ ...config, merchantUpiId: e.target.value })}
                  placeholder="yourname@paytm or 9876543210@ybl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
                <div className="text-xs text-gray-500 mt-1">
                  This is where customer payments will be sent. Make sure it's active and belongs to you.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business/Merchant Name
                </label>
                <input
                  type="text"
                  value={config.merchantName}
                  onChange={(e) => setConfig({ ...config, merchantName: e.target.value })}
                  placeholder="Your Business Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How UPI Payments Work:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Customer selects UPI payment option</li>
                  <li>• Payment app opens with your UPI ID pre-filled</li>
                  <li>• Customer completes payment in their app</li>
                  <li>• Money goes directly to your UPI account</li>
                  <li>• Customer returns to confirm payment</li>
                </ul>
              </div>
            </div>
          )}

          {/* Razorpay Setup */}
          {activeTab === 'razorpay' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Setup Razorpay Integration</h3>
                <p className="text-gray-600 mb-4">
                  For professional payment processing, integrate with Razorpay. You'll need to create a Razorpay account first.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razorpay Key ID *
                </label>
                <input
                  type="text"
                  value={config.razorpayKeyId || ''}
                  onChange={(e) => setConfig({ ...config, razorpayKeyId: e.target.value })}
                  placeholder="rzp_live_xxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razorpay Key Secret *
                </label>
                <input
                  type="password"
                  value={config.razorpayKeySecret || ''}
                  onChange={(e) => setConfig({ ...config, razorpayKeySecret: e.target.value })}
                  placeholder="Your Razorpay Key Secret"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Razorpay Benefits:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Accept credit/debit cards, UPI, wallets</li>
                  <li>• Automatic settlement to your bank account</li>
                  <li>• Payment confirmation and receipts</li>
                  <li>• Dashboard for tracking payments</li>
                  <li>• Lower transaction failure rates</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You need to sign up at razorpay.com and complete KYC verification to get live keys.
                  Test keys can be used for development.
                </p>
              </div>
            </div>
          )}

          {/* Bank Details */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Bank Account Details</h3>
                <p className="text-gray-600 mb-4">
                  Provide your bank details for manual payment verification and settlements.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={config.bankDetails?.accountHolderName || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    bankDetails: { 
                      ...config.bankDetails!, 
                      accountHolderName: e.target.value 
                    }
                  })}
                  placeholder="Your Full Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={config.bankDetails?.accountNumber || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    bankDetails: { 
                      ...config.bankDetails!, 
                      accountNumber: e.target.value 
                    }
                  })}
                  placeholder="Your Bank Account Number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  value={config.bankDetails?.ifscCode || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    bankDetails: { 
                      ...config.bankDetails!, 
                      ifscCode: e.target.value.toUpperCase() 
                    }
                  })}
                  placeholder="ABCD0123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Save Configuration
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}