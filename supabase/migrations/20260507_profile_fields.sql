alter table public.users
add column if not exists avatar_url text,
add column if not exists bio text default '';
