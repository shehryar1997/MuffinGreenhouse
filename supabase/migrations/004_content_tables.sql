-- ============================================================================
-- MUFFIN NURSERY - SUPABASE DATABASE SCHEMA
-- Part 4: Events and Journal/Content
-- ============================================================================

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type event_type NOT NULL,
    datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    location TEXT NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    spots_total INTEGER NOT NULL CHECK (spots_total > 0),
    spots_remaining INTEGER NOT NULL,
    image_url TEXT,
    is_upcoming BOOLEAN GENERATED ALWAYS AS (
        CASE WHEN datetime > NOW() THEN true ELSE false END
    ) STORED,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EVENT REGISTRATIONS TABLE
-- ============================================================================
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    spots_reserved INTEGER DEFAULT 1,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    payment_status payment_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ
);

-- ============================================================================
-- JOURNAL POSTS TABLE
-- ============================================================================
CREATE TABLE journal_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_image_url TEXT,
    tags TEXT[],
    meta_title TEXT,
    meta_description TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
