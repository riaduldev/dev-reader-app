-- DevReaderHub — authentication, onboarding and profile hardening
-- Target: Supabase PostgreSQL
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)
--
-- The migration is idempotent: re-running it neither duplicates objects nor
-- raises duplicate-object errors.

-- ---------------------------------------------------------------------------
-- Onboarding + preference columns
-- ---------------------------------------------------------------------------

alter table public.user_preferences
  add column if not exists onboarding_completed boolean not null default false;

alter table public.user_preferences
  add column if not exists technologies text[] not null default '{}';

alter table public.user_profiles
  add column if not exists avatar_url text;

alter table public.user_profiles
  add column if not exists last_sign_in_at timestamptz;

create index if not exists user_preferences_onboarding_idx
  on public.user_preferences (onboarding_completed)
  where onboarding_completed = false;

-- ---------------------------------------------------------------------------
-- Profile hardening
--   * `role` may only be changed by the service role (or a database admin).
--   * Users may still edit their own display name and avatar.
-- ---------------------------------------------------------------------------

create or replace function public.protect_user_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_role text;
  caller_is_admin boolean;
begin
  if new.role is distinct from old.role then
    request_role := current_setting('request.jwt.claim.role', true);
    caller_is_admin := coalesce(
      (select rolsuper from pg_roles where rolname = current_user), false
    );

    if request_role is distinct from 'service_role'
       and current_user not in ('postgres', 'supabase_admin', 'service_role')
       and not caller_is_admin
    then
      raise exception 'user_profiles.role can only be changed by the service role';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists user_profiles_protect_role on public.user_profiles;
create trigger user_profiles_protect_role
before update on public.user_profiles
for each row execute function public.protect_user_profile_role();

-- Keep the RLS policies in place even if the table was created before.
alter table public.user_preferences enable row level security;
alter table public.user_profiles enable row level security;

drop policy if exists preferences_all_own on public.user_preferences;
create policy preferences_all_own on public.user_preferences
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists profiles_read_own on public.user_profiles;
create policy profiles_read_own on public.user_profiles
for select to authenticated
using (auth.uid() = id);

-- Only the display name and the avatar are user-writable; `role` is not.
drop policy if exists profiles_update_own on public.user_profiles;
create policy profiles_update_own on public.user_profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

revoke update on public.user_profiles from authenticated;
grant update (full_name, avatar_url) on public.user_prefiles from authenticated;

-- ---------------------------------------------------------------------------
-- Referential behaviour (documented, enforced by the constraints in 0001)
--
--   auth.users        -> user_profiles, user_preferences, bookmarks,
--                        reading_history, notifications   (ON DELETE CASCADE)
--   articles          -> bookmarks, reading_history         (ON DELETE CASCADE)
--   sources           -> articles                           (ON DELETE SET NULL)
--
-- Deleting an auth.users row therefore removes every personal row of that
-- user; deleting a source keeps the already collected articles but detaches
-- them from the source.
-- ---------------------------------------------------------------------------
