# Product CSV: how to fill it in

Files
- `products-template.csv`: two example rows (a plant and a pot). Delete them before importing (their names start with `EXAMPLE`).
- `products-blank.csv`: headers only.

One row per product. Photos belong to variants and are normally added afterwards from Admin → Products (the **Photo** button, or **Photos** with a counter for products with several variants). A product can only be published once it has at least one variant and every variant has a photo, so import with `published` blank and publish after adding photos.
Open in Excel or Google Sheets and save as **CSV UTF-8**. Prices are plain numbers, no commas or "Rs" (write `3500`, not `3,500`).

## SKU and slug are generated: don't add columns for them
Both are built from the product name (and category) at import time:

| Product | Category | Slug (website address) | SKU |
|---|---|---|---|
| Monstera Deliciosa | Aroids | `monstera-deliciosa` | `ARO-MD-01` |
| Terracotta Pot 6 inch | Pots | `terracotta-pot-6-inch` | `POT-TP6I-01` |
| 13 PC Succulent Tool Set | Other Equipment | `13-pc-succulent-tool-set` | `EQP-13PSTS-01` |
| Osmocote | Fertilizer | `osmocote` | `FER-OSM-01` |

- **Slug:** the name in lowercase, accents removed, `&` becomes `and`, everything else that isn't a letter or digit becomes a single hyphen.
- **SKU:** `<category code>-<initials>-<number>`, in the same style as your existing `AR-PP-01`.
  - Category code: ARO (Aroids), AGV (Agaves), CAC (Cacti & Succulents), FER (Fertilizer), HOY (Hoyas), MAN (Mangaves), ORC (Orchids), EQP (Other Equipment), MED (Planting Media), POT (Pots), SAN (Sansevierias).
  - Initials: the first letter of each word (skipping a, an, and, the, of, for, with, in), plus the first number in the name whole, up to 6 characters. A one-word name uses its first 3 letters.
  - Number: 01, 02, 03... The next free number for that code, counting products already in the shop.
- **Same name twice** (in the file or already in the shop): the slug gets `-2`, then `-3` (`monstera-deliciosa-2`), and the SKU just takes the next number.
- A name with no English letters or digits can't produce either one, so that row will be rejected. Use an English name.
- They are set when the product is created and never change if you rename it later. Edit them in the product form if you need different ones.

## Required (every product)
| Column | Rule |
|---|---|
| `name` | 3–120 characters, must contain letters. |
| `category` | Exactly one of: Agaves, Aroids, Cacti & Succulents, Fertilizer, Hoyas, Mangaves, Orchids, Other Equipment, Planting Media, Pots, Sansevierias |
| `description` | 10–5000 characters. |

## Optional
| Column | Rule / default |
|---|---|
| `short_description` | Up to 300 characters. |
| `low_stock_threshold` | Whole number. Blank = 10. |
| `weight_kg` | **Required (> 0) for Fertilizer, Other Equipment, Planting Media, Pots**: delivery is 120 PKR per kg. Optional for plants. |
| `box_height_cm`, `box_width_cm`, `box_breadth_cm` | Shipping box size, plants only. |
| `published` | `yes` = live on the site, blank/`no` = draft. |
| `is_featured`, `is_new_arrival` | `yes` / `no`. "New" tag drops off 14 days after publishing. |
| `meta_title` | Up to 70 characters. |
| `meta_description` | Up to 170 characters. |

## Plants only (ignored for Fertilizer, Other Equipment, Planting Media, Pots)
| Column | Allowed values / default |
|---|---|
| `difficulty` | beginner (default), intermediate, expert |
| `light_requirement` | low, medium (default), bright, full_sun |
| `water_requirement` | low, medium (default), high |
| `is_pet_safe`, `is_imported` | yes / no |
| `use_case_tags` | Separate several with `\|`. Allowed: Air-Purifying, Balcony & Rooftop, Beginner-Proof, Low-Light Survivors, Pet-Safe, Statement Plants |
| `light`, `water`, `humidity`, `temperature`, `soil`, `fertilizer`, `toxicity`, `pet_safe_note` | Longer care text. |

## Variants (needed to publish)
Up to 3 per product: `variant_N_name`, `variant_N_sku`, `variant_N_price`, `variant_N_compare_at_price`, `variant_N_stock`, `variant_N_image_url` (N = 1, 2, 3). Price, was price, stock and photo are set per variant.
- A variant needs at least a name and a price. The first one is the default.
- `variant_N_sku` blank = `<product sku>-N`. Leave it blank unless you need a specific one; variant SKUs must be unique.
- `variant_N_image_url` is that variant's photo (needed to publish; it must be an uploaded photo from your image host). It can also be added later from the admin.
- The shop shows "Starting from" the lowest variant price, and stock is the total of the variants. A product that comes in one size gets a single variant (for example "Standard").
- A row with no variants imports as a draft. `published = yes` is rejected until at least one variant, with a photo, is added.
