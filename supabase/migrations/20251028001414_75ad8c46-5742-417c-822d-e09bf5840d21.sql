-- Enable RLS explicitly (no-op if already enabled)
ALTER TABLE public.admin_free_users ENABLE ROW LEVEL SECURITY;

-- Allow admins to view free users in the app
DROP POLICY IF EXISTS "Admins can view free users" ON public.admin_free_users;
CREATE POLICY "Admins can view free users"
ON public.admin_free_users
FOR SELECT
USING (user_has_admin_role(auth.uid()));