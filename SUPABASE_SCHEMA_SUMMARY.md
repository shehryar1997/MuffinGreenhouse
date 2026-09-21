# SUPABASE SCHEMA FOR MGH - SUMMARY

## Tables Created (17 total)

### Core Product Tables
1. **categories** - Plant categories (aroids, sansevierias, etc.)
2. **use_case_tags** - Shop by Need tags (pet-safe, low-light, etc.)
4. **products** - Main product catalog with permanent SKUs
5. **product_images** - Cloudflare R2 image URLs
6. **product_variants** - Size/pot options with separate SKUs
7. **care_info** - Plant care instructions
8. **product_use_cases** - Junction table (products <-> use cases)

### Commerce Tables
10. **customers** - User accounts
11. **addresses** - Shipping addresses
12. **orders** - Order management
13. **order_items** - Line items
14. **inventory_log** - Stock movement audit trail
15. **reviews** - Product reviews

### Content Tables
16. **events** - Workshops, tours
17. **event_registrations** - Event signups
18. **journal_posts** - Blog articles

## Key Features

| Feature | Implementation |
|---------|----------------|
| Permanent SKU | `sku` column (TEXT UNIQUE) |
| Shop by Category | `category_id` foreign key |
| Shop by Need | `product_use_cases` junction table |
| Shop by Light | `light_requirement` enum |
| Search | `search_vector` TSVECTOR + GIN index |
| Image Hosting | Cloudflare R2 URLs in `product_images` |
| Inventory Tracking | `stock_count` + `stock_status` |

## SKU Format

`{CATEGORY}-{SEQ}-{SIZE}`
- AROID-001-MED
- SANS-015-LRG
- HOYA-042-HANG

## Image URL Structure

R2 Bucket: `muffin-images`
- Products: `products/{sku}/{filename}.jpg`
- Categories: `categories/{slug}.jpg`
- Events: `events/{slug}.jpg`

## Files Created

```
supabase/
├── client.ts              # Supabase client + types
├── api/
│   ├── categories.ts     # Categories, use cases
│   ├── products.ts       # Product search, filters
│   ├── admin.ts          # Product CRUD
│   └── index.ts          # Barrel export
├── config/
│   └── r2-config.ts      # Cloudflare R2 upload/fetch
├── migrations/           # 9 SQL migration files
└── functions/            # Future Edge Functions
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
NEXT_PUBLIC_R2_PUBLIC_URL=
```

## Next Steps for ChatGPT

1. Run the 9 SQL migration files in Supabase SQL Editor
2. Create Cloudflare R2 bucket
3. Add 3 test products using the product insert pattern
4. Verify products appear in `products_view`
5. Update frontend to use Supabase API instead of mock data
