
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api'; 
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { toast } from 'sonner'; // <--- Import toast

export default function CreateUnderwriterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    // Explicitly getting role if we add a dropdown later, for now hardcoded
    const role = 'underwriter'; 
        const toastId = toast.loading("Creating account...");

    try {
      // Ensure this matches backend/app/api/v1/admin.py CreateUserRequest schema
      await api.post('/admin/users', {
        email,
        password,
        full_name: fullName,
        role: role, // Explicitly sending 'underwriter'
        force_password_change: true
      });
      
      toast.success(`Staff account created! Credentials sent to ${email}.`, { id: toastId });
setTimeout(() => navigate('/admin'), 1000);    } catch (err: any) {
         console.error(err);
      const msg = err.response?.data?.detail || "Failed to create user. Ensure you are an Admin.";
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="p-0 hover:bg-transparent">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Create Staff Account</h1>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-6">
            <p className="text-sm text-blue-800 flex items-start gap-2">
                <UserPlus className="w-4 h-4 mt-0.5" />
                This will create a user with <strong>Underwriter</strong> privileges. They will receive an email with their temporary password.
            </p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm border border-red-100">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="fullName" label="Staff Name" required placeholder="e.g. Jane Doe" />
          <Input name="email" type="email" label="Staff Email" required placeholder="jane@smartlend.com" />
          <Input name="password" type="password" label="Temporary Password" required minLength={8} />
          
          <div className="flex gap-4 mt-8 pt-4 border-t">
            <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/admin')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="w-full bg-brand-600 hover:bg-brand-700">
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}