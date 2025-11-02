-- Allow unauthenticated users to insert into prospects table during signup
CREATE POLICY "Allow unauthenticated inserts for prospects"
ON public.prospects
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow users to update their own prospect record
CREATE POLICY "Allow users to update their own prospect"
ON public.prospects
FOR UPDATE
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow users to view their own prospect record
CREATE POLICY "Allow users to view their own prospect"
ON public.prospects
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));