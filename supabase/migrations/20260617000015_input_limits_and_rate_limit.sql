-- Security hardening: free-text length caps (storage-DoS) + DB-backed rate
-- limiting for write actions (spam/DoS). Caps mirror src/lib/limits.ts; keep
-- them in sync. New CHECKs are added as separate named constraints so we don't
-- have to drop the existing inline checks.

-- ── Length caps ───────────────────────────────────────────────────────────
alter table public.reviews
  add constraint reviews_body_max_len
  check (char_length(body) <= 5000);

alter table public.items
  add constraint items_description_max_len
  check (description is null or char_length(description) <= 10000);

alter table public.items
  add constraint items_title_max_len
  check (char_length(title) <= 300);

-- Bound the number of genres and the total serialized size. CHECK constraints
-- can't use subqueries, so exact per-element length (MAX_GENRE_LEN) is enforced
-- in the server action; here we cap count (<=20) and total bytes (immutable
-- array_to_string) so a direct PostgREST insert can't store a giant array.
alter table public.items
  add constraint items_genres_bounds
  check (
    genres is null
    or (
      coalesce(array_length(genres, 1), 0) <= 20
      and char_length(array_to_string(genres, ',')) <= 20 * 52
    )
  );

-- ── Rate limiting ───────────────────────────────────────────────────────────
-- A generic per-user event log + a SECURITY DEFINER gatekeeper. The function
-- runs as the table owner (bypassing RLS), so the table grants no direct access
-- to `authenticated`; callers can only reach it through check_rate_limit().
create table public.rate_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  action     text not null,
  created_at timestamptz not null default now()
);

create index rate_events_lookup_idx
  on public.rate_events (user_id, action, created_at);

alter table public.rate_events enable row level security;
-- No policies for `authenticated`/`anon`: direct access is denied. Only the
-- SECURITY DEFINER function (and service_role) may touch it.
grant select, insert, delete on public.rate_events to service_role;

-- Returns true and records the event if the caller is under `p_max` events for
-- `p_action` within `p_window`; returns false (deny) otherwise. Returns false
-- for anonymous callers. Opportunistically prunes expired rows.
create or replace function public.check_rate_limit(
  p_action text,
  p_max integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  cnt integer;
begin
  if uid is null then
    return false;
  end if;

  delete from public.rate_events
    where user_id = uid and action = p_action
      and created_at < now() - p_window;

  select count(*) into cnt
    from public.rate_events
    where user_id = uid and action = p_action
      and created_at >= now() - p_window;

  if cnt >= p_max then
    return false;
  end if;

  insert into public.rate_events (user_id, action) values (uid, p_action);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, interval)
  to authenticated;
