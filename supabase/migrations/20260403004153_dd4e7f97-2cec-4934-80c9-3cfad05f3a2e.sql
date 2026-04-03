
-- Function to increment teacher referrals count
CREATE OR REPLACE FUNCTION public.increment_teacher_referrals(_teacher_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE teacher_affiliates
  SET total_referrals = total_referrals + 1,
      updated_at = now()
  WHERE id = _teacher_id;
END;
$$;

-- Allow admins to update teacher_affiliates (approve/reject)
CREATE POLICY "Admins can update teacher affiliates"
ON public.teacher_affiliates
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
