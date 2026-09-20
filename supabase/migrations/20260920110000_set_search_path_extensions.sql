-- ============================================================================
-- Set search_path on all user functions and move extensions to schema
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Move extensions to extensions schema (Supabase convention)
-- ----------------------------------------------------------------------------

-- pg_trgm: trigram matching for similarity search
-- Need to update search_path in functions first since they may reference pg_trgm operators

-- pg_net: HTTP client for PostgreSQL, typically used by notify_revalidate

-- We're following the Supabase convention of keeping extensions in their own schema.
-- The functions below explicitly set search_path to include 'pg_temp' for security
-- (temporary objects created by the function cannot shadow real tables).

-- ----------------------------------------------------------------------------
-- Set search_path on all user-defined functions - fixed search_path prevents
-- search_path-based attacks where malicious objects could shadow intended tables
-- ----------------------------------------------------------------------------

-- Part 1: Functions defined in 008_functions.sql
ALTER FUNCTION get_product_by_slug(text) SET search_path = public, pg_temp;
ALTER FUNCTION search_products(
    TEXT, TEXT, TEXT[], TEXT[], light_requirement[], difficulty_level[],
    DECIMAL, DECIMAL, BOOLEAN, BOOLEAN, TEXT, INTEGER, INTEGER
) SET search_path = public, pg_temp;

-- Part 2: Functions defined in 006_triggers.sql
ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION update_product_search_vector() SET search_path = public, pg_temp;

-- Part 3: Functions mentioned in harden_trigger_functions.sql and app references
-- These exist in the database per the harden migration and app code references
-- Using IF EXISTS since we're not certain about their exact signatures
DO $$
BEGIN
    -- auto_stock_status - trigger for auto-updating stock_status based on stock_count
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_stock_status') THEN
        EXECUTE 'ALTER FUNCTION auto_stock_status() SET search_path = public, pg_temp';
    END IF;

    -- sync_product_category - trigger for auto-resolving category from category_name
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_product_category') THEN
        EXECUTE 'ALTER FUNCTION sync_product_category() SET search_path = public, pg_temp';
    END IF;

    -- validate_product_tags - trigger for validating tags against known values
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_product_tags') THEN
        EXECUTE 'ALTER FUNCTION validate_product_tags() SET search_path = public, pg_temp';
    END IF;

    -- notify_revalidate - trigger for revalidation webhook
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_revalidate') THEN
        EXECUTE 'ALTER FUNCTION notify_revalidate() SET search_path = public, pg_temp';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- pg_trgm and pg_net extension relocation to extensions schema
-- ----------------------------------------------------------------------------

-- Note: This operation is idempotent; running twice is harmless.
-- The extensions are moved to allow better schema hygiene.

-- First, ensure the extensions schema exists (Supabase default)
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO PUBLIC;

-- Move pg_trgm to extensions schema
-- This is safe: the % operator (trigram similarity) is namespaced and will
-- continue to work because:
-- 1. search_products uses plainto_tsquery() for text search (not trigram ops)
-- 2. Any trigram ops (% operator) are resolved via the operator's OID, not the
--    extension's install location. The extension objects are updated in pg_catalog.
-- 3. The ALTER EXTENSION ... SET SCHEMA updates the extension's pg_catalog entries.
ALTER EXTENSION IF EXISTS pg_trgm SET SCHEMA extensions;

-- Move pg_net to extensions schema
-- pg_net is used for HTTP calls (e.g., webhook revalidation)
ALTER EXTENSION IF EXISTS pg_net SET SCHEMA extensions;

-- Ensure the extension is usable (operator search path is not affected by extension schema)
-- The extension's operators and functions are registered in pg_catalog with their OIDs,
-- so they continue to work regardless of which schema the extension is installed in.
COMMENT ON EXTENSION pg_trgm IS 'Text similarity measurement and index searching (moved to extensions schema)';
COMMENT ON EXTENSION pg_net IS 'PostgreSQL HTTP client for extension (moved to extensions schema)';

-- ----------------------------------------------------------------------------
-- Verification note for search_products trigram ops
-- ----------------------------------------------------------------------------

-- The search_products function uses:
--   - ts_rank() with plainto_tsquery() for full-text search
--   - Standard operators (=, ANY) for filtering
--
-- It does NOT currently use the % trigram similarity operator, so this migration
-- is safe. If trigram similarity searching were added later, the % operator
-- would resolve correctly because:
--   1. The operator is defined in pg_catalog.operator with a fixed OID
--   2. The extension's schema location doesn't affect operator resolution
--   3. The extension's functions (like similarity()) are also in pg_catalog
--
-- Should trigram ops ever be needed explicitly, the code would need to reference
-- extensions.similarity() or the function's qualified name.
