-- review_likes: a user can "like" any review. Likes reorder reviews (most-liked
-- first). One like per (user, review); unliking deletes the row.

create table public.review_likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  review_id  uuid not null references public.reviews (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, review_id)
);

create index review_likes_review_idx on public.review_likes (review_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: world-readable (counts are public, like votes); a user
-- may only write their own likes.
-- ---------------------------------------------------------------------------
alter table public.review_likes enable row level security;

create policy "review likes are readable by everyone"
  on public.review_likes for select
  using (true);

create policy "users manage their own review likes"
  on public.review_likes for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants (RLS still applies on top)
-- ---------------------------------------------------------------------------
grant select on public.review_likes to anon, authenticated;
grant insert, delete on public.review_likes to authenticated;
grant select, insert, update, delete on public.review_likes to service_role;
