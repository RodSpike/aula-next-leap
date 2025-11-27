-- Create a security definer function to check if user is master admin
CREATE OR REPLACE FUNCTION public.is_master_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
  RETURN user_email = 'rodspike2k8@gmail.com';
END;
$$;

-- Drop the problematic policies that query auth.users directly
DROP POLICY IF EXISTS "Master admin can delete courses" ON courses;
DROP POLICY IF EXISTS "Master admin can update courses" ON courses;

-- Recreate policies using the secure function
CREATE POLICY "Master admin can delete courses" ON courses
FOR DELETE USING (is_master_admin(auth.uid()));

CREATE POLICY "Master admin can update courses" ON courses
FOR UPDATE USING (is_master_admin(auth.uid()));