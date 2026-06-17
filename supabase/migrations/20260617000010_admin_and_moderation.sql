-- Admin role + gear moderation.
-- Adds profiles.is_admin (DB-enforceable via RLS), an is_admin() helper, admin
-- override policies for items (update/delete) and reviews (delete), tightens the
-- items insert policy so non-admins can only submit `pending` gear, and bootstraps
-- the first admin.

-- ---------------------------------------------------------------------------
-- Admin flag + helper
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- security definer so RLS policies can call it without recursing into profiles' own RLS.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false)
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- items: tighten insert (non-admins may only submit `pending`); admin overrides
-- ---------------------------------------------------------------------------
-- Replace the permissive insert policy from the init migration.
drop policy if exists "authenticated users can add items" on public.items;
create policy "authenticated users can add items"
  on public.items for insert
  to authenticated
  with check (status = 'pending' or public.is_admin((select auth.uid())));

create policy "admins can update any item"
  on public.items for update
  to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

create policy "admins can delete any item"
  on public.items for delete
  to authenticated
  using (public.is_admin((select auth.uid())));

-- ---------------------------------------------------------------------------
-- reviews: admins can delete any review (own-only policy from ...0003 stays)
-- ---------------------------------------------------------------------------
create policy "admins can delete any review"
  on public.reviews for delete
  to authenticated
  using (public.is_admin((select auth.uid())));

-- ---------------------------------------------------------------------------
-- Bootstrap the first admin. No-op until that account has registered; safe to
-- re-run. After signing up, re-run this UPDATE (see README) if it was a no-op.
-- ---------------------------------------------------------------------------
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'oskar.smotex@gmail.com');
