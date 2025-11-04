-- Allow anonymous inserts into prospects for free user registration
DROP POLICY IF EXISTS "Public can insert prospects" ON public.prospects;

CREATE POLICY "Public can insert prospects"
  ON public.prospects
  FOR INSERT
  TO anon
  WITH CHECK (true);