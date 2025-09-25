-- Create table for admin-granted free users
CREATE TABLE public.admin_free_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.admin_free_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_free_users table
CREATE POLICY "Admins can manage free users" 
ON public.admin_free_users 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at
CREATE TRIGGER update_admin_free_users_updated_at
BEFORE UPDATE ON public.admin_free_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();