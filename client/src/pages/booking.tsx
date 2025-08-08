import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { bookingAPI } from '@/lib/api';
import { useNotification } from '@/components/ui/notification';
import { PaymentModal } from '@/components/payment';
import { z } from 'zod';

const bookingSchema = z.object({
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

  useEffect(() => {
    const name = sessionStorage.getItem('currentProviderName') || 'Service Provider';
    const rate = sessionStorage.getItem('currentProviderRate') || '500';
    setProviderName(name);
    setProviderRate(rate);
    updateEstimatedAmount(rate, '2'); // Default 2 hours
  }, []);

  const bookingMutation = useMutation({
    mutationFn: bookingAPI.createBooking,
    onSuccess: (data) => {
      showNotification('Booking created successfully!', 'success');
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

      // Get current user (in a real app, this would be from authentication)
      const user = JSON.parse(localStorage.getItem('user') || '{"id": 1}');

      bookingMutation.mutate({
        userId: user.id,
        providerId: parseInt(providerId),
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
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/providers">
        <button className="flex items-center text-gray-600 hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Providers
        </button>
      </Link>
      
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Service</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-primary">Booking with: {providerName}</h3>
            <p className="text-gray-600">Service details will be confirmed by the provider</p>
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
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {bookingMutation.isPending ? 'Confirming Booking...' : 'Confirm Booking'}
          </button>
        </form>
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
