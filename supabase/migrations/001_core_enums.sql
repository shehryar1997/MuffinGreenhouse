-- ============================================================================
-- MUFFIN NURSERY - SUPABASE DATABASE SCHEMA
-- Part 1: Extensions and Enums
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE light_requirement AS ENUM ('low', 'medium', 'bright', 'full_sun');
CREATE TYPE water_requirement AS ENUM ('low', 'medium', 'high');
CREATE TYPE plant_size AS ENUM ('small', 'medium', 'large');
CREATE TYPE event_type AS ENUM ('workshop', 'tour', 'market');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'jazzcash', 'easypaisa');
CREATE TYPE delivery_type AS ENUM ('delivery', 'pickup');
