-- Fix recursive RLS issue on user_roles table - complete cleanup
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Master admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Existing admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Master admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email IN ('rodspike2k8@gmail.com', 'luccadtoledo@gmail.com')
  )
);