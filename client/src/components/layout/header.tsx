import { Link, useLocation } from 'wouter';

export default function Header() {
  const [location] = useLocation();

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
            <Link 
              href="/services" 
              className={`text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${
                location === '/services' ? 'text-primary' : ''
              }`}
            >
              Browse Services
            </Link>
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
