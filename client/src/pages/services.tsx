import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { providerAPI, servicesAPI } from '@/lib/api';

// Category metadata for icons and display names
const categoryMetadata = {
  home: { name: 'Home & Property', icon: 'fas fa-home' },
  events: { name: 'Events & Celebrations', icon: 'fas fa-calendar' },
  personal: { name: 'Personal & Lifestyle', icon: 'fas fa-user' },
  business: { name: 'Business Services', icon: 'fas fa-briefcase' }
};

// Service icons mapping
const serviceIcons: { [key: string]: string } = {
  'Plumbing': 'fas fa-wrench',
  'Electrical Work': 'fas fa-bolt',
  'Painting': 'fas fa-paint-roller',
  'Carpentry': 'fas fa-hammer',
  'Event Planning': 'fas fa-calendar-alt',
  'Photography': 'fas fa-camera',
  'Catering': 'fas fa-utensils',
  'Home Cleaning': 'fas fa-broom',
  'Personal Training': 'fas fa-dumbbell',
  'Pet Grooming': 'fas fa-cut',
  'IT Support': 'fas fa-laptop',
  'Graphic Design': 'fas fa-paint-brush',
  'Web Development': 'fas fa-code',
  'Accounting': 'fas fa-calculator',
  'Legal Consulting': 'fas fa-gavel',
  'Fitness Training': 'fas fa-dumbbell',
  'Tutoring': 'fas fa-book',
  'Beauty Services': 'fas fa-cut',
  'Pet Care': 'fas fa-paw',
  'Massage Therapy': 'fas fa-hand-holding-heart',
  'Landscaping': 'fas fa-leaf',
  'Moving Services': 'fas fa-truck'
};

export default function Services() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);

  // Fetch active services from the database
  const { data: allServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/services', 'active'],
    queryFn: () => servicesAPI.getAllServices(true), // Only active services
  });

  // Get provider counts for each service
  const { data: allProviders = [] } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: async () => {
      const providers = await providerAPI.getProviders();
      return providers;
    },
  });

  // Memoize provider counts to prevent infinite re-renders
  const providerCounts = useMemo(() => {
    if (!allProviders) return {};
    const counts: { [serviceName: string]: number } = {};
    allProviders.forEach((provider: any) => {
      if (provider.kycVerified) {
        counts[provider.serviceName] = (counts[provider.serviceName] || 0) + 1;
      }
    });
    return counts;
  }, [allProviders]);

  const getProviderCount = (serviceName: string) => {
    return providerCounts[serviceName] || 0;
  };

  // Group services by category dynamically
  useEffect(() => {
    if (!allServices || allServices.length === 0) {
      setFilteredCategories([]);
      return;
    }

    // Group services by category
    const categoriesMap: { [key: string]: any } = {};
    
    allServices.forEach((service: any) => {
      if (!categoriesMap[service.category]) {
        categoriesMap[service.category] = {
          name: categoryMetadata[service.category as keyof typeof categoryMetadata]?.name || service.category,
          category: service.category,
          icon: categoryMetadata[service.category as keyof typeof categoryMetadata]?.icon || 'fas fa-cog',
          services: []
        };
      }
      
      categoriesMap[service.category].services.push({
        id: service.id,
        name: service.name,
        icon: serviceIcons[service.name] || 'fas fa-cog',
        description: service.description
      });
    });

    let filtered = Object.values(categoriesMap);

    // Filter by category
    if (activeFilter !== 'all') {
      filtered = filtered.filter((cat: any) => cat.category === activeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.map((category: any) => ({
        ...category,
        services: category.services.filter((service: any) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter((category: any) => category.services.length > 0);
    }

    setFilteredCategories(filtered);
  }, [allServices, searchTerm, activeFilter]);

  const handleServiceClick = (serviceName: string) => {
    sessionStorage.setItem('currentService', serviceName);
    setLocation('/providers');
  };

  if (servicesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
            Browse Our Services
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Discover trusted professionals for all your service needs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-12 animate-slide-up">
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for services like 'Plumbing', 'Cleaning', 'Photography'..."
              className="block w-full pl-12 pr-4 py-5 bg-white border border-gray-200 rounded-2xl focus:ring-primary focus:border-primary text-lg shadow-card hover:shadow-elevated transition-all"
              data-testid="input-search-services"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-8 py-3 rounded-full border-2 transition-all font-semibold hover-lift ${
                activeFilter === 'all'
                  ? 'bg-primary text-white border-primary shadow-glow'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:shadow-card'
              }`}
              data-testid="filter-all"
            >
              All Services
            </button>
            {Object.entries(categoryMetadata).map(([categoryKey, categoryData]) => (
              <button
                key={categoryKey}
                onClick={() => setActiveFilter(categoryKey)}
                className={`px-8 py-3 rounded-full border-2 transition-all font-semibold hover-lift inline-flex items-center ${
                  activeFilter === categoryKey
                    ? 'bg-primary text-white border-primary shadow-glow'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:shadow-card'
                }`}
                data-testid={`filter-${categoryKey}`}
              >
                <i className={`${categoryData.icon} mr-2`}></i>
                {categoryData.name}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCategories.map((category, index) => (
            <div
              key={category.category}
              className="bg-white rounded-3xl shadow-card hover-lift transition-all duration-300 overflow-hidden animate-scale-in group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mr-4 shadow-glow group-hover:shadow-elevated transition-all">
                    <i className={`${category.icon} text-white text-2xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
                    <p className="text-gray-600 text-sm">{category.services.length} Services</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  {category.services.map((service: any) => {
                    const providerCount = getProviderCount(service.name);
                    return (
                      <div
                        key={service.name}
                        onClick={() => handleServiceClick(service.name)}
                        className="flex items-center p-4 rounded-xl hover:bg-gradient-primary hover:text-white cursor-pointer transition-all group/item hover-scale"
                        data-testid={`service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="w-10 h-10 bg-gray-100 group-hover/item:bg-white/20 rounded-lg flex items-center justify-center mr-4 transition-all">
                          <i className={`${service.icon} text-gray-600 group-hover/item:text-white transition-colors`}></i>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-lg">{service.name}</span>
                          <div className="text-sm opacity-80">
                            {providerCount > 0 ? `${providerCount} Available` : 'Coming Soon'}
                          </div>
                        </div>
                        <div className="ml-auto">
                          <span className={`text-sm px-3 py-1 rounded-full font-medium transition-all ${
                            providerCount > 0 
                              ? 'bg-green-100 text-green-700 group-hover/item:bg-white/20 group-hover/item:text-white'
                              : 'bg-gray-100 text-gray-500 group-hover/item:bg-white/20 group-hover/item:text-white'
                          }`}>
                            {providerCount > 0 ? `${providerCount} Pro${providerCount > 1 ? 's' : ''}` : 'Soon'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-16 animate-slide-up">
            <div className="text-gray-400 mb-6">
              <Search className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-3">No services found</h3>
            <p className="text-gray-500 text-lg">Try adjusting your search terms or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
