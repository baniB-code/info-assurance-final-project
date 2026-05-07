create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  content text not null check (char_length(content) between 1 and 4000),
  is_pinned boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_activity_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  event_type text not null check (event_type in ('SUCCESS', 'FAILED', 'LOCKED')),
  details text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.login_security (
  identifier text primary key,
  failed_attempts integer not null default 0,
  locked_until timestamptz
);

alter table public.users enable row level security;
alter table public.notes enable row level security;
alter table public.auth_activity_log enable row level security;
alter table public.login_security enable row level security;

create policy "users can read own profile"
on public.users for select
using (auth.uid() = id);

create policy "users can update own profile"
on public.users for update
using (auth.uid() = id);

create policy "users can read own notes"
on public.notes for select
using (auth.uid() = user_id);

create policy "users can insert own notes"
on public.notes for insert
with check (auth.uid() = user_id);

create policy "users can update own notes"
on public.notes for update
using (auth.uid() = user_id);

create policy "users can delete own notes"
on public.notes for delete
using (auth.uid() = user_id);

create policy "users can read own auth activity"
on public.auth_activity_log for select
using (auth.uid() = user_id);

create policy "no direct access to login security"
on public.login_security for all
using (false)
with check (false);
