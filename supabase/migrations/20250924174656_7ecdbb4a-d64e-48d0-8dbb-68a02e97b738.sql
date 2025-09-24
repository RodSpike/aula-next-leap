-- Add admin role for carladmiranda@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE au.email = 'carladmiranda@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = au.id AND ur.role = 'admin'::app_role
);