import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { authAPI } from '@/lib/api';
import { useNotification } from '@/components/ui/notification';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const userSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  location: z.string().min(2, 'Location is required'),
});

const providerSignupSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  serviceName: z.string().min(1, 'Please select a service'),
  serviceCategory: z.string().min(1, 'Service category is required'),
  experience: z.number().min(0, 'Experience must be a positive number'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  hourlyRate: z.number().min(1, 'Hourly rate must be greater than 0'),
  location: z.string().min(2, 'Location is required'),
  availability: z.array(z.string()).min(1, 'Please select at least one availability day'),
});

export default function Auth() {
  const [, setLocation] = useLocation();
  const { showNotification } = useNotification();
  const [isSignup, setIsSignup] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});

  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  
  useEffect(() => {
    if (mode === 'signup') {
      setIsSignup(true);
    }
  }, [mode]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.login(email, password),
    onSuccess: (data) => {
      showNotification('Login successful!', 'success');
      localStorage.setItem('user', JSON.stringify(data.user));
      setLocation('/services');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Login failed', 'error');
    },
  });

  const userSignupMutation = useMutation({
    mutationFn: authAPI.registerUser,
    onSuccess: () => {
      showNotification('Account created successfully! Please sign in.', 'success');
      setIsSignup(false);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Registration failed', 'error');
    },
  });

  const providerSignupMutation = useMutation({
    mutationFn: authAPI.registerProvider,
    onSuccess: () => {
      showNotification('Registration successful! Your application is under review.', 'success');
      setIsSignup(false);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Registration failed', 'error');
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      loginSchema.parse(data);
      setFormErrors({});
      loginMutation.mutate({
        email: data.email as string,
        password: data.password as string,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(errors);
      }
    }
  };

  const handleUserSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      userSignupSchema.parse(data);
      setFormErrors({});
      userSignupMutation.mutate({
        name: data.name as string,
        email: data.email as string,
        password: data.password as string,
        phone: data.phone as string,
        location: data.location as string,
        status: 'Active',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(errors);
      }
    }
  };

  const handleProviderSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    // Handle availability checkboxes
    const availability = Array.from(formData.getAll('availability')) as string[];

    const providerData = {
      ...data,
      experience: parseInt(data.experience as string),
      hourlyRate: parseFloat(data.hourlyRate as string),
      availability,
      serviceCategory: getServiceCategory(data.serviceName as string),
      kycVerified: false,
      status: 'Pending',
      rating: null,
      reviewCount: 0,
      kycDocuments: {
        submitted_at: new Date().toISOString(),
      },
    };

    try {
      providerSignupSchema.parse(providerData);
      setFormErrors({});
      providerSignupMutation.mutate(providerData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(errors);
      }
    }
  };

  const getServiceCategory = (serviceName: string) => {
    const categories: any = {
      'Plumbing': 'home',
      'Electrical Work': 'home',
      'Painting': 'home',
      'Carpentry': 'home',
      'Home Cleaning': 'personal',
      'Personal Training': 'personal',
      'Pet Grooming': 'personal',
      'Photography': 'events',
      'Event Planning': 'events',
      'Catering': 'events',
      'IT Support': 'business',
      'Graphic Design': 'business',
    };
    return categories[serviceName] || 'business';
  };

  if (isSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
            <p className="mt-2 text-gray-600">Join ServiceHub today</p>
          </div>
          
          {/* Account Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setIsProvider(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isProvider
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              As a Customer
            </button>
            <button
              onClick={() => setIsProvider(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isProvider
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              As a Service Provider
            </button>
          </div>

          {!isProvider ? (
            // Customer Signup Form
            <form onSubmit={handleUserSignup} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City/Location</label>
                  <input
                    type="text"
                    name="location"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.location && <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>}
                </div>
              </div>
              <button
                type="submit"
                disabled={userSignupMutation.isPending}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {userSignupMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            // Provider Signup Form
            <form onSubmit={handleProviderSignup} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.businessName && <p className="text-red-500 text-sm mt-1">{formErrors.businessName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                  <input
                    type="text"
                    name="ownerName"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.ownerName && <p className="text-red-500 text-sm mt-1">{formErrors.ownerName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Service</label>
                  <select
                    name="serviceName"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select your primary service</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical Work">Electrical Work</option>
                    <option value="Painting">Painting</option>
                    <option value="Home Cleaning">Home Cleaning</option>
                    <option value="Photography">Photography</option>
                    <option value="IT Support">IT Support</option>
                  </select>
                  {formErrors.serviceName && <p className="text-red-500 text-sm mt-1">{formErrors.serviceName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="experience"
                    min="0"
                    max="50"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.experience && <p className="text-red-500 text-sm mt-1">{formErrors.experience}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    min="1"
                    step="0.01"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.hourlyRate && <p className="text-red-500 text-sm mt-1">{formErrors.hourlyRate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  />
                  {formErrors.location && <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          name="availability"
                          value={day}
                          className="mr-2"
                        />
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </label>
                    ))}
                  </div>
                  {formErrors.availability && <p className="text-red-500 text-sm mt-1">{formErrors.availability}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    placeholder="Describe your services and expertise..."
                  />
                  {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                </div>
              </div>
              <button
                type="submit"
                disabled={providerSignupMutation.isPending}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {providerSignupMutation.isPending ? 'Registering...' : 'Register as Provider'}
              </button>
            </form>
          )}

          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => setIsSignup(false)}
              className="text-primary font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your ServiceHub account</p>
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
              {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
              {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
            </div>
          </div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => setIsSignup(true)}
            className="text-primary font-semibold hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
