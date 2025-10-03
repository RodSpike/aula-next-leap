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
        // Check user role via secure RPC to avoid RLS issues
        const { data: isAdminData, error: roleRpcError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        const isAdmin = isAdminData === true && !roleRpcError;
        if (isAdmin) {
          setUserRole({ role: 'admin' });
          setSubscriptionStatus({ subscribed: true });
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

        // Check subscription for regular users via function first
        const { data, error } = await supabase.functions.invoke('check-subscription');
        let finalStatus: SubscriptionStatus = { subscribed: false };

        if (error) {
          console.error('Error checking subscription:', error);
        } else if (data) {
          finalStatus = data as SubscriptionStatus;
        }

        // Fallback: read from user_subscriptions table directly
        try {
          const { data: subRow } = await supabase
            .from('user_subscriptions')
            .select('subscription_status, trial_ends_at, current_period_end')
            .eq('user_id', user.id)
            .maybeSingle();

          const now = new Date();
          const inTrial = subRow?.trial_ends_at ? new Date(subRow.trial_ends_at) > now : false;
          const isActive = (subRow?.subscription_status === 'active') || (subRow?.current_period_end ? new Date(subRow.current_period_end) > now : false);

          if (!finalStatus.subscribed && (inTrial || isActive)) {
            finalStatus = { subscribed: true, in_trial: inTrial, trial_ends_at: subRow?.trial_ends_at ?? undefined };
          }
        } catch (e) {
          console.warn('Subscription fallback check failed', e);
        }

        setSubscriptionStatus(finalStatus);
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
    return <Navigate to="/" replace />;
  }

  // Admins and users with valid subscriptions bypass
  const hasAccess = userRole?.role === 'admin' || 
                    subscriptionStatus?.subscribed || 
                    subscriptionStatus?.in_trial;

  if (!hasAccess) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}