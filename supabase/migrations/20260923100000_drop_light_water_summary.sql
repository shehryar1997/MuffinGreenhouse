-- Short light/water card labels are now derived from light_requirement / water_requirement.
ALTER TABLE products DROP COLUMN IF EXISTS light_summary;
ALTER TABLE products DROP COLUMN IF EXISTS water_summary;
