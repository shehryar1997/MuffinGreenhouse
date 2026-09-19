-- Trigger-only functions have no business being callable through /rest/v1/rpc.
revoke execute on function public.notify_revalidate() from public, anon, authenticated;
revoke execute on function public.notify_revalidate_variant() from public, anon, authenticated;

alter function public.events_set_spots() set search_path = public;
