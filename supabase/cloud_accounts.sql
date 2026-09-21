-- Çalışma Rotası cloud account + workspace sync schema
-- Apply to the dedicated Çalışma Rotası Supabase project only.

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  exam text not null default 'kpss' check (exam = 'kpss'),
  target text not null default '',
  daily_minutes integer check (daily_minutes is null or (daily_minutes >= 0 and daily_minutes <= 1440)),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  storage_key text not null default 'calisma-rotasi:all:v5',
  workspace_id text not null default '',
  revision bigint not null default 0 check (revision >= 0),
  client_updated_at bigint not null default 0 check (client_updated_at >= 0),
  payload jsonb not null,
  synced_at timestamptz not null default now()
);

create index if not exists profiles_last_seen_idx on public.profiles(last_seen_at desc);
create index if not exists student_states_synced_idx on public.student_states(synced_at desc);

alter table public.profiles enable row level security;
alter table public.student_states enable row level security;

revoke all on public.profiles from anon;
revoke all on public.student_states from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.student_states to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "student_states_select_own_or_admin" on public.student_states;
create policy "student_states_select_own_or_admin"
on public.student_states
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
);

drop policy if exists "student_states_insert_own" on public.student_states;
create policy "student_states_insert_own"
on public.student_states
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "student_states_update_own" on public.student_states;
create policy "student_states_update_own"
on public.student_states
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "student_states_delete_own" on public.student_states;
create policy "student_states_delete_own"
on public.student_states
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_rota on auth.users;
create trigger on_auth_user_created_rota
after insert on auth.users
for each row execute function private.handle_new_user();

-- Admin authorization is intentionally based on signed app_metadata, not user_metadata.
-- After the owner creates an account, promote that exact user via a trusted SQL/admin path:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where id = '<OWNER_USER_UUID>';
