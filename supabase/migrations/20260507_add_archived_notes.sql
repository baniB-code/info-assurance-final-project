alter table public.notes
add column if not exists is_archived boolean not null default false;
