
CREATE POLICY "Anyone can view approved affiliates"
  ON public.teacher_affiliates FOR SELECT
  TO public
  USING (status = 'approved');
