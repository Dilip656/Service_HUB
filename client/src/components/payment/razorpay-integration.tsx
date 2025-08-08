import { useNotification } from '@/components/ui/notification';

// Enhanced payment integration with Razorpay for more realistic payment flow
export const initializeRazorpayPayment = (
  paymentDetails: {
    amount: string;
    orderId: string;
    serviceName: string;
    userEmail?: string;
    userPhone?: string;
  },
  onSuccess: () => void,
  onFailure: (error: string) => void
) => {
  // Razorpay configuration
  const options = {
    key: 'rzp_test_1234567890', // Demo key - in production, use actual key
    amount: parseFloat(paymentDetails.amount) * 100, // Amount in paise
    currency: 'INR',
    name: 'ServiceHub',
    description: `Payment for ${paymentDetails.serviceName}`,
    order_id: paymentDetails.orderId,
    handler: function (response: any) {
      // Payment success
      console.log('Payment successful:', response);
      onSuccess();
    },
    prefill: {
      email: paymentDetails.userEmail || 'user@servicehub.com',
      contact: paymentDetails.userPhone || '9999999999',
    },
    theme: {
      color: '#007bff',
    },
    modal: {
      ondismiss: function () {
        onFailure('Payment cancelled by user');
      },
    },
  };

  // Check if Razorpay is loaded
  if (typeof (window as any).Razorpay !== 'undefined') {
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } else {
    // Fallback to UPI deep links if Razorpay is not available
    const upiUrl = `upi://pay?pa=servicehub@upi&pn=ServiceHub&mc=0000&tid=${paymentDetails.orderId}&am=${paymentDetails.amount}&cu=INR&tn=Payment for ${paymentDetails.serviceName}`;
    window.location.href = upiUrl;
  }
};

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};