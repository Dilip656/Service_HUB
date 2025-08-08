import { Link } from 'wouter';
import { Shield, Star, Clock, ArrowRight, CheckCircle, Users, CreditCard, HeartHandshake } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-primary text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center animate-slide-up">
            <div className="mb-6 inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
              <CheckCircle className="w-4 h-4 mr-2" />
              Trusted by 1000+ customers
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
              Find Trusted Service
              <span className="block text-gradient bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-300">
                Professionals
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-3xl mx-auto leading-relaxed">
              Connect with verified, skilled professionals for all your service needs. 
              From home repairs to personal care, we've got you covered with secure payments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services">
                <button className="group bg-white text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl hover-lift inline-flex items-center">
                  Explore Services 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/auth?mode=provider">
                <button className="group glass-card text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all duration-300 inline-flex items-center">
                  Become a Provider
                  <Users className="ml-2 w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-yellow-300/20 rounded-full animate-bounce-in"></div>
        <div className="absolute top-1/2 right-20 w-12 h-12 bg-green-300/20 rounded-full animate-pulse-slow"></div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-slide-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose ServiceHub?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Built for trust, designed for convenience, powered by secure payments</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center p-8 bg-white rounded-2xl shadow-card hover-lift animate-scale-in group">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:shadow-elevated transition-all">
                <Shield className="text-white w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Verified Professionals</h3>
              <p className="text-gray-600 leading-relaxed">
                All service providers undergo thorough KYC verification and background checks for your safety and peace of mind.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-card hover-lift animate-scale-in group">
              <div className="w-20 h-20 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:shadow-elevated transition-all">
                <Star className="text-white w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Quality Guaranteed</h3>
              <p className="text-gray-600 leading-relaxed">
                Read authentic reviews, compare ratings, and choose the best professional based on real customer experiences.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-card hover-lift animate-scale-in group">
              <div className="w-20 h-20 bg-gradient-warm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:shadow-elevated transition-all">
                <Clock className="text-white w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Quick & Easy</h3>
              <p className="text-gray-600 leading-relaxed">
                Book services in minutes with our streamlined process and secure payment gateway integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <h3 className="text-4xl font-bold text-gray-900 mb-6">
                Secure Payment System
              </h3>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Experience worry-free transactions with our integrated Razorpay payment gateway. 
                Pay securely with cards, UPI, net banking, or digital wallets.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 w-6 h-6 mr-3" />
                  <span className="text-gray-700">256-bit SSL encryption</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 w-6 h-6 mr-3" />
                  <span className="text-gray-700">Multiple payment options</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 w-6 h-6 mr-3" />
                  <span className="text-gray-700">Instant payment verification</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 w-6 h-6 mr-3" />
                  <span className="text-gray-700">Automated booking confirmation</span>
                </div>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="bg-gradient-primary p-8 rounded-3xl text-white shadow-elevated">
                <CreditCard className="w-16 h-16 mb-6" />
                <h4 className="text-2xl font-bold mb-4">Payment Made Simple</h4>
                <p className="text-lg opacity-90 mb-6">
                  Integrated with Razorpay for seamless, secure transactions
                </p>
                <div className="flex space-x-3">
                  <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center text-xs font-bold">VISA</div>
                  <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center text-xs font-bold">UPI</div>
                  <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center text-xs font-bold">MC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-cool text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <HeartHandshake className="w-16 h-16 mx-auto mb-6" />
          <h3 className="text-4xl font-bold mb-6">Ready to Get Started?</h3>
          <p className="text-xl mb-10 opacity-90 leading-relaxed">
            Join thousands of satisfied customers who trust ServiceHub for their service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all shadow-xl hover-lift">
                Browse Services
              </button>
            </Link>
            <Link href="/auth">
              <button className="glass-card px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all">
                Create Account
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
