-- Category copy moves from code (app/shop/[category]/page.tsx, data/mock-products.ts) into the database so it can be
-- edited in Admin > Categories. Only fills empty fields, so it never overwrites text written in the admin panel.
update public.categories c
   set tagline = coalesce(c.tagline, v.tagline),
       description = coalesce(nullif(c.description, ''), v.description),
       meta_title = coalesce(c.meta_title, v.meta_title),
       meta_description = coalesce(c.meta_description, v.meta_description)
  from (values
    ('aroids', 'Bold leaves, stunning silhouettes.', 'From Monstera to Philodendron. Dramatic foliage plants with stunning leaf shapes.',
     'Buy Aroids Online in Pakistan: Monstera, Philodendron', 'Rare and common aroids including Monstera, Philodendron and Syngonium, with honest care notes. Delivered across Pakistan.'),
    ('sansevierias', 'Architectural beauty that survives anything.', 'Snake plants and relatives. Architectural, drought-tolerant, and nearly indestructible.',
     'Snake Plants (Sansevieria) for Sale in Pakistan', 'Hard-to-kill sansevierias for Karachi heat and low light. Drought tolerant and easy to keep. Order online with delivery.'),
    ('agaves', 'Desert drama for your space.', 'Bold succulents with dramatic spiky leaves. Perfect for sunny spots.',
     'Buy Agave Plants Online in Pakistan', 'Bold, architectural agaves for sunny balconies and gardens. Desert plants that handle Pakistani summers. Shop online.'),
    ('mangaves', 'Hybrid vigor, striking forms.', 'Agave hybrids with softer edges and faster growth. The best of both worlds.',
     'Mangave Plants for Sale in Pakistan', 'Fast-growing mangave hybrids that combine agave toughness with colourful patterns. Great for rooftops. Order online.'),
    ('hoyas', 'Trailing stars in bloom.', 'Wax plants. Trailing vines with thick, waxy leaves and star-shaped flowers.',
     'Buy Hoya Plants Online in Pakistan', 'Trailing hoyas with waxy leaves and fragrant star-shaped flowers, ideal for hanging baskets. Delivered across Pakistan.'),
    ('orchids', 'Elegance in every petal.', 'Exquisite blooms that bring tropical elegance to any room.',
     'Orchids for Sale in Karachi and Pakistan', 'Phalaenopsis, dendrobium and other orchids with care guidance included. Order online with delivery across Pakistan.'),
    ('cacti-succulents', 'Tough, tiny, and full of character.', 'Sun-loving cacti and succulents that store their own water. Compact, sculptural and easy to care for.',
     'Cacti and Succulents for Sale in Pakistan', 'Hardy cacti and succulents for sunny windows, balconies and desks. Low-water plants delivered across Pakistan.'),
    ('planting-media', 'The foundation of healthy plants.', 'Soils, coco coir, perlite, and custom mixes for every plant type.',
     'Potting Soil and Planting Media in Pakistan', 'Coco coir, perlite, vermiculite and soil mixes for indoor plants. Delivered across Karachi and Pakistan.'),
    ('fertilizer', 'Nourishment for growth.', 'Liquid feeds, slow-release pellets, and organic options to help your plants thrive.',
     'Plant Fertilizer and Nutrients in Pakistan', 'Liquid feeds, slow-release pellets and organic fertilizers for healthy plants. Delivered across Pakistan.'),
    ('pots', 'Find the perfect home.', 'Ceramic, terracotta, and decorative planters in all shapes and sizes.',
     'Plant Pots and Planters in Karachi, Pakistan', 'Ceramic, terracotta and decorative pots in every size. Find the right planter for each plant. Delivered across Pakistan.'),
    ('other-equipment', 'Tools for every task.', 'Misters, pruners, humidity trays, and everything else a plant parent needs.',
     'Plant Care Tools and Equipment in Pakistan', 'Misters, pruners, humidity trays and everything plant parents need. Shop gardening tools online with delivery.')
  ) as v(slug, tagline, description, meta_title, meta_description)
 where c.slug = v.slug;
