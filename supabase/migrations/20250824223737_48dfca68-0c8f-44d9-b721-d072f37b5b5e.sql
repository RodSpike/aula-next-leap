-- Force remove the dangerous policy 
DROP POLICY "Users can search profiles by public fields only" ON public.profiles CASCADE;

-- Verify all current policies are secure
-- Now the profiles table should only have:
-- 1. "Profiles are viewable by owner" - users can view their own profile
-- 2. "Admins can view all profiles" - admins can view all profiles  
-- 3. "Users can insert their own profile" - for profile creation
-- 4. "Users can update their own profile" - for profile updates

-- No public search access to the main profiles table
-- All searches must use the secure search_profiles_public function