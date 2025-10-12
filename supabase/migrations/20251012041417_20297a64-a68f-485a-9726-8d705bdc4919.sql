-- Add promoted_by column to user_roles table for admin promotion tracking
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS promoted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_roles_promoted_by ON public.user_roles(promoted_by);

-- Comment: Admin promotion/demotion functions should now work with the promoted_by column