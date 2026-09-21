-- Fixes function search_path and moves pg_trgm out of the public schema.
--
-- Applied to the live DB as "set_search_path_and_move_pg_trgm". The original version of this
-- file had invalid SQL (ALTER EXTENSION IF EXISTS) and targeted the pre-mood-removal
-- search_products signature. pg_net is intentionally left in place: it is not relocatable.
-- search_products() is not covered here; set its search_path in the mood-removal migration
-- (20260920140000_remove_mood_tags.sql) once that is applied.

ALTER FUNCTION public.get_product_by_slug(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_product_search_vector() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_stock_status() SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_product_category() SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_product_tags() SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_revalidate() SET search_path = public, pg_temp;

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
