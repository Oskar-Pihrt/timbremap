-- items.genre — the music genre (album/song), auto-filled from Deezer on import.
-- Music-only: gear leaves it null. Used by the browse genre filter.
alter table public.items
  add column genre text;

create index items_genre_idx on public.items (genre);
