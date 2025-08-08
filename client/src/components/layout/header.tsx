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
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              <i className="fas fa-tools mr-2"></i>ServiceHub
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Only show Browse Services to non-provider users - don't show during loading */}
            {!isLoading && (!user || (user as any).type !== 'provider') && (
              <Link 
                href="/services" 
                className={`text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${
                  location === '/services' ? 'text-primary' : ''
                }`}
              >
                Browse Services
              </Link>
            )}
            
            {!isLoading && user ? (
              <>
                <Link 
                  href={(user as any).type === 'provider' ? '/provider-dashboard' : '/user-dashboard'}
                  className={`text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${
                    location === '/user-dashboard' || location === '/provider-dashboard' ? 'text-primary' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <span className="text-gray-600 px-3 py-2 text-sm">Welcome, {user.name}!</span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('user');
                    setUser(null);
                    window.location.href = '/';
                  }}
                  className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : !isLoading ? (
              <>
                <Link 
                  href="/auth" 
                  className={`text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${
                    location === '/auth' ? 'text-primary' : ''
                  }`}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth?mode=signup" 
                  className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </>
            ) : null}
            
            <Link 
              href="/admin" 
              className="text-gray-400 hover:text-gray-600 px-2 py-2 text-xs"
            >
              Admin
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
