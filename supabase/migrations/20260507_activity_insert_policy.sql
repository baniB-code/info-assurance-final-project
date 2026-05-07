create policy "users can insert own auth activity"
on public.auth_activity_log for insert
with check (auth.uid() = user_id);
