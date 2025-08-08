import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';

export default function Header() {
  const [location] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  return (
    <header className="glass-card shadow-card sticky top-0 z-50 backdrop-blur-xl border-b border-white/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-bold text-gradient hover-scale transition-transform">
              <i className="fas fa-tools mr-3 text-primary"></i>ServiceHub
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            {/* Only show Browse Services to non-provider users - don't show during loading */}
            {!isLoading && (!user || (user as any).type !== 'provider') && (
              <Link 
                href="/services" 
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all hover-lift ${
                  location === '/services' 
                    ? 'bg-primary text-white shadow-glow' 
                    : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                }`}
                data-testid="nav-browse-services"
              >
                Browse Services
              </Link>
            )}
            
            {!isLoading && user ? (
              <div className="flex items-center space-x-2">
                <Link 
                  href={(user as any).type === 'provider' ? '/provider-dashboard' : '/user-dashboard'}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all hover-lift ${
                    location === '/user-dashboard' || location === '/provider-dashboard'
                      ? 'bg-primary text-white shadow-glow' 
                      : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                  }`}
                  data-testid="nav-dashboard"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 text-sm font-medium">Hi, {user.name}!</span>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('user');
                    setUser(null);
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all hover-lift"
                  data-testid="nav-logout"
                >
                  Logout
                </button>
              </div>
            ) : !isLoading ? (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/auth" 
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all hover-lift ${
                    location === '/auth' 
                      ? 'bg-primary text-white shadow-glow' 
                      : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                  }`}
                  data-testid="nav-signin"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth?mode=signup" 
                  className="bg-gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-glow transition-all hover-lift"
                  data-testid="nav-signup"
                >
                  Get Started
                </Link>
              </div>
            ) : null}
            

            <Link 
              href="/admin" 
              className="px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              data-testid="nav-admin"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
