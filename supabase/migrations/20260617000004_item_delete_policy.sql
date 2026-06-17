-- Let users delete the items they created (gear submissions). Update was already
-- allowed in the init migration; this adds the matching delete policy + grant.

create policy "authenticated users can delete items they created"
  on public.items for delete
  to authenticated
  using (created_by = (select auth.uid()));

grant delete on public.items to authenticated;
