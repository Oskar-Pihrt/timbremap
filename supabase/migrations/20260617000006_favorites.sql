-- favorites: a user "likes"/favorites an item. One heart per (user, item);
-- liked items show in the user's "My Favorites" list, and per-item like counts
-- feed the "most liked" browse sort. World-readable so counts can be aggregated
-- (matches votes being public).

create table public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  item_id    uuid not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index favorites_item_idx on public.favorites (item_id);
create index favorites_user_idx on public.favorites (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: world-readable; a user may only write their own.
-- ---------------------------------------------------------------------------
alter table public.favorites enable row level security;

create policy "favorites are readable by everyone"
  on public.favorites for select
  using (true);

create policy "users manage their own favorites"
  on public.favorites for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants (RLS still applies on top)
-- ---------------------------------------------------------------------------
grant select on public.favorites to anon, authenticated;
grant insert, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.favorites to service_role;
