-- Create a secure function for public profile searches that only returns safe fields
CREATE OR REPLACE FUNCTION public.search_profiles_public(search_term TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return non-sensitive fields for profile searches
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name
  FROM public.profiles p
  WHERE 
    auth.uid() IS NOT NULL -- Must be authenticated
    AND p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID) -- Exclude own profile
    AND (
      p.username ILIKE '%' || search_term || '%'
      OR p.display_name ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    -- Prioritize exact matches
    CASE WHEN p.username ILIKE search_term THEN 1
         WHEN p.display_name ILIKE search_term THEN 2
         ELSE 3
    END,
    p.display_name
  LIMIT 10;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_profiles_public(TEXT) TO authenticated;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.search_profiles_public(TEXT) IS 
'Secure function for searching user profiles that only returns non-sensitive fields (user_id, username, display_name). Email addresses, birthdates, and other sensitive data are never exposed through this function.';

-- Ensure no general public access to profiles table remains
-- The existing policies should be:
-- 1. "Profiles are viewable by owner" - users can view their own complete profile
-- 2. "Admins can view all profiles" - admins can view all profiles including sensitive data
-- 3. No public search policy - searches must go through the secure function