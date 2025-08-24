-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.get_profile_public_fields()
RETURNS TEXT[] 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Define which fields are considered public/safe for search
  RETURN ARRAY['user_id', 'username', 'display_name'];
END;
$$;