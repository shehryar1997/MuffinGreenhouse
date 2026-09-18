-- ============================================================================
-- MUFFIN NURSERY - SUPABASE DATABASE SCHEMA
-- Part 7: Seed Data
-- ============================================================================

-- Mood tags
INSERT INTO mood_tags (slug, name, description, sort_order) VALUES
    ('soft', 'Soft', 'Gentle, muted, calming greens', 1),
    ('bright', 'Bright', 'Vibrant, energizing, sunny', 2),
    ('moody', 'Moody', 'Dark, dramatic, mysterious', 3);

-- Use case tags
INSERT INTO use_case_tags (slug, name, description, icon, sort_order) VALUES
    ('low-light-survivors', 'Low-Light Survivors', 'Thrive where the sun does not shine', 'Cloud', 1),
    ('balcony-rooftop', 'Balcony & Rooftop', 'Wind-tolerant and full-sun lovers for outdoor spaces', 'Sun', 2),
    ('air-purifying', 'Air-Purifying', 'Research-backed air cleaners for your home', 'Wind', 3),
    ('pet-safe', 'Pet-Safe', 'Non-toxic plants safe for cats, dogs, and curious kids', 'Heart', 4),
    ('beginner-proof', 'Beginner-Proof', 'Forgiving plants that bounce back from mistakes', 'Sparkles', 5),
    ('statement-plants', 'Statement Plants', 'Big, bold, conversation-starting specimens', 'Crown', 6);

-- Categories
INSERT INTO categories (slug, name, description, sort_order, is_active) VALUES
    ('aroids', 'Aroids', 'From Monstera to Philodendron -- dramatic foliage plants', 1, true),
    ('sansevierias', 'Sansevierias', 'Practically unkillable plants', 2, true),
    ('agaves', 'Agaves', 'Bold succulents with dramatic spiky leaves', 3, true),
    ('mangaves', 'Mangaves', 'Agave hybrids with softer edges', 4, true),
    ('hoyas', 'Hoyas', 'Wax plants -- trailing vines with star-shaped flowers', 5, true),
    ('orchids', 'Orchids', 'Exquisite blooms for tropical elegance', 6, true),
    ('cacti-succulents', 'Cacti & Succulents', 'Everything else -- echeverias, haworthias', 7, true),
    ('planting-media', 'Planting Media', 'Premium soils and custom mixes', 10, true),
    ('fertilizer', 'Fertilizer', 'Liquid feeds and organic options', 11, true),
    ('pots', 'Pots', 'Ceramic, terracotta, and decorative planters', 12, true),
    ('other-equipment', 'Other Equipment', 'Misters, pruners, and tools', 13, true);
