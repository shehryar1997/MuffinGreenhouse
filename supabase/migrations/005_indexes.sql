-- ============================================================================
-- MUFFIN NURSERY - SUPABASE DATABASE SCHEMA
-- Part 5: Indexes for Performance
-- ============================================================================

-- Categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active, sort_order);

-- Tags
CREATE INDEX idx_use_case_tags_slug ON use_case_tags(slug);
CREATE INDEX idx_mood_tags_slug ON mood_tags(slug);

-- Products
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_stock ON products(stock_status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_new ON products(is_new_arrival) WHERE is_new_arrival = true;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_published ON products(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- Product related
CREATE INDEX idx_product_images_product ON product_images(product_id, sort_order);
CREATE INDEX idx_product_images_primary ON product_images(product_id) WHERE is_primary = true;
CREATE INDEX idx_product_variants_product ON product_variants(product_id, is_active);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_care_info_product ON care_info(product_id);

-- Junction tables
CREATE INDEX idx_product_use_cases ON product_use_cases(use_case_id);
CREATE INDEX idx_product_moods ON product_moods(mood_id);

-- Customers and orders
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_auth ON customers(auth_id);
CREATE INDEX idx_addresses_customer ON addresses(customer_id, is_active);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Inventory and reviews
CREATE INDEX idx_inventory_log_product ON inventory_log(product_id);
CREATE INDEX idx_reviews_product ON reviews(product_id, is_approved);

-- Events and journal
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_upcoming ON events(datetime) WHERE datetime > NOW();
CREATE INDEX idx_journal_slug ON journal_posts(slug);
CREATE INDEX idx_journal_published ON journal_posts(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_journal_tags ON journal_posts USING GIN(tags);
