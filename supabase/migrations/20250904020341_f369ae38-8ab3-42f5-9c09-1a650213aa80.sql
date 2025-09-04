-- Fix recursive RLS issue on user_roles table
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new policies that don't cause recursion
-- Allow users to view their own roles without using has_role function
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow specific admin emails to view all roles directly
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

-- Allow users with admin role in the table to view all roles (non-recursive)
CREATE POLICY "Existing admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);