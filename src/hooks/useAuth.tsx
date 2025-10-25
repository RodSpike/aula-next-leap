import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle successful email confirmation (defer Supabase calls)
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('birthdate, cambridge_level')
                .eq('user_id', session.user.id)
                .single();

              // Check if user is admin
              const { data: hasAdminRole } = await supabase.rpc('has_role', {
                _user_id: session.user.id,
                _role: 'admin',
              });

              // Only redirect after a real login flow (login/signup/root). Otherwise, stay put.
              const currentPath = window.location.pathname;
              const isAuthContext = currentPath === '/' || currentPath === '/login' || currentPath === '/signup';

              if (isAuthContext) {
                if (hasAdminRole) {
                  // Admins go directly to dashboard
                  navigate('/dashboard');
                } else if (!profile?.birthdate) {
                  navigate('/onboarding');
                } else {
                  navigate('/dashboard');
                }
              }
            } catch (e) {
              const currentPath = window.location.pathname;
              const isAuthContext = currentPath === '/' || currentPath === '/login' || currentPath === '/signup';
              if (isAuthContext) {
                // If profile doesn't exist, go to onboarding
                navigate('/onboarding');
              }
            }
          }, 0);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string, fullName: string, username?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          username: username,
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Log login activity
    if (!error && data.user) {
      try {
        await supabase.from('user_activity_logs').insert({
          user_id: data.user.id,
          action: 'login',
          context: { method: 'email' }
        });
      } catch (logError) {
        console.error('Failed to log login activity:', logError);
      }
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      // Clean up any existing auth state first
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      return { error };
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}