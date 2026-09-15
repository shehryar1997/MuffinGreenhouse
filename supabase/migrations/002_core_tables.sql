-- ============================================================================
-- MUFFIN NURSERY - SUPABASE DATABASE SCHEMA
-- Part 2: Core Product Tables
-- ============================================================================

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USE CASE TAGS (Shop by Need)
-- ============================================================================
CREATE TABLE use_case_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MOOD TAGS (Shop by Atmosphere)
-- ============================================================================
CREATE TABLE mood_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS TABLE (with permanent SKU)
-- ============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
    currency TEXT DEFAULT 'PKR',
    stock_status stock_status DEFAULT 'in_stock',
    stock_count INTEGER DEFAULT 0 CHECK (stock_count >= 0),
    low_stock_threshold INTEGER DEFAULT 5,
    difficulty difficulty_level DEFAULT 'beginner',
    light_requirement light_requirement NOT NULL,
    water_requirement water_requirement DEFAULT 'medium',
    size plant_size DEFAULT 'medium',
    is_new_arrival BOOLEAN DEFAULT false,
    is_pet_safe BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    search_vector TSVECTOR,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- ============================================================================
-- PRODUCT IMAGES (Cloudflare R2)
-- ============================================================================
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    medium_url TEXT,
    large_url TEXT,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    r2_key TEXT,
    r2_bucket TEXT DEFAULT 'muffin-images',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCT VARIANTS (separate SKUs for sizes/pots)
-- ============================================================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_status stock_status DEFAULT 'in_stock',
    stock_count INTEGER DEFAULT 0 CHECK (stock_count >= 0),
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    options JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CARE INFORMATION
-- ============================================================================
CREATE TABLE care_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    light TEXT,
    water TEXT,
    humidity TEXT,
    temperature TEXT,
    soil TEXT,
    fertilizer TEXT,
    toxicity TEXT,
    light_summary TEXT,
    water_summary TEXT,
    pet_safe_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JUNCTION TABLES
-- ============================================================================
CREATE TABLE product_use_cases (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    use_case_id UUID REFERENCES use_case_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, use_case_id)
);

CREATE TABLE product_moods (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    mood_id UUID REFERENCES mood_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, mood_id)
);
