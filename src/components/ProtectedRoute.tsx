import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface SubscriptionStatus {
  subscribed: boolean;
  in_trial?: boolean;
  trial_ends_at?: string;
  product_id?: string;
}

interface UserRole {
  role: string;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check user role first
        const { data: roleData, error: roleError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (!roleError && roleData) {
          setUserRole({ role: 'admin' });
          setLoading(false);
          return; // Admins bypass subscription checks
        }

        // Check for free user access
        const { data: freeUserData } = await supabase.functions.invoke('check-free-access');
        if (freeUserData?.has_free_access) {
          setSubscriptionStatus({ subscribed: true });
          setLoading(false);
          return;
        }

        // Check subscription for regular users
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error checking subscription:', error);
          setSubscriptionStatus({ subscribed: false });
        } else {
          setSubscriptionStatus(data);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setSubscriptionStatus({ subscribed: false });
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins bypass subscription requirements
  if (userRole?.role === 'admin') {
    return <>{children}</>;
  }

  // If user doesn't have active subscription or trial, redirect to subscribe page
  if (!subscriptionStatus?.subscribed && !subscriptionStatus?.in_trial) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}