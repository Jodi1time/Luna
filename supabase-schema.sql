-- Run this in the Supabase SQL Editor for your project.
-- It creates a profiles table that mirrors auth.users with the fields
-- Luna needs (currently just stripe_customer_id for future billing).

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  stripe_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles readable by owner" on public.profiles;
create policy "Profiles readable by owner"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Profiles editable by owner" on public.profiles;
create policy "Profiles editable by owner"
  on public.profiles for update using (auth.uid() = id);

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
