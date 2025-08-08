import { useState } from 'react';
import { X, Star, Shield, Clock, Phone, Mail, MapPin, DollarSign } from 'lucide-react';
import { useLocation } from 'wouter';
import { ServiceProvider } from '@shared/schema';
import { useNotification } from '@/components/ui/notification';

interface ProviderDetailModalProps {
  provider: ServiceProvider | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProviderDetailModal({ provider, isOpen, onClose }: ProviderDetailModalProps) {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();

  if (!isOpen || !provider) return null;

  const handleBookNow = () => {
    // Check if user is authenticated before booking
    const userStr = localStorage.getItem('user');
    console.log('=== AUTHENTICATION CHECK ===');
    console.log('User data from localStorage:', userStr);
    console.log('Is user null/undefined?', !userStr);
    
    if (!userStr) {
      console.log('❌ User not authenticated, triggering notification and redirect');
      try {
        showNotification('Please sign in to book a service', 'error');
        console.log('✅ Notification triggered successfully');
      } catch (e) {
        console.error('❌ Notification failed:', e);
        alert('Please sign in to book a service'); // Fallback
      }
      onClose();
      setLocation('/auth?mode=signin&redirect=booking');
      console.log('✅ Redirecting to auth page');
      return;
    }
    
    console.log('✅ User authenticated, proceeding to booking');

    sessionStorage.setItem('currentProviderId', provider.id.toString());
    sessionStorage.setItem('currentProviderName', provider.businessName);
    sessionStorage.setItem('currentProviderRate', provider.hourlyRate);
    sessionStorage.setItem('currentService', provider.serviceName);
    onClose();
    setLocation('/booking');
  };

  const availabilityDays = provider.availability?.map(day => 
    day.charAt(0).toUpperCase() + day.slice(1)
  ).join(', ') || 'Not specified';

  const kycStatusBadge = provider.kycVerified ? (
    <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
      <Shield className="w-4 h-4 mr-2" />
      KYC Verified
    </span>
  ) : (
    <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
      <Clock className="w-4 h-4 mr-2" />
      KYC Pending
    </span>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Provider Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-start space-x-6 mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-2xl">
                {provider.ownerName.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">{provider.businessName}</h2>
                {kycStatusBadge}
              </div>
              <p className="text-gray-600 text-lg">{provider.ownerName}</p>
              <div className="flex items-center mt-2 text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{provider.location}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <i className="fas fa-tools text-primary mr-3"></i>
                    <span><strong>Service:</strong> {provider.serviceName}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-primary mr-3" />
                    <span><strong>Experience:</strong> {provider.experience} years</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-primary mr-3" />
                    <span><strong>Rate:</strong> ${provider.hourlyRate}/hour</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-primary mr-3" />
                    <span>{provider.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-primary mr-3" />
                    <span>{provider.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating & Reviews</h3>
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400 text-lg mr-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(Number(provider.rating) || 0) ? 'fill-current' : ''
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {provider.rating || 'New'}
                  </span>
                </div>
                {provider.reviewCount ? (
                  <p className="text-gray-600">{provider.reviewCount} reviews</p>
                ) : (
                  <p className="text-gray-600">No reviews yet</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                <p className="text-gray-700">{availabilityDays}</p>
              </div>

              {provider.kycVerified ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Status</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center text-green-700 mb-2">
                      <Shield className="w-5 h-5 mr-2" />
                      <span className="font-medium">Fully Verified Provider</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>✓ Identity verified</p>
                      <p>✓ Business license verified</p>
                      <p>✓ Background check completed</p>
                      {provider.kycDocuments && (provider.kycDocuments as any).verified_at && (
                        <p className="mt-2">
                          Verified on {new Date((provider.kycDocuments as any).verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Status</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center text-yellow-700 mb-2">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-medium">KYC Verification Pending</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      This provider's verification is currently in progress.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About {provider.businessName}</h3>
            <p className="text-gray-700 leading-relaxed">{provider.description}</p>
          </div>

          {provider.kycVerified ? (
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleBookNow}
                className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Book Now
              </button>
              <button className="text-primary border border-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/5 transition-colors">
                Send Message
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                This provider is currently undergoing verification and is not available for booking.
              </p>
              <button
                className="bg-gray-300 text-gray-600 px-8 py-3 rounded-lg font-semibold cursor-not-allowed"
                disabled
              >
                Booking Unavailable
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
