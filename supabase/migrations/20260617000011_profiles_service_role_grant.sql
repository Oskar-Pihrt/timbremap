-- The service-role client (admin user-management: listUsers / setUserAdmin) reads
-- and writes profiles, but the table was only granted to anon/authenticated in the
-- init migration. service_role bypasses RLS but still needs table privileges, so
-- without this grant those calls fail with "permission denied for table profiles".
grant select, insert, update, delete on public.profiles to service_role;
