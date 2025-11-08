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
        console.log('[ProtectedRoute] Checking access for user:', user.id);
        
        // Check user role via secure RPC to avoid RLS issues
        const { data: isAdminData, error: roleRpcError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        console.log('[ProtectedRoute] Admin check result:', { isAdminData, roleRpcError });

        const isAdmin = isAdminData === true && !roleRpcError;
        if (isAdmin) {
          console.log('[ProtectedRoute] User is admin, granting permanent free access');
          setUserRole({ role: 'admin' });
          setSubscriptionStatus({ subscribed: true });
          setLoading(false);
          return; // Admins have permanent free access
        }

        // Check for free user access granted by admin
        console.log('[ProtectedRoute] Checking admin-granted free access...');
        const { data: freeUserData, error: freeAccessError } = await supabase.functions.invoke('check-free-access');
        console.log('[ProtectedRoute] Free access result:', { freeUserData, freeAccessError });
        
        if (freeUserData?.has_free_access) {
          console.log('[ProtectedRoute] User has admin-granted free access');
          setSubscriptionStatus({ subscribed: true });
          setLoading(false);
          return;
        }

        // Check subscription for regular users via function first
        console.log('[ProtectedRoute] Checking subscription...');
        const { data, error } = await supabase.functions.invoke('check-subscription');
        let finalStatus: SubscriptionStatus = { subscribed: false };

        if (error) {
          console.error('[ProtectedRoute] Error checking subscription:', error);
        } else if (data) {
          console.log('[ProtectedRoute] Subscription data:', data);
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

  // Admins have unrestricted access to all content (no subscription or placement test required)
  // Regular users need valid subscription/trial, or be on specific allowed pages
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const hasAccess = userRole?.role === 'admin' || 
                    subscriptionStatus?.subscribed || 
                    subscriptionStatus?.in_trial ||
                    path === '/placement-test' ||
                    path === '/settings' ||
                    path === '/subscribe';  // Allow access to subscribe page for completing checkout

  // Detect browser reload to avoid false-positive redirect during auth/subscription checks
  const navEntry = (typeof performance !== 'undefined' && (performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined)) || undefined;
  const isReload = !!navEntry && navEntry.type === 'reload';

  // Don't redirect if we just checked and user doesn't have access but is on a non-protected route
  const isPublicRoute = ['/', '/login', '/signup', '/placement-test', '/subscribe'].includes(path) || path.startsWith('/course/');
  
  if (!hasAccess && !isPublicRoute && !isReload) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}