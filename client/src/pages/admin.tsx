import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { adminAPI, authAPI, providerAPI, bookingAPI, paymentAPI, reviewAPI } from '@/lib/api';
import { useNotification } from '@/components/ui/notification';
import { useLocation } from 'wouter';
import { RealPaymentSetup } from '@/components/payment';
import AdminSettingsComponent from './admin-settings';
import { 
  Shield, 
  Users, 
  HardHat, 
  CalendarCheck, 
  DollarSign, 
  Star,
  Eye,
  Ban,
  Trash2,
  Check,
  X,
  Clock,
  LogOut,
  Settings
} from 'lucide-react';

export default function Admin() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ email: 'admin@servicehub.com', password: 'ServiceHub@Admin2025!' });
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.login(email, password, 'admin'),
    onSuccess: () => {
      setIsLoggedIn(true);
      showNotification('Admin login successful', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Invalid admin credentials', 'error');
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveView('dashboard');
    showNotification('Logged out successfully', 'success');
    setLocation('/');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Portal</h2>
            <p className="mt-2 text-gray-600">Secure access to admin dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loginMutation.isPending ? 'Signing In...' : 'Access Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-gray-900 text-white min-h-screen flex-shrink-0">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold">Admin Dashboard</h3>
          </div>
          <nav className="mt-6">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'dashboard' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <i className="fas fa-tachometer-alt mr-3"></i> Dashboard
            </button>
            <button
              onClick={() => setActiveView('users')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'users' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <Users className="w-5 h-5 mr-3" /> User Management
            </button>
            <button
              onClick={() => setActiveView('providers')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'providers' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <HardHat className="w-5 h-5 mr-3" /> Provider Management
            </button>
            <button
              onClick={() => setActiveView('bookings')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'bookings' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <CalendarCheck className="w-5 h-5 mr-3" /> Bookings
            </button>
            <button
              onClick={() => setActiveView('payments')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'payments' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <DollarSign className="w-5 h-5 mr-3" /> Payments
            </button>
            <button
              onClick={() => setActiveView('reviews')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'reviews' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <Star className="w-5 h-5 mr-3" /> Reviews
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'settings' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <Settings className="w-5 h-5 mr-3" /> Admin Settings
            </button>
            <div className="border-t border-gray-700 mt-6">
              <button
                onClick={() => setShowPaymentSetup(true)}
                className="w-full flex items-center px-6 py-3 text-left text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-5 h-5 mr-3" /> Payment Setup
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-6 py-3 text-left text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" /> Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Admin Main Content */}
        <main className="flex-1 p-8">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'users' && <UsersView />}
          {activeView === 'providers' && <ProvidersView />}
          {activeView === 'bookings' && <BookingsView />}
          {activeView === 'payments' && <PaymentsView />}
          {activeView === 'reviews' && <ReviewsView />}
          {activeView === 'settings' && <AdminSettingsComponent />}
        </main>
      </div>

      {/* Payment Setup Modal */}
      <RealPaymentSetup
        isOpen={showPaymentSetup}
        onClose={() => setShowPaymentSetup(false)}
        onSetupComplete={(config) => {
          // Save payment configuration to localStorage
          localStorage.setItem('merchantUpiId', config.merchantUpiId);
          localStorage.setItem('merchantName', config.merchantName);
          if (config.razorpayKeyId) {
            localStorage.setItem('razorpayKeyId', config.razorpayKeyId);
          }
          if (config.bankDetails) {
            localStorage.setItem('bankDetails', JSON.stringify(config.bankDetails));
          }
          setShowPaymentSetup(false);
        }}
      />
    </div>
  );
}

function DashboardView() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: adminAPI.getDashboardStats,
  });

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to ServiceHub admin panel</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
              <Users className="text-primary w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <HardHat className="text-green-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Providers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalProviders || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
              <CalendarCheck className="text-yellow-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <DollarSign className="text-red-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersView() {
  const { showNotification } = useNotification();
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: adminAPI.getUsers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminAPI.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      showNotification('User status updated successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update user status', 'error');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => adminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      showNotification('User deleted successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to delete user', 'error');
    },
  });

  const handleToggleStatus = (user: any) => {
    const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    updateStatusMutation.mutate({ id: user.id, status: newStatus });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  console.log('Users data:', users);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">ID: {user.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={updateStatusMutation.isPending}
                    className="text-indigo-600 hover:text-indigo-900 mr-2 disabled:opacity-50"
                  >
                    {user.status === 'Active' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deleteUserMutation.isPending}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProvidersView() {
  const { showNotification } = useNotification();
  
  const { data: providers, isLoading } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: () => providerAPI.getProviders(),
  });

  const updateKycMutation = useMutation({
    mutationFn: ({ id, verified }: { id: number; verified: boolean }) =>
      adminAPI.updateProviderKyc(id, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
      showNotification('KYC status updated successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update KYC status', 'error');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminAPI.updateProviderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
      showNotification('Provider status updated successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update provider status', 'error');
    },
  });

  const handleApproveKyc = (providerId: number) => {
    updateKycMutation.mutate({ id: providerId, verified: true });
  };

  const handleRejectProvider = (providerId: number) => {
    if (confirm('Are you sure you want to reject this provider?')) {
      updateStatusMutation.mutate({ id: providerId, status: 'Rejected' });
    }
  };

  const handleSuspendProvider = (provider: any) => {
    const newStatus = provider.status === 'Active' ? 'Suspended' : 'Active';
    updateStatusMutation.mutate({ id: provider.id, status: newStatus });
  };

  if (isLoading) {
    return <div>Loading providers...</div>;
  }

  const pendingKycProviders = providers?.filter((p: any) => {
    const hasKycDocuments = p.kycDocuments && 
      (p.kycDocuments.uploaded_documents && p.kycDocuments.uploaded_documents.length > 0 ||
       p.kycDocuments.status === 'pending_review');
    const isPendingReview = p.status === 'Pending KYC Review' || p.status === 'Pending';
    return !p.kycVerified && (isPendingReview || hasKycDocuments);
  }) || [];
  
  console.log('All providers:', providers);
  console.log('Pending KYC providers:', pendingKycProviders);
  const allProviders = providers || [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Provider Management</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending KYC Reviews</h3>
        <div className="bg-white rounded-lg shadow-sm border divide-y divide-gray-200">
          {pendingKycProviders.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No pending KYC reviews</div>
          ) : (
            pendingKycProviders.map((provider: any) => (
              <div key={provider.id} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{provider.businessName}</div>
                  <div className="text-sm text-gray-500 mb-2">
                    {provider.serviceName} • {provider.ownerName} • {provider.email}
                  </div>
                  <div className="text-xs text-gray-400">
                    Experience: {provider.experience} years • Rate: ${provider.hourlyRate}/hr
                  </div>
                  {provider.kycDocuments && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        KYC submitted {new Date(provider.kycDocuments.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveKyc(provider.id)}
                    disabled={updateKycMutation.isPending}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    Approve KYC
                  </button>
                  <button
                    onClick={() => handleRejectProvider(provider.id)}
                    disabled={updateStatusMutation.isPending}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Providers</h3>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KYC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allProviders.map((provider: any) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{provider.businessName}</div>
                      <div className="text-sm text-gray-500">{provider.ownerName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{provider.serviceName}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        provider.kycVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {provider.kycVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {provider.rating ? Number(provider.rating).toFixed(1) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleSuspendProvider(provider)}
                      disabled={updateStatusMutation.isPending}
                      className="text-orange-600 hover:text-orange-900 mr-2 disabled:opacity-50"
                    >
                      {provider.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BookingsView() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: () => bookingAPI.getBookings(),
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: adminAPI.getUsers,
  });

  const { data: providers } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: () => providerAPI.getProviders(),
  });

  if (isLoading) {
    return <div>Loading bookings...</div>;
  }

  const getUserName = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getProviderName = (providerId: number) => {
    const provider = providers?.find((p: any) => p.id === providerId);
    return provider?.businessName || 'Unknown';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Management</h2>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings?.map((booking: any) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">BK-{booking.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{getUserName(booking.userId)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{getProviderName(booking.providerId)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.bookingDate}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'Confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsView() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: () => paymentAPI.getPayments(),
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: adminAPI.getUsers,
  });

  if (isLoading) {
    return <div>Loading payments...</div>;
  }

  const getUserName = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user?.name || 'Unknown';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Management</h2>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments?.map((payment: any) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{payment.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{getUserName(payment.userId)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  ₹{Number(payment.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'Successful'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(payment.transactionDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewsView() {
  const { showNotification } = useNotification();
  
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['/api/reviews'],
    queryFn: () => reviewAPI.getReviews(),
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: adminAPI.getUsers,
  });

  const { data: providers } = useQuery({
    queryKey: ['/api/providers'],
    queryFn: () => providerAPI.getProviders(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      reviewAPI.updateReviewStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      showNotification('Review status updated successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update review status', 'error');
    },
  });

  const handleApproveReview = (reviewId: number) => {
    updateStatusMutation.mutate({ id: reviewId, status: 'approved' });
  };

  const handleFlagReview = (reviewId: number) => {
    updateStatusMutation.mutate({ id: reviewId, status: 'flagged' });
  };

  if (isLoading) {
    return <div>Loading reviews...</div>;
  }

  const getUserName = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user?.name || 'Anonymous';
  };

  const getProviderName = (providerId: number) => {
    const provider = providers?.find((p: any) => p.id === providerId);
    return provider?.businessName || 'Unknown Provider';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Management</h2>
      <div className="space-y-4">
        {reviews?.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center text-gray-500">
            No reviews to moderate
          </div>
        ) : (
          reviews?.map((review: any) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-gray-900">{getUserName(review.userId)}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'fill-current' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Review for {getProviderName(review.providerId)}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    review.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : review.status === 'flagged'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {review.status}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{review.comment}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                <div className="space-x-2">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => handleApproveReview(review.id)}
                      disabled={updateStatusMutation.isPending}
                      className="text-green-600 hover:text-green-800 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {review.status !== 'flagged' && (
                    <button
                      onClick={() => handleFlagReview(review.id)}
                      disabled={updateStatusMutation.isPending}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Flag
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
