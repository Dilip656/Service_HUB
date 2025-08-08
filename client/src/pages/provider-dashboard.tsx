import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, DollarSign, Star, ChevronRight, User, TrendingUp, Shield, Users, CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useNotification } from '@/components/ui/notification';

export default function ProviderDashboard() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('overview');

  // Get current provider
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    setLocation('/auth');
    return null;
  }
  const user = JSON.parse(userStr);

  // Fetch provider details
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ['/api/providers', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/providers/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch provider details');
      return response.json();
    },
  });

  // Fetch provider's bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings/provider', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/provider/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  });

  // Fetch provider's earnings
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments/provider', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/payments/provider/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const formatAmountInINR = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (user.type !== 'provider') {
    setLocation('/user-dashboard');
    return null;
  }

  const recentBookings = bookings?.slice(0, 3) || [];
  const totalEarnings = payments?.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0) || 0;
  const completedBookings = bookings?.filter((booking: any) => booking.status === 'Completed')?.length || 0;
  const pendingBookings = bookings?.filter((booking: any) => booking.status === 'Pending')?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h1>
        <p className="text-gray-600">Manage your service business and track your performance</p>
      </div>

      {/* Provider Status */}
      {provider && (
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-12 w-12 text-gray-400" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{provider.businessName}</h2>
                <p className="text-gray-600">{provider.serviceName} • {provider.location}</p>
                <div className="flex items-center mt-2">
                  {provider.kycVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      KYC Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      KYC Pending
                    </span>
                  )}
                  <span className="ml-3 text-sm text-gray-500">
                    {provider.experience} years experience
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{formatAmountInINR(provider.hourlyRate)}</div>
              <p className="text-sm text-gray-600">per hour</p>
              <div className="flex items-center mt-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm text-gray-600">
                  {provider.rating || 'No ratings yet'}
                  {provider.reviewCount > 0 && ` (${provider.reviewCount} reviews)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{bookings?.length || 0}</h3>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{pendingBookings}</h3>
              <p className="text-sm text-gray-600">Pending Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{completedBookings}</h3>
              <p className="text-sm text-gray-600">Completed Jobs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{formatAmountInINR(totalEarnings)}</h3>
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'earnings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                onClick={() => setActiveTab('bookings')}
                className="w-full p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">View Bookings</span>
              </button>
              <button 
                onClick={() => setActiveTab('earnings')}
                className="w-full p-4 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Check Earnings</span>
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-full p-4 border border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <User className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Update Profile</span>
              </button>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <button 
                onClick={() => setActiveTab('bookings')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            {bookingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{booking.serviceName}</h4>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {booking.bookingDate} at {booking.bookingTime}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {booking.serviceAddress}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {formatAmountInINR(booking.amount || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">No bookings yet</h4>
                <p className="text-gray-500">Your bookings will appear here once customers start booking your services</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Bookings</h3>
          {bookingsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking: any) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">{booking.serviceName}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {booking.bookingDate} at {booking.bookingTime}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {booking.serviceAddress}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Customer ID: {booking.userId}
                        </div>
                      </div>
                      {booking.requirements && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Requirements:</strong> {booking.requirements}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <div className="text-sm font-medium text-gray-900 mt-2">
                        {formatAmountInINR(booking.amount || 0)}
                      </div>
                      {booking.status === 'Pending' && (
                        <div className="mt-2 space-x-2">
                          <button className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                            Accept
                          </button>
                          <button className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">No bookings yet</h4>
              <p className="text-gray-500">Your bookings will appear here once customers start booking your services</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Overview</h3>
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatAmountInINR(totalEarnings)}</div>
            <p className="text-gray-600">Total earnings from completed services</p>
          </div>
          
          {paymentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment: any) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Payment #{payment.id}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {new Date(payment.transactionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                      <div className="text-lg font-medium text-gray-900 mt-1">
                        {formatAmountInINR(payment.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">No earnings yet</h4>
              <p className="text-gray-500">Complete services to start earning</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && provider && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Profile</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <div className="text-gray-900">{provider.businessName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                <div className="text-gray-900">{provider.ownerName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
                <div className="text-gray-900">{provider.serviceCategory}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                <div className="text-gray-900">{provider.serviceName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="text-gray-900">{provider.location}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
                <div className="text-gray-900">{formatAmountInINR(provider.hourlyRate)}</div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Description</label>
              <div className="text-gray-900">{provider.description}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <div className="flex flex-wrap gap-2">
                {provider.availability?.map((day: string) => (
                  <span key={day} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                )) || <span className="text-gray-500">No availability set</span>}
              </div>
            </div>

            <div className="pt-6 border-t">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}