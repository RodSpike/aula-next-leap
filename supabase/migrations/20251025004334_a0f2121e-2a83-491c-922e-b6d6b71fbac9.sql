-- Create user_activity_logs table for tracking user actions
create table public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.user_activity_logs enable row level security;

-- Users can insert their own logs
create policy "Users can insert own activity logs"
on public.user_activity_logs
for insert
with check (auth.uid() = user_id);

-- Users can view their own logs, admins can view all
create policy "Users can view own logs, admins view all"
on public.user_activity_logs
for select
using (
  auth.uid() = user_id 
  OR user_has_admin_role(auth.uid())
);

-- Create index for faster queries
create index idx_user_activity_logs_user_id on public.user_activity_logs(user_id);
create index idx_user_activity_logs_created_at on public.user_activity_logs(created_at desc);