-- Grant service_role full access to items so server-side imports (admin client) work.
grant select, insert, update, delete on public.items to service_role;
grant select, insert, update, delete on public.votes to service_role;
grant select on public.item_stats to service_role;
grant execute on function public.nearby_items(uuid, public.item_type, int) to service_role;
