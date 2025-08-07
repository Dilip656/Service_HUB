import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Shield, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { providerAPI } from '@/lib/api';
import ProviderDetailModal from '@/components/modals/provider-detail';
import { ServiceProvider } from '@shared/schema';

export default function Providers() {
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const serviceName = sessionStorage.getItem('currentService') || '';

  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['/api/providers', { service: serviceName }],
    queryFn: async () => {
      if (!serviceName) return [];
      const providers = await providerAPI.getProviders({ service: serviceName });
      return providers;
    },
    enabled: !!serviceName,
  });

  const handleProviderClick = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProvider(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <i className="fas fa-exclamation-triangle text-6xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Error loading providers</h3>
          <p className="text-gray-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/services">
        <button className="flex items-center text-gray-600 hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Services
        </button>
      </Link>
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {serviceName} Service Providers
        </h2>
        <p className="text-gray-600">Choose from verified professionals in your area</p>
      </div>

      {!providers || providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <i className="fas fa-search text-6xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No providers found</h3>
          <p className="text-gray-500">
            No verified providers available for {serviceName} at the moment.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {providers.map((provider: ServiceProvider) => {
            const kycBadge = provider.kycVerified ? (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                <Shield className="w-3 h-3 mr-1" />
                KYC Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                <Clock className="w-3 h-3 mr-1" />
                KYC Pending
              </span>
            );

            return (
              <div
                key={provider.id}
                onClick={() => handleProviderClick(provider)}
                className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                        <span className="text-primary font-semibold">
                          {provider.ownerName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {provider.businessName}
                        </h3>
                        <p className="text-gray-600">{provider.ownerName}</p>
                      </div>
                    </div>
                    {kycBadge}
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 text-sm line-clamp-2">{provider.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-medium">
                        {provider.rating ? Number(provider.rating).toFixed(1) : 'New'}
                      </span>
                      {provider.reviewCount && provider.reviewCount > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{provider.reviewCount} reviews</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {provider.experience} years exp.
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-primary">
                      ${provider.hourlyRate}/hour
                    </div>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProviderDetailModal
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
