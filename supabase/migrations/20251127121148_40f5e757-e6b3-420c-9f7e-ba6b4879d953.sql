-- Allow master admin (rodspike2k8@gmail.com) to delete courses
CREATE POLICY "Master admin can delete courses"
ON public.courses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.email = 'rodspike2k8@gmail.com'
  )
);

-- Also allow master admin to update courses (for admin_only flag changes)
CREATE POLICY "Master admin can update courses"
ON public.courses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.email = 'rodspike2k8@gmail.com'
  )
);

-- Update ENEM courses to no longer be admin-only
UPDATE public.courses
SET admin_only = false
WHERE course_type = 'enem';