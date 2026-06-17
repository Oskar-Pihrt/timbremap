-- Genres become multiple per item (e.g. "Progressive Rock" + "Psychedelic Rock"),
-- sourced from Last.fm tags. Replaces the single `genre` text column with a
-- `genres text[]` array.

alter table public.items
  add column genres text[] not null default '{}';

-- Carry over any existing single genre.
update public.items
  set genres = array[genre]
  where genre is not null and btrim(genre) <> '';

-- item_engagement referenced items.genre — recreate it against genres.
drop view if exists public.item_engagement;

drop index if exists public.items_genre_idx;
alter table public.items drop column genre;

create index items_genres_idx on public.items using gin (genres);

create view public.item_engagement
with (security_invoker = on)
as
select
  i.id,
  i.type,
  i.slug,
  i.title,
  i.artist,
  i.manufacturer,
  i.image_url,
  i.genres,
  i.status,
  i.created_at,
  coalesce(v.vote_count, 0)   as vote_count,
  v.avg_x,
  v.avg_y,
  coalesce(f.like_count, 0)   as like_count,
  coalesce(r.review_count, 0) as review_count
from public.items i
left join (
  select item_id, count(*) as vote_count, avg(x) as avg_x, avg(y) as avg_y
  from public.votes group by item_id
) v on v.item_id = i.id
left join (
  select item_id, count(*) as like_count
  from public.favorites group by item_id
) f on f.item_id = i.id
left join (
  select item_id, count(*) as review_count
  from public.reviews group by item_id
) r on r.item_id = i.id;

grant select on public.item_engagement to anon, authenticated;
