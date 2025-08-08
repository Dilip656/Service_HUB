// Payment utility functions
export const generateUPIQRCode = (
  merchantUpiId: string,
  amount: string,
  transactionId: string,
  serviceName: string
): string => {
  const upiUrl = `upi://pay?pa=${merchantUpiId}&pn=ServiceHub&mc=5411&tid=${transactionId}&am=${amount}&cu=INR&tn=Payment for ${serviceName}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
};

export const validateUpiId = (upiId: string): boolean => {
  const upiRegex = /^[a-zA-Z0-9.-]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
};

export const formatPaymentAmount = (amount: string): string => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(num);
};

export const getPaymentAppName = (method: string): string => {
  const appNames: { [key: string]: string } = {
    phonepe: 'PhonePe',
    paytm: 'Paytm',
    googlepay: 'Google Pay',
    upi: 'UPI App'
  };
  return appNames[method] || 'Payment App';
};

export const createPaymentDeepLink = (
  method: string,
  merchantUpiId: string,
  amount: string,
  orderId: string,
  serviceName: string,
  userUpiId?: string
): string => {
  const transactionNote = `Payment for ${serviceName}`;
  
  const baseParams = `pa=${merchantUpiId}&pn=ServiceHub&mc=5411&tid=${orderId}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  
  switch (method) {
    case 'phonepe':
      return `phonepe://pay?${baseParams}`;
    case 'paytm':
      return `paytmmp://pay?${baseParams}`;
    case 'googlepay':
      return `tez://upi/pay?${baseParams}`;
    case 'upi':
      return `upi://pay?${baseParams}`;
    default:
      return `upi://pay?${baseParams}`;
  }
};