-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create community groups table
CREATE TABLE public.community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL CHECK (level IN ('Basic', 'Intermediate', 'Advanced')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on community_groups
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

-- Create group_members table
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    can_post BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (group_id, user_id)
);

-- Enable RLS on group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create group_posts table
CREATE TABLE public.group_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on group_posts
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- Create user_subscriptions table for tracking paid/free users
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'paid')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '3 days'),
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for community_groups
CREATE POLICY "Everyone can view groups" ON public.community_groups
FOR SELECT USING (true);

CREATE POLICY "Users can create groups (max 5)" ON public.community_groups
FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    (SELECT COUNT(*) FROM public.community_groups WHERE created_by = auth.uid() AND is_default = false) < 5
);

CREATE POLICY "Admins can create unlimited groups" ON public.community_groups
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Group creators and admins can update groups" ON public.community_groups
FOR UPDATE USING (
    auth.uid() = created_by OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete groups" ON public.community_groups
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for group_members
CREATE POLICY "Everyone can view group memberships" ON public.group_members
FOR SELECT USING (true);

CREATE POLICY "Group creators can invite members" ON public.group_members
FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.community_groups WHERE id = group_id AND created_by = auth.uid())
);

CREATE POLICY "Users can accept their own invitations" ON public.group_members
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for group_posts
CREATE POLICY "Everyone can view posts" ON public.group_posts
FOR SELECT USING (true);

CREATE POLICY "Members can post if they have permission" ON public.group_posts
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = group_posts.group_id 
        AND user_id = auth.uid() 
        AND status = 'accepted' 
        AND can_post = true
    )
);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create default groups
INSERT INTO public.community_groups (name, description, level, created_by, is_default) VALUES
('Basic English Learners', 'A group for beginners starting their English learning journey', 'Basic', (SELECT id FROM auth.users LIMIT 1), true),
('Intermediate English Practice', 'Practice your English skills with fellow intermediate learners', 'Intermediate', (SELECT id FROM auth.users LIMIT 1), true),
('Advanced English Mastery', 'Advanced discussions and practice for fluent English speakers', 'Advanced', (SELECT id FROM auth.users LIMIT 1), true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create subscription record for new user
  INSERT INTO public.user_subscriptions (user_id, plan, trial_ends_at)
  VALUES (NEW.id, 'free', now() + INTERVAL '3 days');
  
  -- Give default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user subscription
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Grant admin role to the specified email
DO $$
BEGIN
  -- First check if user with this email exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'rodspike2k8@gmail.com') THEN
    -- Delete existing role if any
    DELETE FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'rodspike2k8@gmail.com');
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'rodspike2k8@gmail.com';
  END IF;
END $$;

-- Add trigger for updating timestamps
CREATE TRIGGER update_community_groups_updated_at
BEFORE UPDATE ON public.community_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_posts_updated_at
BEFORE UPDATE ON public.group_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();