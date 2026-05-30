-- Luna server-side data schema.
-- Run this in the Supabase SQL Editor for your project.
-- Idempotent: safe to re-run.
--
-- Two tables:
--   profiles — one row per auth user, holds non-temporal data (name,
--              cycle settings, settings toggles, pro state, etc.)
--   logs     — one row per (user, date), holds the daily log entries
--
-- Privacy model: data is encrypted at rest by Supabase. RLS gates all
-- access to auth.uid(). Luna's server can technically decrypt; this is
-- a deliberate trade-off for seamless sign-in across devices.

-- ── profiles ────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Extend profiles with Luna's per-user state. Each column uses
-- "if not exists" so this block is safe to re-run against the live
-- table that previously only had id/email/stripe_customer_id.
alter table public.profiles
  add column if not exists display_name      text,
  add column if not exists cycle_length      integer default 28,
  add column if not exists period_length     integer default 5,
  add column if not exists last_period_start date,
  add column if not exists birth_control     jsonb default '{"method":"none","startDate":null}'::jsonb,
  add column if not exists pregnancy         jsonb default '{"active":false,"lmp":null,"dueDate":null,"startedAt":null}'::jsonb,
  add column if not exists completed_checks  text[]  default '{}',
  add column if not exists settings          jsonb default '{
    "showEditorial":true,"showLibrary":true,"showWatch":true,
    "notifyPeriod":true,"notifyLog":true,"notifyWeekly":true,
    "analytics":true
  }'::jsonb,
  add column if not exists is_pro            boolean default true,
  add column if not exists trial_days_left   integer default 7,
  add column if not exists onboarded         boolean default false;

alter table public.profiles enable row level security;

drop policy if exists "Profiles readable by owner" on public.profiles;
create policy "Profiles readable by owner"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles editable by owner" on public.profiles;
create policy "Profiles editable by owner"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Profiles insert by self" on public.profiles;
create policy "Profiles insert by self"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Profiles deletes denied" on public.profiles;
create policy "Profiles deletes denied"
  on public.profiles for delete using (false);

-- Create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── logs ────────────────────────────────────────────────────────────

create table if not exists public.logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  date         date not null,
  mood         text,
  symptoms     text[] default '{}',
  flow         text,
  bbt          numeric(4,1),
  mucus        text,
  sex          text,
  note         text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (user_id, date)
);

-- Add sleep column to logs (idempotent — safe to re-run).
alter table public.logs add column if not exists sleep text;

create index if not exists logs_user_date_idx on public.logs (user_id, date desc);

alter table public.logs enable row level security;

drop policy if exists "Logs readable by owner" on public.logs;
create policy "Logs readable by owner"
  on public.logs for select using (auth.uid() = user_id);

drop policy if exists "Logs insertable by owner" on public.logs;
create policy "Logs insertable by owner"
  on public.logs for insert with check (auth.uid() = user_id);

drop policy if exists "Logs updatable by owner" on public.logs;
create policy "Logs updatable by owner"
  on public.logs for update using (auth.uid() = user_id);

drop policy if exists "Logs deletable by owner" on public.logs;
create policy "Logs deletable by owner"
  on public.logs for delete using (auth.uid() = user_id);
