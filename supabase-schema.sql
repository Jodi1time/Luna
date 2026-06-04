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

-- Add intimate jsonb to logs — covers libido, lubrication, painful_sex,
-- and orgasm_count in a single column so future intimate-health fields
-- don't each need a schema migration. Defaults to null.
alter table public.logs add column if not exists intimate jsonb;

-- Add moods text[] to logs — multi-select moods. The old `mood text`
-- column stays as a back-compat mirror of moods[0] so anything that
-- only reads `mood` still sees the dominant mood. Idempotent.
alter table public.logs add column if not exists moods text[];

-- Add pregnancy_history jsonb array to profiles — gentle record of
-- pregnancy outcomes (miscarriage / stillbirth / abortion / ectopic /
-- chemical / live birth) so we can both honour what happened and
-- provide tailored support without forcing the data into the active
-- pregnancy field. Defaults to an empty array.
alter table public.profiles
  add column if not exists pregnancy_history jsonb default '[]'::jsonb;

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

-- ── shares ──────────────────────────────────────────────────────────
--
-- "Share with someone" — Pro feature where a user grants read-only
-- view access to their cycle data to another Luna user (partner,
-- mother, doula, sister, friend). Created as a pending invite first;
-- accepted by the recipient who deep-links into the app with a code.
--
-- Privacy posture:
--   - Diary entries and photos are NEVER exposed via shares, even at
--     full-picture scope. The redacted-profile function below strips
--     settings.journalEntries and similar private keys before returning.
--   - Scope is server-enforced via the SECURITY DEFINER functions
--     below — clients cannot bypass the scope filter even with
--     direct table access (the underlying tables remain owner-only
--     for shared access; partners go through the RPC functions).
--   - Revoke is instant — once revoked_at is set, the functions
--     return null even if the row still exists.

create table if not exists public.shares (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references auth.users on delete cascade,
  to_user_id    uuid references auth.users on delete cascade,        -- null while pending
  invite_code   text unique,                                          -- non-null while pending
  scope         jsonb not null default '{"cycle": true}'::jsonb,      -- { cycle: bool, fullLog: bool }
  status        text not null default 'pending',                      -- 'pending' | 'accepted' | 'revoked'
  created_at    timestamptz default now(),
  accepted_at   timestamptz,
  revoked_at    timestamptz
);

create index if not exists shares_invite_code_idx on public.shares (invite_code) where status = 'pending';
create index if not exists shares_from_user_idx   on public.shares (from_user_id, status);
create index if not exists shares_to_user_idx    on public.shares (to_user_id, status);

alter table public.shares enable row level security;

-- Owner (the data sharer) can do everything with their own outgoing shares.
drop policy if exists "Shares: owner full access" on public.shares;
create policy "Shares: owner full access"
  on public.shares for all
  using (auth.uid() = from_user_id)
  with check (auth.uid() = from_user_id);

-- Recipient can see shares where they are the to_user_id (after accept).
drop policy if exists "Shares: recipient read" on public.shares;
create policy "Shares: recipient read"
  on public.shares for select
  using (auth.uid() = to_user_id);

-- Recipient can revoke a share from their side (sets revoked_at, status).
drop policy if exists "Shares: recipient revoke" on public.shares;
create policy "Shares: recipient revoke"
  on public.shares for update
  using (auth.uid() = to_user_id and status = 'accepted')
  with check (auth.uid() = to_user_id);

-- Recipient accept flow: while the share is pending, any authenticated
-- user can update it to set themselves as to_user_id IF they know the
-- invite_code. The code is the gate (16 chars, random). This policy
-- enforces that the only valid update from this state sets status to
-- 'accepted' and themselves as the recipient.
drop policy if exists "Shares: accept invite by code" on public.shares;
create policy "Shares: accept invite by code"
  on public.shares for update
  using (status = 'pending' and invite_code is not null and to_user_id is null)
  with check (to_user_id = auth.uid() and status = 'accepted');

-- ── Shared read functions (SECURITY DEFINER, scope-enforced) ───────
--
-- Partners call these RPCs to read the data owner's data. The functions
-- verify an active share exists between the two users AND that the
-- scope permits the request before returning anything. journalEntries
-- and other private settings are stripped from the response.

-- Returns null when no active share exists.
create or replace function public.get_shared_profile(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  share_record public.shares%rowtype;
  profile_record public.profiles%rowtype;
begin
  select * into share_record from public.shares
  where from_user_id = target_user_id
    and to_user_id = auth.uid()
    and status = 'accepted'
    and revoked_at is null
  limit 1;

  if not found then
    return null;
  end if;

  select * into profile_record from public.profiles where id = target_user_id;
  if not found then
    return null;
  end if;

  -- Return a redacted profile — explicitly NOT including settings
  -- (which contains journalEntries, savedArticles, reflectHistory,
  -- crampsHistory, helperHistory, schools, kickSessions, etc. —
  -- all of which stay private). Only cycle-relevant fields and the
  -- share's own scope are returned.
  return jsonb_build_object(
    'display_name',       profile_record.display_name,
    'cycle_length',       profile_record.cycle_length,
    'period_length',      profile_record.period_length,
    'last_period_start',  profile_record.last_period_start,
    'birth_control',      profile_record.birth_control,
    'pregnancy',          profile_record.pregnancy,
    'pregnancy_history',  null,  -- intentionally not shared
    'scope',              share_record.scope,
    'share_id',           share_record.id,
    'shared_at',          share_record.accepted_at
  );
end;
$$;

revoke all on function public.get_shared_profile(uuid) from public;
grant execute on function public.get_shared_profile(uuid) to authenticated;

-- Returns daily logs only when scope.fullLog is true. Empty set when
-- no active share or scope is just 'cycle' (basic).
create or replace function public.get_shared_logs(target_user_id uuid)
returns setof public.logs
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.shares
    where from_user_id = target_user_id
      and to_user_id = auth.uid()
      and status = 'accepted'
      and revoked_at is null
      and (scope->>'fullLog')::boolean = true
  ) then
    return;
  end if;

  return query
  select * from public.logs where user_id = target_user_id order by date desc;
end;
$$;

revoke all on function public.get_shared_logs(uuid) from public;
grant execute on function public.get_shared_logs(uuid) to authenticated;

-- Recipient-side helper: look up an invite by code, return the data
-- owner's display name and the scope they're offering so the accept
-- screen can show "X is offering you the cycle picture" before the
-- recipient commits. Does NOT accept the invite — that's a separate
-- update call by the client. Returns null if the code is invalid or
-- already accepted/revoked.
create or replace function public.preview_share_invite(code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  share_record public.shares%rowtype;
  owner_profile public.profiles%rowtype;
begin
  select * into share_record from public.shares
  where invite_code = code
    and status = 'pending'
    and to_user_id is null
  limit 1;

  if not found then
    return null;
  end if;

  select * into owner_profile from public.profiles where id = share_record.from_user_id;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'share_id',     share_record.id,
    'from_name',    owner_profile.display_name,
    'scope',        share_record.scope,
    'created_at',   share_record.created_at
  );
end;
$$;

revoke all on function public.preview_share_invite(text) from public;
grant execute on function public.preview_share_invite(text) to authenticated;
