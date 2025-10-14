-- Allow admins to manage courses
CREATE POLICY "Admins can insert courses" 
ON public.courses 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courses" 
ON public.courses 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courses" 
ON public.courses 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage lessons
CREATE POLICY "Admins can insert lessons" 
ON public.lessons 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lessons" 
ON public.lessons 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lessons" 
ON public.lessons 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage lesson_content
CREATE POLICY "Admins can insert lesson content" 
ON public.lesson_content 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lesson content" 
ON public.lesson_content 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lesson content" 
ON public.lesson_content 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage exercises
CREATE POLICY "Admins can insert exercises" 
ON public.exercises 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update exercises" 
ON public.exercises 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete exercises" 
ON public.exercises 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage level_tests
CREATE POLICY "Admins can insert level tests" 
ON public.level_tests 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update level tests" 
ON public.level_tests 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete level tests" 
ON public.level_tests 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));