import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { providerAPI } from '@/lib/api';

const serviceCategories = [
  {
    name: 'Home & Property',
    category: 'home',
    icon: 'fas fa-home',
    services: [
      { name: 'Plumbing', icon: 'fas fa-wrench' },
      { name: 'Electrical Work', icon: 'fas fa-bolt' },
      { name: 'Painting', icon: 'fas fa-paint-roller' },
      { name: 'Carpentry', icon: 'fas fa-hammer' },
    ]
  },
  {
    name: 'Events & Celebrations',
    category: 'events',
    icon: 'fas fa-calendar',
    services: [
      { name: 'Event Planning', icon: 'fas fa-calendar-alt' },
      { name: 'Photography', icon: 'fas fa-camera' },
      { name: 'Catering', icon: 'fas fa-utensils' },
    ]
  },
  {
    name: 'Personal & Lifestyle',
    category: 'personal',
    icon: 'fas fa-user',
    services: [
      { name: 'Home Cleaning', icon: 'fas fa-broom' },
      { name: 'Personal Training', icon: 'fas fa-dumbbell' },
      { name: 'Pet Grooming', icon: 'fas fa-cut' },
    ]
  },
  {
    name: 'Business Services',
    category: 'business',
    icon: 'fas fa-briefcase',
    services: [
      { name: 'IT Support', icon: 'fas fa-laptop' },
      { name: 'Graphic Design', icon: 'fas fa-paint-brush' },
    ]
  }
];

export default function Services() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredCategories, setFilteredCategories] = useState(serviceCategories);

  // Get provider counts for each service
  const { data: allProviders } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: async () => {
      const providers = await providerAPI.getProviders();
      return providers;
    },
  });

  const getProviderCount = (serviceName: string) => {
    if (!allProviders) return 0;
    return allProviders.filter((provider: any) => 
      provider.serviceName === serviceName && provider.kycVerified
    ).length;
  };

  useEffect(() => {
    let filtered = serviceCategories;

    // Filter by category
    if (activeFilter !== 'all') {
      filtered = filtered.filter(cat => cat.category === activeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.map(category => ({
        ...category,
        services: category.services.filter(service =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.services.length > 0);
    }

    setFilteredCategories(filtered);
  }, [searchTerm, activeFilter]);

  const handleServiceClick = (serviceName: string) => {
    sessionStorage.setItem('currentService', serviceName);
    setLocation('/providers');
  };

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
            {serviceCategories.map((category) => (
              <button
                key={category.category}
                onClick={() => setActiveFilter(category.category)}
                className={`px-8 py-3 rounded-full border-2 transition-all font-semibold hover-lift inline-flex items-center ${
                  activeFilter === category.category
                    ? 'bg-primary text-white border-primary shadow-glow'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:shadow-card'
                }`}
                data-testid={`filter-${category.category}`}
              >
                <i className={`${category.icon} mr-2`}></i>
                {category.name}
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
                  {category.services.map((service) => {
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
