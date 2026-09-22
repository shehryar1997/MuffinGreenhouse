-- Supabase advisor 0014 (extension in public). pg_net can't be relocated with ALTER EXTENSION, so it is dropped and
-- recreated in the extensions schema. Its functions always live in schema "net", so public.post_revalidate is unaffected.
drop extension if exists pg_net;
create extension pg_net schema extensions;
