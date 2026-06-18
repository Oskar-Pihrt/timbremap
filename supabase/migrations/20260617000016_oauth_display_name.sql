-- Google (and other OAuth providers) put the user's name in raw_user_meta_data
-- under `full_name` / `name`, not `display_name` (which our email/password
-- signup sets). Widen handle_new_user to fall back through those before the
-- email-prefix default, so OAuth signups get a sensible display name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;
