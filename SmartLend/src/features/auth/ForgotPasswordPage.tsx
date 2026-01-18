
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const email = (new FormData(e.currentTarget)).get('email') as string;
    
    // Request a numeric code (OTP) via email
    // Config: Ensure your Supabase "Magic Link" template uses {{ .Token }} instead of a link.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Recovery only
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Navigate to Update Password page with email pre-filled
      navigate('/update-password', { state: { email } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
        <p className="text-gray-600 text-center mb-6 text-sm">
          Enter your email to receive a verification code.
        </p>
        
        {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <Input name="email" type="email" label="Email Address" required />
          <Button type="submit" className="w-full" isLoading={loading}>
            Send Verification Code
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-brand-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}