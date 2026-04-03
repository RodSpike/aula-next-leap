
-- Teacher affiliate profiles
CREATE TABLE public.teacher_affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  cpf text NOT NULL,
  cpf_verified boolean NOT NULL DEFAULT false,
  referral_code text NOT NULL UNIQUE,
  commission_rate numeric NOT NULL DEFAULT 10.0,
  total_earnings numeric NOT NULL DEFAULT 0,
  total_referrals integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  bio text,
  specialties text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own affiliate profile"
  ON public.teacher_affiliates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can update own affiliate profile"
  ON public.teacher_affiliates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create affiliate profile"
  ON public.teacher_affiliates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliate profiles"
  ON public.teacher_affiliates FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all affiliate profiles"
  ON public.teacher_affiliates FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Teacher guides per lesson
CREATE TABLE public.teacher_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  objectives text[] DEFAULT '{}',
  warm_up text,
  presentation_notes text,
  practice_activities jsonb DEFAULT '[]'::jsonb,
  assessment_tips text,
  differentiation_notes text,
  estimated_duration_minutes integer DEFAULT 60,
  additional_resources jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lesson_id)
);

ALTER TABLE public.teacher_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view teacher guides"
  ON public.teacher_guides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage teacher guides"
  ON public.teacher_guides FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Referral tracking
CREATE TABLE public.teacher_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teacher_affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  commission_amount numeric DEFAULT 0,
  commission_paid boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz
);

ALTER TABLE public.teacher_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own referrals"
  ON public.teacher_referrals FOR SELECT
  TO authenticated
  USING (teacher_id IN (SELECT id FROM public.teacher_affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all referrals"
  ON public.teacher_referrals FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert referrals"
  ON public.teacher_referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_teacher_affiliates_updated_at
  BEFORE UPDATE ON public.teacher_affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_guides_updated_at
  BEFORE UPDATE ON public.teacher_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
