
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from './AuthProvider'; 

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth(); // Get current user context
  
  // Get pre-filled email from navigation state
  const defaultEmail = location.state?.email || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is NOT logged in, they need to verify via code/email first (Forgot Password flow)
  const showVerificationFields = !user;

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    // Inputs for manual verification flow
    const email = formData.get('email') as string;
    const token = formData.get('code') as string;

    // 1. Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // 2. If not logged in, verify OTP first (Exchange Code for Session)
      if (showVerificationFields) {
        if (!email || !token) {
           throw new Error("Please enter your Email and Verification Code.");
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email', // Verifies the code sent via signInWithOtp
        });

        if (verifyError) throw verifyError;
      }

      // 3. Update User Password (Now authenticated via OTP or Session)
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;

      alert("Password updated successfully!");
      
      // Navigate to login to force re-auth with new credentials
      navigate('/login');
      
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // If in Forgot Password flow (not logged in), 'Back' means 'Back to Login'
    if (!user) {
      navigate('/login');
      return;
    }
    
    // If logged in (Dashboard flow), 'Back' means 'Return to Dashboard'
    if (role === 'admin') navigate('/admin');
    else if (role === 'underwriter') navigate('/underwriter');
    else navigate('/'); // Applicant dashboard
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Set New Password</h2>
        
        {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded">{error}</div>}
        
        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Only show verification fields if user is NOT logged in via link */}
          {showVerificationFields && (
            <>
              <div className="text-sm text-gray-600 mb-2">
                We sent a code to <strong>{defaultEmail || "your email"}</strong>.
              </div>
              <Input 
                name="email" 
                type="email" 
                label="Email Address" 
                placeholder="Enter your email"
                defaultValue={defaultEmail}
                required 
              />
              <Input 
                name="code" 
                type="text" 
                label="Verification Code" 
                placeholder="Enter the code" 
                required 
              />
              <div className="border-b border-gray-200 my-4"></div>
            </>
          )}

          <Input 
            name="password" 
            type="password" 
            label="New Password" 
            required 
            minLength={6} 
          />
          <Input 
            name="confirmPassword" 
            type="password" 
            label="Confirm New Password" 
            required 
            minLength={6} 
          />
          
          <div className="flex flex-col gap-3 mt-6">
            <Button type="submit" className="w-full" isLoading={loading}>
              {showVerificationFields ? "Verify & Update Password" : "Update Password"}
            </Button>
            
            <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
              {showVerificationFields ? "Back to Login" : "Cancel"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}