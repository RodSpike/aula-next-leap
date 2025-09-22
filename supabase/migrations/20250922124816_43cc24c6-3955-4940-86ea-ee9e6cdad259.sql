-- Remove admin role from luccadtoledo@gmail.com
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'luccadtoledo@gmail.com'
) AND role = 'admin'::app_role;