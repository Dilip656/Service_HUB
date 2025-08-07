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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Search and Filters */}
      <div className="mb-8">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for services like 'Plumbing', 'Cleaning', 'Photography'..."
            className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-lg"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-6 py-2 rounded-full border transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary text-white border-primary'
                : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
            }`}
          >
            All Services
          </button>
          {serviceCategories.map((category) => (
            <button
              key={category.category}
              onClick={() => setActiveFilter(category.category)}
              className={`px-6 py-2 rounded-full border transition-colors ${
                activeFilter === category.category
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
              }`}
            >
              <i className={`${category.icon} mr-2`}></i>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div
            key={category.category}
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <i className={`${category.icon} text-primary text-xl`}></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {category.services.map((service) => (
                  <div
                    key={service.name}
                    onClick={() => handleServiceClick(service.name)}
                    className="flex items-center p-3 rounded-lg hover:bg-primary hover:text-white cursor-pointer transition-all group"
                  >
                    <i className={`${service.icon} w-5 text-gray-500 group-hover:text-white mr-3`}></i>
                    <span className="font-medium flex-1">{service.name}</span>
                    <div className="ml-auto">
                      <span className="text-xs bg-gray-100 group-hover:bg-white/20 px-2 py-1 rounded-full">
                        {getProviderCount(service.name)} Providers
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No services found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}
