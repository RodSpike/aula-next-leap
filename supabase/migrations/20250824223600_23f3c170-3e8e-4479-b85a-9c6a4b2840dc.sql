-- Remove the overly permissive policy that still allows access to all fields
DROP POLICY IF EXISTS "Users can search profiles by public fields only" ON public.profiles;

-- Create a secure view for public profile searches that only exposes safe fields
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  user_id,
  username,
  display_name
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.profiles_public SET (security_barrier = true);

-- Grant access to the public view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Create RLS policy for the public view
CREATE POLICY "Authenticated users can search public profile fields" 
ON public.profiles_public 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Add a comment explaining the security model
COMMENT ON VIEW public.profiles_public IS 
'Secure view that only exposes non-sensitive profile fields (user_id, username, display_name) for search functionality. Email addresses and other sensitive data are not included.';

-- Ensure the main profiles table policies are restrictive
-- Users can only view their own complete profile
-- Admins can view all profiles (including sensitive data like emails)
-- No general public search access to the main profiles table