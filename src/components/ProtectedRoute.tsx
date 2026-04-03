import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface SubscriptionStatus {
  subscribed: boolean;
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
  const [accessChecked, setAccessChecked] = useState(false);
  
  // Track the user ID we last checked so we only re-check on actual user change
  const lastCheckedUserId = useRef<string | null>(null);
  // Keep previous access result to avoid flashing redirects during re-checks
  const previousAccessGranted = useRef(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        lastCheckedUserId.current = null;
        previousAccessGranted.current = false;
        setSubscriptionStatus(null);
        setUserRole(null);
        setLoading(false);
        setAccessChecked(true);
        return;
      }

      // If we already checked this exact user, skip re-checking
      if (lastCheckedUserId.current === user.id && accessChecked) {
        return;
      }

      // Only show loading if we haven't granted access before (avoids flicker on token refresh)
      if (!previousAccessGranted.current) {
        setLoading(true);
      }

      try {
        console.log('[ProtectedRoute] Checking access for user:', user.id);
        
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const { data: adminResp, error: adminError } = await supabase.functions.invoke('check-admin', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const isAdmin = adminResp?.is_admin === true && !adminError;
        if (isAdmin) {
          setUserRole({ role: 'admin' });
          setSubscriptionStatus({ subscribed: true });
          previousAccessGranted.current = true;
          lastCheckedUserId.current = user.id;
          setLoading(false);
          setAccessChecked(true);
          return;
        }

        const { data: freeUserData } = await supabase.functions.invoke('check-free-access');
        
        if (freeUserData?.has_free_access) {
          setSubscriptionStatus({ subscribed: true });
          previousAccessGranted.current = true;
          lastCheckedUserId.current = user.id;
          setLoading(false);
          setAccessChecked(true);
          return;
        }

        const { data, error } = await supabase.functions.invoke('check-subscription');
        let finalStatus: SubscriptionStatus = { subscribed: false };

        if (!error && data) {
          finalStatus = data as SubscriptionStatus;
        }

        try {
          const { data: subRow } = await supabase
            .from('user_subscriptions')
            .select('subscription_status, current_period_end')
            .eq('user_id', user.id)
            .maybeSingle();

          const now = new Date();
          const isActive = (subRow?.subscription_status === 'active') || 
                          (subRow?.current_period_end ? new Date(subRow.current_period_end) > now : false);

          if (!finalStatus.subscribed && isActive) {
            finalStatus = { subscribed: true };
          }
        } catch (e) {
          console.warn('Subscription fallback check failed', e);
        }

        setSubscriptionStatus(finalStatus);
        previousAccessGranted.current = finalStatus.subscribed;
        lastCheckedUserId.current = user.id;
      } catch (error) {
        console.error('Error checking access:', error);
        // On error, keep previous access if we had it (don't kick user out on transient failures)
        if (!previousAccessGranted.current) {
          setSubscriptionStatus({ subscribed: false });
        }
        lastCheckedUserId.current = user.id;
      } finally {
        setLoading(false);
        setAccessChecked(true);
      }
    };

    checkAccess();
  }, [user?.id]); // Only re-run when the actual user ID changes, not on object reference changes

  if (authLoading || (loading && !previousAccessGranted.current) || (!accessChecked && !previousAccessGranted.current)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const allowedWithoutSubscription = ['/subscribe', '/settings'];
  const isAllowedWithoutSub = allowedWithoutSubscription.some(p => path === p || path.startsWith(p + '/'));
  
  const hasAccess = userRole?.role === 'admin' || 
                    subscriptionStatus?.subscribed ||
                    previousAccessGranted.current;

  if (!hasAccess && !isAllowedWithoutSub) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}