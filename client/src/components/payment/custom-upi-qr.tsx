import React, { useState } from 'react';
import { QrCode, Copy, CheckCircle, Smartphone } from 'lucide-react';
import { useNotification } from '@/components/ui/notification';
import customQRImage from '@assets/image_1754906543964.png';

interface CustomUpiQRProps {
  amount: string;
  serviceName: string;
  onPaymentComplete: () => void;
}

export default function CustomUpiQR({ amount, serviceName, onPaymentComplete }: CustomUpiQRProps) {
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showNotification } = useNotification();

  // UPI payment string with your UPI ID (you can update this to your actual UPI ID)
  const upiString = `upi://pay?pa=servicehub@upi&pn=ServiceHub&am=${amount}&cu=INR&tn=Payment for ${serviceName}`;

  const copyUpiString = () => {
    navigator.clipboard.writeText(upiString);
    setCopied(true);
    showNotification('UPI payment string copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentConfirmation = () => {
    setPaymentConfirmed(true);
    showNotification('Payment confirmed! Processing...', 'success');
    // In a real implementation, you'd verify the payment through your backend
    setTimeout(() => {
      onPaymentComplete();
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="text-center mb-6">
        <QrCode className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900">Pay via UPI QR Code</h3>
        <p className="text-sm text-gray-600">Scan the QR code with any UPI app</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* Custom QR Code Image */}
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
          <img 
            src={customQRImage} 
            alt="UPI QR Code" 
            className="w-48 h-48 object-contain rounded"
          />
        </div>

        {/* Payment Amount */}
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <p className="text-lg font-semibold text-blue-900">
            Amount: ₹{amount}
          </p>
        </div>

        {/* UPI Apps */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Supported UPI Apps</p>
          <div className="flex justify-center space-x-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-purple-600">GPay</span>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">PhonePe</span>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-orange-600">Paytm</span>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-green-600">BHIM</span>
            </div>
          </div>
        </div>

        {/* Copy UPI String Button */}
        <button
          onClick={copyUpiString}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-sm text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-700">Copy UPI Link</span>
            </>
          )}
        </button>

        {/* Instructions */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 w-full">
          <div className="flex items-start">
            <Smartphone className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">How to pay:</p>
              <ol className="text-yellow-700 space-y-1 text-xs">
                <li>1. Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                <li>2. Scan the QR code above</li>
                <li>3. Verify the amount (₹{amount})</li>
                <li>4. Complete the payment</li>
                <li>5. Click "Payment Done" below after successful payment</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Payment Confirmation */}
        {!paymentConfirmed ? (
          <button
            onClick={handlePaymentConfirmation}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Payment Done
          </button>
        ) : (
          <div className="w-full bg-green-100 text-green-800 py-3 px-4 rounded-lg font-medium text-center border border-green-300">
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Payment Confirmed - Processing...
          </div>
        )}
      </div>
    </div>
  );
}