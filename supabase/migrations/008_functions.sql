-- ============================================================================
-- MUFFIN NURSERY - SUPABASE DATABASE SCHEMA
-- Part 8: Helper Functions
-- ============================================================================

-- Search products with filters
CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT DEFAULT NULL,
    category_slug TEXT DEFAULT NULL,
    use_case_slugs TEXT[] DEFAULT NULL,
    mood_slugs TEXT[] DEFAULT NULL,
    light_levels light_requirement[] DEFAULT NULL,
    difficulties difficulty_level[] DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    is_pet_safe BOOLEAN DEFAULT NULL,
    is_new_arrival BOOLEAN DEFAULT NULL,
    sort_by TEXT DEFAULT 'relevance',
    page_size INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    sku TEXT,
    name TEXT,
    slug TEXT,
    price DECIMAL,
    stock_status stock_status,
    primary_image TEXT,
    category_name TEXT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_products AS (
        SELECT DISTINCT ON (p.id)
            p.id,
            p.sku,
            p.name,
            p.slug,
            p.price,
            p.stock_status,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as img,
            c.name as cat_name,
            CASE 
                WHEN search_query IS NOT NULL AND search_query != '' THEN
                    ts_rank(p.search_vector, plainto_tsquery('english', search_query))
                ELSE 0
            END as relevance
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_use_cases puc ON p.id = puc.product_id
        LEFT JOIN use_case_tags uct ON puc.use_case_id = uct.id
        LEFT JOIN product_moods pm ON p.id = pm.product_id
        LEFT JOIN mood_tags mt ON pm.mood_id = mt.id
        WHERE 
            p.published_at IS NOT NULL
            AND (search_query IS NULL OR search_query = '' OR p.search_vector @@ plainto_tsquery('english', search_query))
            AND (category_slug IS NULL OR c.slug = category_slug)
            AND (use_case_slugs IS NULL OR uct.slug = ANY(use_case_slugs))
            AND (mood_slugs IS NULL OR mt.slug = ANY(mood_slugs))
            AND (light_levels IS NULL OR p.light_requirement = ANY(light_levels))
            AND (difficulties IS NULL OR p.difficulty = ANY(difficulties))
            AND (min_price IS NULL OR p.price >= min_price)
            AND (max_price IS NULL OR p.price <= max_price)
            AND (is_pet_safe IS NULL OR p.is_pet_safe = is_pet_safe)
            AND (is_new_arrival IS NULL OR p.is_new_arrival = is_new_arrival)
    )
    SELECT 
        fp.id, fp.sku, fp.name, fp.slug, fp.price, fp.stock_status, fp.img, fp.cat_name,
        COUNT(*) OVER() as total_count
    FROM filtered_products fp
    ORDER BY
        CASE sort_by WHEN 'relevance' THEN fp.relevance END DESC NULLS LAST,
        CASE sort_by WHEN 'price_asc' THEN fp.price END ASC NULLS LAST,
        CASE sort_by WHEN 'price_desc' THEN fp.price END DESC NULLS LAST,
        CASE sort_by WHEN 'name' THEN fp.name END ASC NULLS LAST,
        fp.name ASC
    LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Get product by slug
CREATE OR REPLACE FUNCTION get_product_by_slug(product_slug TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'sku', p.sku,
        'name', p.name,
        'slug', p.slug,
        'description', p.description,
        'price', p.price,
        'stock_status', p.stock_status,
        'is_pet_safe', p.is_pet_safe,
        'light_requirement', p.light_requirement,
        'category', json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
    ) INTO result
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.slug = product_slug AND p.published_at IS NOT NULL;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
