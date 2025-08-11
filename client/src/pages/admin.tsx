import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { adminAPI, authAPI, providerAPI, bookingAPI, paymentAPI, reviewAPI, servicesAPI } from '@/lib/api';
import { useNotification } from '@/components/ui/notification';
import { useLocation } from 'wouter';
import { RealPaymentSetup } from '@/components/payment';
import AdminSettingsComponent from './admin-settings';
import { ServicesView } from './admin-services';
import { AgentsView } from './admin-agents';
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
  Settings,
  Wrench,
  Plus,
  FileText,
  Download,
  ExternalLink,
  Bot,
  Brain
} from 'lucide-react';
import { formatIndianTime } from '@shared/utils/date';

// KYC Document Viewer Component
function KycDocumentViewer({ providerId }: { providerId: number }) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/providers', providerId, 'kyc-documents'],
    queryFn: async () => {
      const response = await fetch(`/api/providers/${providerId}/kyc-documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading documents...</div>;
  }

  if (!documents?.documents || documents.documents.length === 0) {
    return <div className="text-sm text-gray-500">No documents uploaded yet</div>;
  }

  const handleViewDocument = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {documents.documents.map((doc: any, index: number) => (
        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center">
            <FileText className="w-4 h-4 text-blue-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900">{doc.documentType}</div>
              <div className="text-xs text-gray-500">{doc.originalName}</div>
              <div className="text-xs text-gray-400">
                {formatIndianTime(doc.uploadedAt)} • {(doc.fileSize / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewDocument(doc.fileUrl, doc.originalName)}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </button>
            <a
              href={doc.fileUrl}
              download={doc.originalName}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ email: 'admin@servicehub.com', password: 'Admin@123' });
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showKycDetails, setShowKycDetails] = useState(false);

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
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need to create an admin account?{' '}
              <button
                onClick={() => setLocation('/admin-register')}
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Register here
              </button>
            </p>
          </div>
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
              onClick={() => setActiveView('services')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'services' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <Wrench className="w-5 h-5 mr-3" /> Services Management
            </button>
            <button
              onClick={() => setActiveView('agents')}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeView === 'agents' ? 'bg-primary text-white font-bold' : 'text-gray-300'
              }`}
            >
              <Bot className="w-5 h-5 mr-3" /> AI Agents
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
          {activeView === 'services' && <ServicesView />}
          {activeView === 'agents' && <AgentsView />}
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
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showKycDetails, setShowKycDetails] = useState(false);
  
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

  const deleteProviderMutation = useMutation({
    mutationFn: (id: number) => adminAPI.deleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
      showNotification('Provider deleted successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to delete provider', 'error');
    },
  });

  // AI-Powered KYC Processing Mutation
  const processPendingKYCsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/agents/process/all-pending-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to process pending KYCs');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers'] });
      showNotification(
        `🤖 AI KYC verification initiated! Processing ${pendingKycProviders.length} pending application${pendingKycProviders.length !== 1 ? 's' : ''}. Auto-approved providers will be activated immediately.`,
        'success'
      );
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to process pending KYCs', 'error');
    },
  });

  const handleApproveKyc = (providerId: number) => {
    updateKycMutation.mutate({ id: providerId, verified: true });
  };

  const handleRejectProvider = (providerId: number) => {
    if (confirm('Are you sure you want to reject this provider\'s KYC application?')) {
      // Update KYC status to rejected - this will automatically set status to 'Rejected' in backend
      updateKycMutation.mutate({ id: providerId, verified: false });
    }
  };

  const handleDeleteProvider = (providerId: number) => {
    if (confirm('Are you sure you want to permanently delete this provider? This will remove all their data including bookings, payments, and reviews. This action cannot be undone.')) {
      deleteProviderMutation.mutate(providerId);
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
    const notRejected = p.status !== 'Rejected';
    return !p.kycVerified && (isPendingReview || hasKycDocuments) && notRejected;
  }) || [];
  
  console.log('All providers:', providers);
  console.log('Pending KYC providers:', pendingKycProviders);
  const allProviders = providers || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Provider Management</h2>
        
        {/* AI-Powered KYC Processing Button */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{pendingKycProviders.length}</span> pending KYC review{pendingKycProviders.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => processPendingKYCsMutation.mutate()}
            disabled={processPendingKYCsMutation.isPending || pendingKycProviders.length === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {processPendingKYCsMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Processing KYCs...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                🤖 AI Process Pending KYCs
              </>
            )}
          </button>
        </div>
      </div>
      
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
                        KYC submitted {formatIndianTime(provider.kycDocuments.submitted_at)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      console.log('Selected provider KYC documents:', provider.kycDocuments);
                      setSelectedProvider(provider);
                      setShowKycDetails(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    View Details
                  </button>
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
                    disabled={updateKycMutation.isPending}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleDeleteProvider(provider.id)}
                    disabled={deleteProviderMutation.isPending}
                    className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-900 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
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

      {/* KYC Details Modal */}
      {showKycDetails && selectedProvider && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  KYC Details - {selectedProvider.businessName}
                </h3>
                <button
                  onClick={() => setShowKycDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Business Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name</label>
                      <p className="text-sm text-gray-900">{selectedProvider.businessName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                      <p className="text-sm text-gray-900">{selectedProvider.ownerName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedProvider.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedProvider.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service</label>
                      <p className="text-sm text-gray-900">{selectedProvider.serviceName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <p className="text-sm text-gray-900">{selectedProvider.experience} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                      <p className="text-sm text-gray-900">₹{selectedProvider.hourlyRate}/hr</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{selectedProvider.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900">{selectedProvider.description}</p>
                    </div>
                  </div>
                </div>

                {/* KYC Documents & Verification */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">KYC Verification Details</h4>
                  
                  {/* Identity Verification */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-3">Identity Verification</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Aadhar Number:</span>
                        <span className="text-sm font-medium text-green-900">{selectedProvider.aadharNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">PAN Number:</span>
                        <span className="text-sm font-medium text-green-900">{selectedProvider.panNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Phone Verified:</span>
                        <span className={`text-sm font-medium ${selectedProvider.phoneVerified ? 'text-green-900' : 'text-red-900'}`}>
                          {selectedProvider.phoneVerified ? '✓ Verified' : '✗ Not Verified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-3">Uploaded Documents</h5>
                    <KycDocumentViewer providerId={selectedProvider.id} />
                  </div>

                  {/* Submission Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Submission Details</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Submitted On:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatIndianTime(selectedProvider.kycDocuments?.submitted_at)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Current Status:</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          selectedProvider.status === 'Pending KYC Review' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedProvider.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowKycDetails(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleRejectProvider(selectedProvider.id);
                    setShowKycDetails(false);
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Reject KYC
                </button>
                <button
                  onClick={() => {
                    handleApproveKyc(selectedProvider.id);
                    setShowKycDetails(false);
                  }}
                  disabled={updateKycMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Approve KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                <td className="px-6 py-4 text-sm text-gray-900">{formatIndianTime(booking.bookingDate)}</td>
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
                  {formatIndianTime(payment.transactionDate)}
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
