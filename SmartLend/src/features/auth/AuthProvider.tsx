import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // 1. Check active session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setLoading(false);
//     });

//     // 2. Listen for auth changes
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       setLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const signOut = async () => {
//     await supabase.auth.signOut();
//   };

//   // Safe extraction of role
//   const role = session?.user?.app_metadata?.role || 'applicant';

//   return (
//     <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, signOut }}>
//       {loading ? (
//   <div className="min-h-screen flex items-center justify-center bg-gray-50">
//     <p className="text-gray-600 text-sm">Checking authentication…</p>
//   </div>
// ) : (
//   children
// )}
//     </AuthContext.Provider>
//   );
// }
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const role = session?.user?.app_metadata?.role || 'applicant';

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, signOut }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <span>Loading…</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};