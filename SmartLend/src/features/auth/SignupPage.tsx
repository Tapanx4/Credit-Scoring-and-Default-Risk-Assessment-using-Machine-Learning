
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'applicant'
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Assuming "Enable Email Confirmations" is OFF in Supabase,
    // data.session will be present immediately.
    if (data.session) {
      navigate('/'); 
    } else {
      // Fallback if confirmations are still on
      alert("Please check your email to confirm your account.");
      navigate('/login');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-brand-900 mb-2">Create Account</h2>
        <p className="text-center text-gray-600 mb-6">Check your rate in 2 minutes. No credit impact.</p>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input name="fullName" label="Full Name" required />
          <Input name="email" type="email" label="Email Address" required />
          <Input name="password" type="password" label="Create Password" required minLength={8} />
          
          <Button type="submit" className="w-full" isLoading={loading}>
            Get Started
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}