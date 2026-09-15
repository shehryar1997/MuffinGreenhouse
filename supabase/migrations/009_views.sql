-- ============================================================================
-- MUFFIN NURSERY - SUPABASE DATABASE SCHEMA
-- Part 9: Views and RLS
-- ============================================================================

-- Products view with all filters flattened
CREATE VIEW products_view AS
SELECT 
    p.*,
    c.name as category_name,
    c.slug as category_slug,
    ARRAY_AGG(DISTINCT uct.slug) as use_case_slugs,
    ARRAY_AGG(DISTINCT uct.name) as use_case_names,
    ARRAY_AGG(DISTINCT mt.slug) as mood_slugs,
    ARRAY_AGG(DISTINCT mt.name) as mood_names,
    (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image_url
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN product_use_cases puc ON p.id = puc.product_id
LEFT JOIN use_case_tags uct ON puc.use_case_id = uct.id
LEFT JOIN product_moods pm ON p.id = pm.product_id
LEFT JOIN mood_tags mt ON pm.mood_id = mt.id
WHERE p.published_at IS NOT NULL AND p.published_at <= NOW()
GROUP BY p.id, c.name, c.slug;

-- Row Level Security Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY categories_read ON categories FOR SELECT USING (true);
CREATE POLICY products_read ON products FOR SELECT 
    USING (published_at IS NOT NULL);
CREATE POLICY variants_read ON product_variants FOR SELECT 
    USING (is_active = true);
CREATE POLICY reviews_read ON reviews FOR SELECT 
    USING (is_approved = true);
