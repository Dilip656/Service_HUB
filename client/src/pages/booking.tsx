import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { bookingAPI } from '@/lib/api';
import { useNotification } from '@/components/ui/notification';
import { z } from 'zod';

const bookingSchema = z.object({
  serviceAddress: z.string().min(10, 'Please provide a complete address'),
  bookingDate: z.string().min(1, 'Please select a date'),
  bookingTime: z.string().min(1, 'Please select a time'),
  requirements: z.string().optional(),
});

export default function Booking() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  const [providerName, setProviderName] = useState('');
  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    const name = sessionStorage.getItem('currentProviderName') || 'Service Provider';
    setProviderName(name);
  }, []);

  const bookingMutation = useMutation({
    mutationFn: bookingAPI.createBooking,
    onSuccess: () => {
      showNotification('Booking request submitted successfully!', 'success');
      sessionStorage.removeItem('currentProviderId');
      sessionStorage.removeItem('currentProviderName');
      setLocation('/services');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Booking failed', 'error');
    },
  });

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
        amount: '0', // Will be calculated by provider
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
    </div>
  );
}
