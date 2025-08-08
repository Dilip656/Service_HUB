# Razorpay Payment Gateway Integration

This document describes the complete Razorpay payment gateway integration implemented for ServiceHub.

## Overview

The integration provides secure, real-time payment processing using Razorpay's Node.js SDK with proper signature verification and database integration.

## Backend Implementation

### Environment Variables
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID (starts with rzp_test_ or rzp_live_)
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret for API authentication

### API Endpoints

#### 1. Create Order - `POST /api/razorpay/create-order`

Creates a new order with Razorpay for payment processing.

**Request Body:**
```json
{
  "amount": 100,           // Amount in INR (will be converted to paise)
  "currency": "INR",       // Currency (optional, defaults to INR)
  "receipt": "receipt_123", // Receipt ID (optional, auto-generated)
  "notes": {}              // Additional notes (optional)
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "order_R2wjTJ4AQMfage",
  "amount": 10000,         // Amount in paise
  "currency": "INR",
  "key": "rzp_test_HdSBkh1fHvhwD8"
}
```

#### 2. Verify Payment - `POST /api/razorpay/verify-payment`

Verifies payment authenticity using signature verification.

**Request Body:**
```json
{
  "razorpay_order_id": "order_R2wjTJ4AQMfage",
  "razorpay_payment_id": "pay_R2wjTJ4AQMfage",
  "razorpay_signature": "signature_hash",
  "bookingId": 123,        // Optional: for booking integration
  "userId": 456,           // Optional: for booking integration
  "providerId": 789        // Optional: for booking integration
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "payment_id": "pay_R2wjTJ4AQMfage",
  "order_id": "order_R2wjTJ4AQMfage",
  "amount": 100,           // Amount in INR
  "currency": "INR",
  "status": "captured"
}
```

#### 3. Get Razorpay Key - `GET /api/razorpay/key`

Returns the public Razorpay key for frontend initialization.

**Response:**
```json
{
  "key": "rzp_test_HdSBkh1fHvhwD8"
}
```

## Frontend Implementation

### Payment Test Page

Located at `/payment-test`, this page provides a complete payment testing interface with:

- Amount input with validation
- Razorpay Checkout.js integration
- Real-time payment status updates
- Test card details for safe testing
- Success/failure handling with detailed information

### Key Features

1. **Script Loading**: Dynamically loads Razorpay Checkout.js
2. **Order Creation**: Creates order via backend API
3. **Payment Modal**: Opens Razorpay's secure payment interface
4. **Signature Verification**: Verifies payment authenticity
5. **Database Integration**: Automatically saves payment records
6. **Status Updates**: Updates booking status on successful payment

### Test Card Details

For testing in Razorpay's test mode:
- **Card Number:** 4111 1111 1111 1111
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **Name:** Any name

## Database Integration

### Payment Record Storage

Successful payments are automatically stored in the `payments` table with:
- Payment ID from Razorpay
- Order ID and transaction details
- User and provider information
- Amount and currency
- Payment method and gateway
- Transaction status and timestamps

### Booking Status Updates

When a payment is successful:
1. Payment record is created in database
2. Associated booking status is updated to "Confirmed"
3. Provider receives booking notification

## Security Features

### Signature Verification

All payments are verified using HMAC SHA256 signature verification:

```javascript
const body = razorpay_order_id + "|" + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
  .update(body.toString())
  .digest("hex");
```

### Environment Protection

- API keys are stored as environment variables
- Keys never exposed to client-side code
- Secure HTTPS communication in production

## Error Handling

### Backend Errors
- Invalid amount validation
- Order creation failures
- Payment verification failures
- Database operation errors

### Frontend Errors
- Script loading failures
- Network connectivity issues
- Payment gateway errors
- User cancellation handling

## Integration with Existing Features

### Booking System Integration

The payment system integrates seamlessly with the existing booking workflow:

1. User selects service and provider from `/services` page
2. User fills booking details on `/booking` page
3. After successful booking creation, Razorpay payment modal opens automatically
4. User completes payment through Razorpay Checkout.js interface
5. On successful payment:
   - Payment is verified with signature authentication
   - Booking status is updated to "Confirmed"
   - Payment record is saved to database
   - User is redirected to dashboard
   - Provider receives booking notification

### Admin Dashboard

Admins can monitor all payments through:
- Payment history with full transaction details
- Revenue tracking and analytics
- Failed payment monitoring
- Refund management (when implemented)

## Testing

### Local Testing

1. Navigate to `/payment-test`
2. Enter test amount (minimum ₹1)
3. Click "Pay Now"
4. Use test card details in Razorpay modal
5. Verify success/failure handling

### Production Checklist

- [ ] Replace test keys with live keys
- [ ] Enable webhooks for payment notifications
- [ ] Set up proper SSL certificates
- [ ] Configure payment capture settings
- [ ] Test with real bank cards
- [ ] Set up monitoring and alerts

## API Rate Limits

Razorpay API has the following limits:
- 1000 requests per minute for most endpoints
- 100 requests per minute for payment capture

## Support

For issues with Razorpay integration:
1. Check Razorpay Dashboard for transaction details
2. Review server logs for error messages
3. Verify webhook configurations
4. Contact Razorpay support for payment issues

## Next Steps

Potential enhancements:
1. **Webhooks**: Implement payment status webhooks
2. **Refunds**: Add refund processing capability
3. **Subscriptions**: Support recurring payments
4. **Multi-currency**: Support international payments
5. **UPI Deep Links**: Direct UPI app integration
6. **Payment Analytics**: Advanced reporting dashboard