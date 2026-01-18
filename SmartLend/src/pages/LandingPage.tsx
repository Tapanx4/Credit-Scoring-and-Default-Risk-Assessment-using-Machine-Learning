import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShieldCheck, Zap, BarChart3, ChevronRight, Lock, TrendingUp } from 'lucide-react';
import { useAuth } from '../features/auth/AuthProvider';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* --- Navbar --- */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">SmartLend</span>
            </div>
            <div className="flex gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-brand-600">Log In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="relative overflow-hidden pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-8 border border-brand-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Now funding loans in 24 hours
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Lending powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">Intelligence.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-10">
            Get an instant decision with our AI-driven underwriting engine. 
            Fair rates, zero hidden fees, and bank-grade security.
          </p>
          
          <div className="flex justify-center gap-4">
             <Link to="/signup">
                <Button className="h-12 px-8 text-lg rounded-full shadow-lg shadow-brand-200">
                  Check Your Rate <ChevronRight className="ml-2 w-5 h-5"/>
                </Button>
             </Link>
          </div>
          
          <div className="mt-12 flex justify-center gap-8 text-sm text-gray-400 font-medium">
             <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/> No credit impact to check</span>
             <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/> 256-bit Encryption</span>
             <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/> Instant Funding</span>
          </div>
        </div>
      </div>

      {/* --- Features Grid --- */}
      <div className="bg-gray-50 py-24 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Decisions</h3>
              <p className="text-gray-500 leading-relaxed">
                Our machine learning models analyze thousands of data points in seconds to give you a fair decision instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Risk-Based Pricing</h3>
              <p className="text-gray-500 leading-relaxed">
                We reward financial responsibility. Your rate is personalized to your unique profile, not just a generic score.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bank-Grade Security</h3>
              <p className="text-gray-500 leading-relaxed">
                Your data is protected by the same encryption standards used by major financial institutions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Stats Section --- */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
                <div>
                    <div className="text-4xl font-extrabold text-brand-900">$2B+</div>
                    <div className="text-sm font-medium text-gray-500 mt-2 uppercase tracking-wide">Loans Funded</div>
                </div>
                <div>
                    <div className="text-4xl font-extrabold text-brand-900">150k+</div>
                    <div className="text-sm font-medium text-gray-500 mt-2 uppercase tracking-wide">Happy Customers</div>
                </div>
                <div>
                    <div className="text-4xl font-extrabold text-brand-900">2 min</div>
                    <div className="text-sm font-medium text-gray-500 mt-2 uppercase tracking-wide">To Apply</div>
                </div>
                <div>
                    <div className="text-4xl font-extrabold text-brand-900">24/7</div>
                    <div className="text-sm font-medium text-gray-500 mt-2 uppercase tracking-wide">Support</div>
                </div>
            </div>
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <ShieldCheck className="w-6 h-6 text-brand-400" />
              <span className="text-xl font-bold text-white tracking-tight">SmartLend</span>
            </div>
            <div className="text-sm">
                © 2025 SmartLend Financial. All rights reserved.
            </div>
        </div>
      </footer>
    </div>
  );
}

function Check({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    )
}