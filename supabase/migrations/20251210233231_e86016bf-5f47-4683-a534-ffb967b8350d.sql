-- Create table for placement test versions/history
CREATE TABLE public.placement_test_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_number INTEGER NOT NULL,
  questions JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.placement_test_versions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage placement test versions
CREATE POLICY "Admins can manage placement test versions" 
ON public.placement_test_versions 
FOR ALL 
USING (user_has_admin_role(auth.uid()));

-- Everyone can view active placement test
CREATE POLICY "Everyone can view active placement test" 
ON public.placement_test_versions 
FOR SELECT 
USING (is_active = true);

-- Create index for quick active version lookup
CREATE INDEX idx_placement_test_versions_active ON public.placement_test_versions(is_active) WHERE is_active = true;