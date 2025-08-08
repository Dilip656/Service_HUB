import { apiRequest } from "./queryClient";

export interface AuthResponse {
  user: {
    id: number;
    name?: string;
    email: string;
    role?: string;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
}

// Auth API
export const authAPI = {
  registerUser: async (userData: any): Promise<AuthResponse> => {
    const res = await apiRequest("POST", "/api/auth/register/user", userData);
    return res.json();
  },

  registerProvider: async (providerData: any): Promise<AuthResponse> => {
    const res = await apiRequest("POST", "/api/auth/register/provider", providerData);
    return res.json();
  },

  login: async (email: string, password: string, type = "user"): Promise<AuthResponse> => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password, type });
    return res.json();
  },
};

// Provider API
export const providerAPI = {
  getProviders: async (params?: { service?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.service) searchParams.set("service", params.service);
    if (params?.search) searchParams.set("search", params.search);
    
    const res = await apiRequest("GET", `/api/providers?${searchParams}`);
    return res.json();
  },

  getProvider: async (id: number) => {
    const res = await apiRequest("GET", `/api/providers/${id}`);
    return res.json();
  },
};

// Booking API
export const bookingAPI = {
  createBooking: async (bookingData: any) => {
    const res = await apiRequest("POST", "/api/bookings", bookingData);
    return res.json();
  },

  getBookings: async (params?: { userId?: number; providerId?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set("userId", params.userId.toString());
    if (params?.providerId) searchParams.set("providerId", params.providerId.toString());
    
    const res = await apiRequest("GET", `/api/bookings?${searchParams}`);
    return res.json();
  },

  updateBookingStatus: async (id: number, status: string) => {
    const res = await apiRequest("PUT", `/api/bookings/${id}/status`, { status });
    return res.json();
  },
};

// Payment API
export const paymentAPI = {
  createPayment: async (paymentData: any) => {
    const res = await apiRequest("POST", "/api/payments", paymentData);
    return res.json();
  },

  getPayments: async (userId?: number) => {
    const searchParams = new URLSearchParams();
    if (userId) searchParams.set("userId", userId.toString());
    
    const res = await apiRequest("GET", `/api/payments?${searchParams}`);
    return res.json();
  },
};

// Review API
export const reviewAPI = {
  createReview: async (reviewData: any) => {
    const res = await apiRequest("POST", "/api/reviews", reviewData);
    return res.json();
  },

  getReviews: async (providerId?: number) => {
    const searchParams = new URLSearchParams();
    if (providerId) searchParams.set("providerId", providerId.toString());
    
    const res = await apiRequest("GET", `/api/reviews?${searchParams}`);
    return res.json();
  },

  updateReviewStatus: async (id: number, status: string) => {
    const res = await apiRequest("PUT", `/api/reviews/${id}/status`, { status });
    return res.json();
  },
};

// Admin API
export const adminAPI = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiRequest("GET", "/api/admin/stats");
    return res.json();
  },

  getUsers: async () => {
    const res = await apiRequest("GET", "/api/admin/users");
    return res.json();
  },

  updateUserStatus: async (id: number, status: string) => {
    const res = await apiRequest("PUT", `/api/admin/users/${id}/status`, { status });
    return res.json();
  },

  deleteUser: async (id: number) => {
    const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
    return res.json();
  },

  updateProviderKyc: async (id: number, verified: boolean) => {
    const res = await apiRequest("PUT", `/api/admin/providers/${id}/kyc`, { verified });
    return res.json();
  },

  updateProviderStatus: async (id: number, status: string) => {
    const res = await apiRequest("PUT", `/api/admin/providers/${id}/status`, { status });
    return res.json();
  },
};

// Message API
export const messageAPI = {
  sendMessage: async (messageData: any) => {
    const res = await apiRequest("POST", "/api/messages", messageData);
    return res.json();
  },

  getMessagesForUser: async (userId: number, userType: 'user' | 'provider') => {
    const res = await apiRequest("GET", `/api/messages/user/${userId}/${userType}`);
    return res.json();
  },

  getConversation: async (senderId: number, receiverId: number, senderType: string, receiverType: string) => {
    const res = await apiRequest("GET", `/api/messages/conversation/${senderId}/${receiverId}/${senderType}/${receiverType}`);
    return res.json();
  },

  markAsRead: async (messageId: number) => {
    const res = await apiRequest("PUT", `/api/messages/${messageId}/read`);
    return res.json();
  },

  getUnreadCount: async (userId: number, userType: 'user' | 'provider') => {
    const res = await apiRequest("GET", `/api/messages/unread/${userId}/${userType}`);
    return res.json();
  },
};
