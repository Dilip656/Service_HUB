import { useNotification } from '@/components/ui/notification';

// Enhanced payment integration with Razorpay for more realistic payment flow
export const initializeRazorpayPayment = (
  paymentDetails: {
    amount: string;
    orderId: string;
    serviceName: string;
    userEmail?: string;
    userPhone?: string;
    razorpayKeyId?: string;
  },
  onSuccess: () => void,
  onFailure: (error: string) => void
) => {
  // Razorpay configuration
  const options = {
    key: paymentDetails.razorpayKeyId || 'rzp_test_1234567890', // Use real key if available
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
    // Check if Razorpay is already loaded
    if (typeof (window as any).Razorpay !== 'undefined') {
      resolve(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded');
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    document.head.appendChild(script);
  });
};