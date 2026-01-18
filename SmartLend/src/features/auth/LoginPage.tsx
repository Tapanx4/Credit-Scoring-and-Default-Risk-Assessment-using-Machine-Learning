
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from './AuthProvider';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'underwriter') navigate('/underwriter');
      else navigate('/dashboard');
    }
  }, [user, role, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        toast.error("Please enter both email and password.");
        setLoading(false);
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      setError(error.message);
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Welcome back! Redirecting...");

    // Small delay to let the toast show before redirect
    setTimeout(() => {
        const userRole = data.user?.app_metadata?.role || 'applicant';
        if (userRole === 'admin') navigate('/admin');
        else if (userRole === 'underwriter') navigate('/underwriter');
        else navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 relative overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-100/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white shadow-lg mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            SmartLend
          </h1>
          <p className="text-gray-500 mt-2">Secure access to your financial future</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Welcome back</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <Input 
                name="email" 
                type="email" 
                label="Email Address" 
                placeholder="you@example.com" 
                required 
                className="bg-white"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="bg-white"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all" 
              isLoading={loading}
            >
              Sign In <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
          
          {/* Footer / Signup Link */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Don't have an account?</p>
              <Link to="/signup">
                <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700">
                  Create Applicant Account
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="w-3 h-3" />
          <span>256-bit SSL Encrypted Connection</span>
        </div>
      </div>
    </div>
  );
}