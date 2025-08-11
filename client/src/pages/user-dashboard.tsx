import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, IndianRupee, Star, ChevronRight, User, History, CreditCard, Save, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useNotification } from '@/components/ui/notification';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { reviewAPI, messageAPI } from '@/lib/api';
import MessagingModal from '@/components/modals/messaging-modal';
import { formatIndianTime } from '@shared/utils/date';

// Form validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10,15}$/, 'Phone number must be 10-15 digits'),
  location: z.string().min(2, 'Location is required'),
});

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  
  // Check for tab parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const queryClient = useQueryClient();

  // Get current user
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    setLocation('/auth');
    return null;
  }
  const user = JSON.parse(userStr);

  // Form setup for profile editing
  const form = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user.name || '',
      phone: user.phone || '',
      location: user.location || '',
    },
  });

  // Profile update mutation
  const profileUpdateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileUpdateSchema>) => {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (response: any) => {
      // Update localStorage with new user data
      const updatedUser = { ...user, ...response.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Reset form with new values
      form.reset({
        name: response.user.name,
        phone: response.user.phone,
        location: response.user.location,
      });
      
      setIsEditingProfile(false);
      showNotification('Profile updated successfully!', 'success');
      
      // Refresh any relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: () => {
      showNotification('Failed to update profile. Please try again.', 'error');
    },
  });

  // Fetch user's bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings/user', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  });

  // Fetch user's payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments/user', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/payments/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  // Review submission mutation
  const submitReviewMutation = useMutation({
    mutationFn: (reviewData: any) => reviewAPI.createReview(reviewData),
    onSuccess: () => {
      showNotification('Review submitted successfully!', 'success');
      setIsRatingModalOpen(false);
      setRating(0);
      setComment('');
      setSelectedBooking(null);
      // Invalidate bookings to refresh any rating status
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/user', user.id] });
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to submit review', 'error');
    },
  });

  const handleRateService = (booking: any) => {
    setSelectedBooking(booking);
    setIsRatingModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedBooking || rating === 0) {
      showNotification('Please select a rating', 'error');
      return;
    }

    const reviewData = {
      bookingId: selectedBooking.id,
      userId: user.id,
      providerId: selectedBooking.providerId,
      rating: rating,
      comment: comment || 'No comment provided'
    };

    submitReviewMutation.mutate(reviewData);
  };

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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const recentBookings = bookings?.slice(0, 3) || [];
  const totalSpent = payments?.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0) || 0;
  const completedBookings = bookings?.filter((booking: any) => booking.status === 'Completed')?.length || 0;

  if (user.type !== 'user') {
    setLocation('/provider-dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome Back, {user.name}!
            </h1>
            <p className="text-xl opacity-90">
              Manage your bookings and track service history
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-slide-up">
          <div className="bg-white rounded-3xl shadow-card p-8 hover-lift transition-all">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <h3 className="text-3xl font-bold text-gray-900">{bookings?.length || 0}</h3>
                <p className="text-gray-600 font-medium">Total Bookings</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8 hover-lift transition-all">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Star className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <h3 className="text-3xl font-bold text-gray-900">{completedBookings}</h3>
                <p className="text-gray-600 font-medium">Completed Services</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8 hover-lift transition-all">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow">
                <IndianRupee className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <h3 className="text-3xl font-bold text-gray-900">{formatAmountInINR(totalSpent)}</h3>
                <p className="text-gray-600 font-medium">Total Spent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-card p-2 mb-8 animate-slide-up">
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all hover-lift ${
                activeTab === 'overview'
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              data-testid="tab-overview"
            >
              <i className="fas fa-tachometer-alt mr-2"></i>
              Overview
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all hover-lift ${
                activeTab === 'bookings'
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              data-testid="tab-bookings"
            >
              <i className="fas fa-calendar mr-2"></i>
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all hover-lift ${
                activeTab === 'payments'
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              data-testid="tab-payments"
            >
              <i className="fas fa-credit-card mr-2"></i>
              Payment History
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all hover-lift ${
                activeTab === 'messages'
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              data-testid="tab-messages"
            >
              <i className="fas fa-envelope mr-2"></i>
              Messages
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all hover-lift ${
                activeTab === 'profile'
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              data-testid="tab-profile"
            >
              <i className="fas fa-user-cog mr-2"></i>
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
              <Link href="/services">
                <button className="w-full p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">Book New Service</span>
                </button>
              </Link>
              <button className="w-full p-4 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                <History className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">View History</span>
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
                        {formatIndianTime(booking.bookingDate)} at {booking.bookingTime}
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
                      {booking.status.toLowerCase() === 'completed' && (
                        <button
                          onClick={() => handleRateService(booking)}
                          className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                          data-testid="button-rate-service-overview"
                        >
                          Rate Service
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">No bookings yet</h4>
                <p className="text-gray-500 mb-4">Book your first service to get started</p>
                <Link href="/services">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Browse Services
                  </button>
                </Link>
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
                          {formatIndianTime(booking.bookingDate)} at {booking.bookingTime}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {booking.serviceAddress}
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
                      {booking.status.toLowerCase() === 'completed' && (
                        <button
                          onClick={() => handleRateService(booking)}
                          className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                          data-testid="button-rate-service"
                        >
                          Rate Service
                        </button>
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
              <p className="text-gray-500 mb-4">Book your first service to get started</p>
              <Link href="/services">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Browse Services
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
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
                          <CreditCard className="w-4 h-4 mr-2" />
                          {payment.paymentMethod} via {payment.paymentGateway}
                        </div>
                        <div className="flex items-center mt-1">
                          <Clock className="w-4 h-4 mr-2" />
                          {formatIndianTime(payment.transactionDate)}
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
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 mb-2">No payments yet</h4>
              <p className="text-gray-500">Your payment history will appear here</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setLocation('/services')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Browse Services
            </button>
          </div>
          
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Start a conversation</h3>
            <p className="text-gray-500 mb-4">Send messages to service providers to discuss your requirements</p>
            <p className="text-sm text-gray-400">Messages will appear here once you start chatting with providers</p>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                data-testid="button-edit-profile"
              >
                Edit Profile
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <div className="text-gray-900" data-testid="text-user-name">
                    {user.name || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="text-gray-900" data-testid="text-user-email">
                    {user.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="text-gray-900" data-testid="text-user-phone">
                    {user.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="text-gray-900" data-testid="text-user-location">
                    {user.location || 'Not provided'}
                  </div>
                </div>
              </div>
              
              {(!user.name || !user.phone) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <User className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Complete Your Profile
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Please add your name and phone number to book services on our platform.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit((data) => profileUpdateMutation.mutate(data))}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    {...form.register('name')}
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                    data-testid="input-name"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{String(form.formState.errors.name.message)}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    {...form.register('phone')}
                    type="tel"
                    id="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                    data-testid="input-phone"
                  />
                  {form.formState.errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{String(form.formState.errors.phone.message)}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  {...form.register('location')}
                  type="text"
                  id="location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your city and area"
                  data-testid="input-location"
                />
                {form.formState.errors.location && (
                  <p className="mt-1 text-sm text-red-600">{String(form.formState.errors.location.message)}</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={profileUpdateMutation.isPending}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4" />
                  {profileUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    form.reset();
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Rating Modal */}
      {isRatingModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Your Service</h3>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">{selectedBooking.serviceName}</h4>
              <p className="text-sm text-gray-600">
                Booked on {selectedBooking.bookingDate} at {selectedBooking.bookingTime}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate this service?
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                    data-testid={`star-${star}`}
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share your experience..."
                data-testid="textarea-comment"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || submitReviewMutation.isPending}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                data-testid="button-submit-review"
              >
                {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                onClick={() => {
                  setIsRatingModalOpen(false);
                  setRating(0);
                  setComment('');
                  setSelectedBooking(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid="button-cancel-review"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Messaging Modal */}
      {isMessagingModalOpen && selectedProvider && (
        <MessagingModal
          isOpen={isMessagingModalOpen}
          onClose={() => {
            setIsMessagingModalOpen(false);
            setSelectedProvider(null);
          }}
          receiverId={selectedProvider.id}
          receiverType="provider"
          receiverName={selectedProvider.name}
          senderType="user"
          senderId={user.id}
        />
      )}
      </div>
    </div>
  );
}