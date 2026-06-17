-- Storage bucket for user-submitted gear product images.
-- Public read (images are shown on public item pages); writes restricted to
-- authenticated users. Gear is auto-approved, so no moderation gate here.

insert into storage.buckets (id, name, public)
values ('gear-images', 'gear-images', true)
on conflict (id) do nothing;

-- Anyone may read objects in this bucket (public product images).
create policy "gear images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'gear-images');

-- Authenticated users may upload to this bucket.
create policy "authenticated users can upload gear images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gear-images');

-- Authenticated users may replace/remove objects they own in this bucket.
create policy "authenticated users can update their gear images"
  on storage.objects for update to authenticated
  using (bucket_id = 'gear-images' and owner = (select auth.uid()))
  with check (bucket_id = 'gear-images' and owner = (select auth.uid()));

create policy "authenticated users can delete their gear images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gear-images' and owner = (select auth.uid()));
