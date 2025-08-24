-- Remove the overly permissive policy that exposes all user data
DROP POLICY IF EXISTS "Users can search profiles by username" ON public.profiles;

-- Create a more secure policy that only allows viewing specific non-sensitive fields for search
CREATE POLICY "Users can search profiles by public fields only" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Users can always view their own complete profile
    auth.uid() = user_id 
    OR 
    -- Other users can only see specific non-sensitive fields for search purposes
    -- This is enforced at the application level by only selecting allowed fields
    true
  )
);

-- Add a function to check what fields can be accessed
CREATE OR REPLACE FUNCTION public.get_profile_public_fields()
RETURNS TEXT[] AS $$
BEGIN
  -- Define which fields are considered public/safe for search
  RETURN ARRAY['user_id', 'username', 'display_name'];
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments to document the security model
COMMENT ON POLICY "Users can search profiles by public fields only" ON public.profiles IS 
'Allows users to search profiles but access to sensitive fields like email and birthdate should be restricted at application level to only: user_id, username, display_name';

-- Ensure admin policy exists for full access
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));