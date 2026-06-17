-- item_engagement: one row per item with everything the browse page sorts and
-- filters on — vote/like/review counts and the average placement — plus the
-- item columns needed to render a card. Backs getBrowseItems().
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
  i.genre,
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
