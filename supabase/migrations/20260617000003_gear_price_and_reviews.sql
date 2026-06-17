-- Gear price + per-item text reviews.

-- ---------------------------------------------------------------------------
-- items.price — a gear's price (numeric, nullable). Music items leave it null.
-- Currency is assumed USD app-wide (no multi-currency support yet).
-- ---------------------------------------------------------------------------
alter table public.items
  add column price numeric(10, 2) check (price is null or price >= 0);

-- ---------------------------------------------------------------------------
-- reviews: one editable text review per (user, item). No reactions/comments.
-- ---------------------------------------------------------------------------
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  item_id    uuid not null references public.items (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index reviews_item_idx on public.reviews (item_id);

create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: world-readable; a user may only write their own.
-- ---------------------------------------------------------------------------
alter table public.reviews enable row level security;

create policy "reviews are readable by everyone"
  on public.reviews for select
  using (true);

create policy "users manage their own reviews"
  on public.reviews for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants (RLS still applies on top)
-- ---------------------------------------------------------------------------
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.reviews to service_role;
