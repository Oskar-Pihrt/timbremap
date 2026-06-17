-- MusicCompas initial schema
-- Coordinate convention: x = Technical(-1) .. Atmospheric(+1), y = Bass(-1) .. Treble(+1)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.item_type as enum ('album', 'song', 'headphones', 'iem', 'speaker');
create type public.item_status as enum ('active', 'pending', 'rejected');

-- ---------------------------------------------------------------------------
-- items: anything placeable on the compass
-- ---------------------------------------------------------------------------
create table public.items (
  id              uuid primary key default gen_random_uuid(),
  type            public.item_type not null,
  slug            text not null unique,
  title           text not null,
  artist          text,            -- music
  album           text,            -- song
  manufacturer    text,            -- gear
  image_url       text,
  release_date    date,
  external_source text,            -- e.g. 'deezer'
  external_id     text,            -- id within that source
  created_by      uuid references auth.users (id) on delete set null,
  status          public.item_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (external_source, external_id)
);

create index items_type_idx on public.items (type);
create index items_status_idx on public.items (status);

-- ---------------------------------------------------------------------------
-- votes: one (x,y) placement per (user,item); re-voting updates the row
-- ---------------------------------------------------------------------------
create table public.votes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  item_id    uuid not null references public.items (id) on delete cascade,
  x          double precision not null check (x >= -1 and x <= 1),
  y          double precision not null check (y >= -1 and y <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index votes_item_idx on public.votes (item_id);

-- ---------------------------------------------------------------------------
-- profiles: app-level user data, mirrors auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh on votes/items.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger votes_touch_updated_at
  before update on public.votes
  for each row execute function public.touch_updated_at();

create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- item_stats: per-item average placement + vote count (average view)
-- ---------------------------------------------------------------------------
create view public.item_stats
with (security_invoker = on)
as
select
  i.id                 as item_id,
  count(v.id)          as vote_count,
  avg(v.x)             as avg_x,
  avg(v.y)             as avg_y
from public.items i
left join public.votes v on v.item_id = i.id
group by i.id;

-- ---------------------------------------------------------------------------
-- nearby_items: recommendations — nearest items of a type by Euclidean
-- distance on the average placement. Excludes the target and unvoted items.
-- ---------------------------------------------------------------------------
create or replace function public.nearby_items(
  target_item uuid,
  result_type public.item_type,
  max_results int default 3
)
returns table (
  id          uuid,
  slug        text,
  title       text,
  artist      text,
  image_url   text,
  type        public.item_type,
  avg_x       double precision,
  avg_y       double precision,
  vote_count  bigint,
  distance    double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  with t as (
    select avg_x, avg_y from public.item_stats where item_id = target_item
  )
  select
    i.id, i.slug, i.title, i.artist, i.image_url, i.type,
    s.avg_x, s.avg_y, s.vote_count,
    sqrt(power(s.avg_x - t.avg_x, 2) + power(s.avg_y - t.avg_y, 2)) as distance
  from public.item_stats s
  join public.items i on i.id = s.item_id
  cross join t
  where i.type = result_type
    and i.status = 'active'
    and s.item_id <> target_item
    and s.vote_count > 0
    and t.avg_x is not null
  order by distance asc
  limit max_results;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.items    enable row level security;
alter table public.votes    enable row level security;
alter table public.profiles enable row level security;

-- items: world-readable; authenticated users may add/update (future gear submissions).
create policy "items are readable by everyone"
  on public.items for select
  using (true);

create policy "authenticated users can add items"
  on public.items for insert
  to authenticated
  with check (true);

create policy "authenticated users can update items they created"
  on public.items for update
  to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

-- votes: world-readable (the "all votes" view); a user may only write their own.
create policy "votes are readable by everyone"
  on public.votes for select
  using (true);

create policy "users manage their own votes"
  on public.votes for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- profiles: world-readable; a user may update only their own.
create policy "profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants (RLS still applies on top of these)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.items, public.votes, public.profiles to anon, authenticated;
grant select on public.item_stats to anon, authenticated;
grant insert, update on public.items to authenticated;
grant insert, update, delete on public.votes to authenticated;
grant update on public.profiles to authenticated;
grant execute on function public.nearby_items(uuid, public.item_type, int) to anon, authenticated;
