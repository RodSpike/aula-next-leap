
-- Allow admins to view all user roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create affiliate records for existing teachers
INSERT INTO teacher_affiliates (user_id, full_name, cpf, referral_code, commission_rate, status)
VALUES 
  ('8368dbbb-b4b0-4a2c-874f-23bf99688886', 'Rod', '', 'PROF8368DB', 20, 'approved'),
  ('43bcf51e-1c3f-4f8d-b9c5-2ef329b3fe52', 'Carla Miranda', '', 'PROF43BCF5', 20, 'approved')
ON CONFLICT DO NOTHING;
