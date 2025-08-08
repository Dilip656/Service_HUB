import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { bookingAPI } from '@/lib/api';
import { useNotification } from '@/components/ui/notification';
import { PaymentModal } from '@/components/payment';
import { queryClient } from '@/lib/queryClient';
import { z } from 'zod';

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Please enter your full name'),
  customerPhone: z.string().min(10, 'Please enter a valid phone number').max(15, 'Phone number is too long'),
  serviceAddress: z.string().min(10, 'Please provide a complete address'),
  bookingDate: z.string().min(1, 'Please select a date'),
  bookingTime: z.string().min(1, 'Please select a time'),
  estimatedHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Please select estimated hours'),
  requirements: z.string().optional(),
});

export default function Booking() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  const [providerName, setProviderName] = useState('');
  const [providerRate, setProviderRate] = useState('');
  const [formErrors, setFormErrors] = useState<any>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [estimatedAmount, setEstimatedAmount] = useState('0');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('currentProviderName') || 'Service Provider';
    const rate = sessionStorage.getItem('currentProviderRate') || '100';
    setProviderName(name);
    setProviderRate(rate);
    updateEstimatedAmount(rate, '2'); // Default 2 hours

    // Pre-populate customer details if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
    }
  }, []);

  const bookingMutation = useMutation({
    mutationFn: bookingAPI.createBooking,
    onSuccess: (data) => {
      showNotification('Booking created successfully!', 'success');
      
      // Invalidate and refetch booking queries for both user and provider dashboards
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/user', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/provider', data.providerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] }); // Admin dashboard
      
      // Store booking data for payment
      setBookingData({
        bookingId: data.id,
        providerId: data.providerId,
        userId: data.userId,
        amount: estimatedAmount,
        serviceName: data.serviceName
      });
      setShowPaymentModal(true);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Booking failed', 'error');
    },
  });

  const updateEstimatedAmount = (rate: string, hours: string) => {
    const rateNum = parseFloat(rate) || 0;
    const hoursNum = parseFloat(hours) || 0;
    const total = rateNum * hoursNum;
    setEstimatedAmount(total.toString());
  };

  const handleHoursChange = (hours: string) => {
    setEstimatedHours(hours);
    updateEstimatedAmount(providerRate, hours);
  };

  const handlePaymentSuccess = () => {
    sessionStorage.removeItem('currentProviderId');
    sessionStorage.removeItem('currentProviderName');
    sessionStorage.removeItem('currentProviderRate');
    sessionStorage.removeItem('currentService');
    setLocation('/services');
  };

  const formatAmountInINR = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated first
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      showNotification('Please sign in to book a service', 'error');
      setLocation('/auth?mode=signin&redirect=booking');
      return;
    }

    const user = JSON.parse(userStr);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      bookingSchema.parse(data);
      setFormErrors({});

      const providerId = sessionStorage.getItem('currentProviderId');
      const serviceName = sessionStorage.getItem('currentService');
      
      if (!providerId || !serviceName) {
        showNotification('Missing booking information. Please try again.', 'error');
        return;
      }

      bookingMutation.mutate({
        userId: user.id,
        providerId: parseInt(providerId),
        customerName: data.customerName as string,
        customerPhone: data.customerPhone as string,
        serviceName,
        bookingDate: data.bookingDate as string,
        bookingTime: data.bookingTime as string,
        serviceAddress: data.serviceAddress as string,
        requirements: data.requirements as string,
        status: 'Pending',
        amount: estimatedAmount
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(errors);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/providers">
            <button className="flex items-center text-white/80 hover:text-white mb-6 transition-colors hover-lift">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Providers
            </button>
          </Link>
          <div className="text-center animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Book Your Service
            </h1>
            <p className="text-xl opacity-90">
              Complete your booking details and secure payment
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Service Details Card */}
        <div className="mb-8 animate-slide-up">
          <div className="bg-white rounded-3xl shadow-card p-8 hover-lift transition-all">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center mr-3">
                <i className="fas fa-tools text-white"></i>
              </div>
              Service Details
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-clipboard-list text-primary"></i>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Service</div>
                  <div className="text-xl font-semibold text-primary">
                    {sessionStorage.getItem('currentService') || 'Selected Service'}
                  </div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-user-check text-green-600"></i>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Provider</div>
                  <div className="text-xl font-semibold text-gray-900">{providerName}</div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-rupee-sign text-yellow-600"></i>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Hourly Rate</div>
                  <div className="text-xl font-semibold text-gray-900">₹{providerRate}/hour</div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-calculator text-purple-600"></i>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimated Total</div>
                  <div className="text-xl font-semibold text-primary">{formatAmountInINR(estimatedAmount)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-3xl shadow-card p-8 animate-scale-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center mr-3">
              <i className="fas fa-edit text-white"></i>
            </div>
            Booking Information
          </h2>
        
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-xl font-bold text-primary flex items-center">
                <i className="fas fa-handshake text-primary mr-3"></i>
                Booking with: {providerName}
              </h3>
              <p className="text-gray-600 mt-2">Service details will be confirmed by the provider</p>
            </div>
          
          {/* Customer Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <i className="fas fa-user text-primary mr-2"></i>
                Your Full Name
              </label>
              <input
                type="text"
                name="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-lg transition-all hover:border-gray-300 bg-gray-50/50"
                placeholder="Enter your full name"
                data-testid="input-customer-name"
              />
              {formErrors.customerName && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {formErrors.customerName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <i className="fas fa-phone text-primary mr-2"></i>
                Phone Number
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-lg transition-all hover:border-gray-300 bg-gray-50/50"
                placeholder="Enter your phone number"
                data-testid="input-customer-phone"
              />
              {formErrors.customerPhone && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {formErrors.customerPhone}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Address</label>
            <textarea
              name="serviceAddress"
              required
              rows={3}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Enter the complete address where service is needed"
            />
            {formErrors.serviceAddress && (
              <p className="text-red-500 text-sm mt-1">{formErrors.serviceAddress}</p>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
              <input
                type="date"
                name="bookingDate"
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
              {formErrors.bookingDate && (
                <p className="text-red-500 text-sm mt-1">{formErrors.bookingDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
              <select
                name="bookingTime"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              >
                <option value="">Select time</option>
                <option value="morning">Morning (9 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                <option value="evening">Evening (5 PM - 8 PM)</option>
              </select>
              {formErrors.bookingTime && (
                <p className="text-red-500 text-sm mt-1">{formErrors.bookingTime}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Hours</label>
            <select
              name="estimatedHours"
              value={estimatedHours}
              onChange={(e) => handleHoursChange(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="8">8 hours (Full day)</option>
            </select>
            {formErrors.estimatedHours && (
              <p className="text-red-500 text-sm mt-1">{formErrors.estimatedHours}</p>
            )}
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Rate: ₹{providerRate}/hour</div>
              <div className="text-lg font-semibold text-primary">
                Estimated Total: {formatAmountInINR(estimatedAmount)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Final amount may vary based on actual work done</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Requirements</label>
            <textarea
              name="requirements"
              rows={4}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Describe your specific requirements, any special instructions, or details about the work needed..."
            />
            {formErrors.requirements && (
              <p className="text-red-500 text-sm mt-1">{formErrors.requirements}</p>
            )}
          </div>
          
            <button
              type="submit"
              disabled={bookingMutation.isPending}
              className="w-full bg-gradient-primary text-white py-5 px-6 rounded-2xl text-xl font-bold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-lift flex items-center justify-center"
              data-testid="button-book-service"
            >
              {bookingMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Creating Booking...
                </>
              ) : (
                <>
                  <i className="fas fa-calendar-check mr-3"></i>
                  Book Service for {formatAmountInINR(estimatedAmount)}
                </>
              )}
            </button>
            <p className="text-center text-gray-600 text-sm mt-4 flex items-center justify-center">
              <i className="fas fa-shield-alt text-green-500 mr-2"></i>
              Secure booking with instant payment processing
            </p>
          </form>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && bookingData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingDetails={bookingData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
