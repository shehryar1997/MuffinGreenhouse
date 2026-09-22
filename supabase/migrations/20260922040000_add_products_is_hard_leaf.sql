-- Marks a Mangave as hard-leaf: its leaves can snap if packed inside the pot, so it ships bare-root
-- (pot sent separately) instead of potted. Only meaningful for the Mangaves category; every other
-- bare-root category (Sansevierias, Agaves, Cacti & Succulents) ships bare-root unconditionally, and
-- Aroids, Hoyas and Orchids always ship potted. See lib/shipping.ts.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_hard_leaf BOOLEAN NOT NULL DEFAULT false;
