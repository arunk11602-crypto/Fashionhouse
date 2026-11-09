/*
# Demo catalog: 12 clearly marked demo products

Plain-English summary
Adds 12 demo products so the shop can be tested before real stock is entered: 4 for ladies, 4 for gents and 4 for kids. Each is marked as a demo, has a DEMO- product code, two or more size and colour variants, valid prices and stock, and placeholder photos. A Kids Wear category is added for the kids products.

1. Modified Tables
- categories: adds the Kids Wear category if it does not exist.
- products, product_variants, product_media: adds the 12 demo products, their variants and one photo each.

2. Important notes
- Demo products use fixed IDs and are skipped if they already exist, so running this again creates no duplicates.
- To remove the demo products later, delete the products whose product code starts with DEMO- (or where the demo flag is on). Their variants and photos are removed with them.
- Stock status is calculated automatically from the variant stock. Two demo products are set to Final Pieces and Coming Soon by hand.
*/

INSERT INTO public.categories (name, slug, sort_order, description, is_active)
VALUES ('Kids Wear', 'kids-wear', 5, 'Comfortable and festive outfits for children.', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
  id, sku, name, slug, short_description, full_description, category_id, stock_type, collection,
  customer_category, sale_type, fabric, brand, season, original_price, sale_price, status,
  is_demo, is_featured, is_published, image_urls
) VALUES
  ('de000000-0000-4000-8000-000000000001', 'DEMO-LD-001', 'Rose Printed Anarkali Kurti', 'demo-ld-001-rose-printed-anarkali-kurti',
   'Flowing anarkali with a soft rose print.', 'Demo product. A flowing anarkali kurti with a soft rose print, comfortable for festive days.',
   (SELECT id FROM public.categories WHERE slug = 'ethnic-wear'), 'new', 'premium', 'ladies', 'discount', 'Cotton blend', 'Demo', 'Summer',
   2499, 1999, 'In Stock', true, true, true, ARRAY['https://images.pexels.com/photos/7920055/pexels-photo-7920055.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000002', 'DEMO-LD-002', 'Pastel Chanderi Kurta Set', 'demo-ld-002-pastel-chanderi-kurta-set',
   'Light chanderi kurta with matching pants.', 'Demo product. A light chanderi kurta set with matching pants for daily wear.',
   (SELECT id FROM public.categories WHERE slug = 'ethnic-wear'), 'new', 'simple', 'ladies', 'normal', 'Chanderi', 'Demo', 'Summer',
   1899, NULL, 'In Stock', true, false, true, ARRAY['https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000003', 'DEMO-LD-003', 'Georgette Party Saree', 'demo-ld-003-georgette-party-saree',
   'Sheer georgette saree with a zari border.', 'Demo product. A sheer georgette saree with a zari border, made for parties and weddings.',
   (SELECT id FROM public.categories WHERE slug = 'saree'), 'old', 'premium', 'ladies', 'discount', 'Georgette', 'Demo', 'Festive',
   3499, 2799, 'In Stock', true, true, true, ARRAY['https://images.pexels.com/photos/36747092/pexels-photo-36747092.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000004', 'DEMO-LD-004', 'Classic Blue Denim Top', 'demo-ld-004-classic-blue-denim-top',
   'Relaxed denim top for everyday wear.', 'Demo product. A relaxed denim top for everyday wear. Last pieces only.',
   (SELECT id FROM public.categories WHERE slug = 'western-wear'), 'old', 'simple', 'ladies', 'final', 'Denim', 'Demo', 'All Season',
   899, 699, 'Final Pieces', true, false, true, ARRAY['https://images.pexels.com/photos/32309983/pexels-photo-32309983.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000005', 'DEMO-GN-001', 'Charcoal Two-Piece Suit', 'demo-gn-001-charcoal-two-piece-suit',
   'Tailored charcoal suit with jacket and trousers.', 'Demo product. A tailored charcoal suit with jacket and trousers, made for formal events.',
   (SELECT id FROM public.categories WHERE slug = 'formal-wear'), 'new', 'premium', 'gents', 'discount', 'Wool blend', 'Demo', 'Winter',
   8999, 7499, 'In Stock', true, true, true, ARRAY['https://images.pexels.com/photos/6765639/pexels-photo-6765639.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000006', 'DEMO-GN-002', 'Slim Fit Cotton Shirt', 'demo-gn-002-slim-fit-cotton-shirt',
   'Breathable slim fit cotton shirt.', 'Demo product. A breathable slim fit cotton shirt for office and casual wear.',
   (SELECT id FROM public.categories WHERE slug = 'formal-wear'), 'new', 'simple', 'gents', 'normal', 'Cotton', 'Demo', 'All Season',
   1299, NULL, 'In Stock', true, false, true, ARRAY['https://images.pexels.com/photos/7301566/pexels-photo-7301566.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000007', 'DEMO-GN-003', 'Olive Woollen Winter Jacket', 'demo-gn-003-olive-woollen-winter-jacket',
   'Warm woollen jacket with a fitted cut.', 'Demo product. A warm woollen jacket with a fitted cut for cold evenings.',
   (SELECT id FROM public.categories WHERE slug = 'winter-wear'), 'old', 'regular', 'gents', 'discount', 'Wool', 'Demo', 'Winter',
   4499, 3999, 'In Stock', true, false, true, ARRAY['https://images.pexels.com/photos/6429760/pexels-photo-6429760.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000008', 'DEMO-GN-004', 'Beige Linen Kurta Pyjama Set', 'demo-gn-004-beige-linen-kurta-pyjama-set',
   'Breathable linen kurta with pyjama.', 'Demo product. A breathable linen kurta with pyjama for festivals and family functions.',
   (SELECT id FROM public.categories WHERE slug = 'ethnic-wear'), 'new', 'regular', 'gents', 'normal', 'Linen', 'Demo', 'Summer',
   1599, NULL, 'In Stock', true, false, true, ARRAY['https://images.pexels.com/photos/16069735/pexels-photo-16069735.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000009', 'DEMO-KD-001', 'Navy Striped Knit Sweater', 'demo-kd-001-navy-striped-knit-sweater',
   'Soft knit sweater with navy stripes.', 'Demo product. A soft knit sweater with navy stripes for kids in cool weather.',
   (SELECT id FROM public.categories WHERE slug = 'winter-wear'), 'new', 'simple', 'kids', 'normal', 'Woollen', 'Demo', 'Winter',
   699, NULL, 'In Stock', true, true, true, ARRAY['https://images.pexels.com/photos/30690921/pexels-photo-30690921.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000010', 'DEMO-KD-002', 'Pink Cotton Party Frock', 'demo-kd-002-pink-cotton-party-frock',
   'Light cotton frock for birthdays.', 'Demo product. A light cotton frock for birthdays and small celebrations.',
   (SELECT id FROM public.categories WHERE slug = 'kids-wear'), 'old', 'simple', 'kids', 'discount', 'Cotton', 'Demo', 'Summer',
   499, 399, 'In Stock', true, false, true, ARRAY['https://images.pexels.com/photos/38778561/pexels-photo-38778561.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000011', 'DEMO-KD-003', 'Blue Denim Dungarees', 'demo-kd-003-blue-denim-dungarees',
   'Sturdy denim dungarees for play.', 'Demo product. Sturdy denim dungarees for active play. Last pieces only.',
   (SELECT id FROM public.categories WHERE slug = 'kids-wear'), 'new', 'regular', 'kids', 'final', 'Denim', 'Demo', 'All Season',
   799, 599, 'Final Pieces', true, false, true, ARRAY['https://images.pexels.com/photos/1620759/pexels-photo-1620759.jpeg?auto=compress&cs=tinysrgb&h=650&w=940']),
  ('de000000-0000-4000-8000-000000000012', 'DEMO-KD-004', 'Festive Gold Sherwani', 'demo-kd-004-festive-gold-sherwani',
   'Gold brocade sherwani for festive occasions.', 'Demo product. A gold brocade sherwani for festive occasions. Coming soon.',
   (SELECT id FROM public.categories WHERE slug = 'sherwani'), 'new', 'premium', 'kids', 'normal', 'Brocade', 'Demo', 'Festive',
   2299, NULL, 'Coming Soon', true, false, true, ARRAY['https://images.pexels.com/photos/40061319/pexels-photo-40061319.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (product_id, variant_sku, size, colour, total_quantity, available_quantity, booked_quantity, sold_quantity)
VALUES
  ('de000000-0000-4000-8000-000000000001', 'DEMO-LD-001-M-ROSE', 'M', 'Rose', 4, 4, 0, 0),
  ('de000000-0000-4000-8000-000000000001', 'DEMO-LD-001-L-ROSE', 'L', 'Rose', 6, 6, 0, 0),
  ('de000000-0000-4000-8000-000000000002', 'DEMO-LD-002-S-MINT', 'S', 'Mint', 3, 3, 0, 0),
  ('de000000-0000-4000-8000-000000000002', 'DEMO-LD-002-M-MINT', 'M', 'Mint', 2, 2, 0, 0),
  ('de000000-0000-4000-8000-000000000003', 'DEMO-LD-003-FREE-WINE', 'Free', 'Wine', 3, 2, 0, 1),
  ('de000000-0000-4000-8000-000000000003', 'DEMO-LD-003-FREE-GOLD', 'Free', 'Gold', 5, 0, 0, 5),
  ('de000000-0000-4000-8000-000000000004', 'DEMO-LD-004-S-BLUE', 'S', 'Blue', 1, 1, 0, 0),
  ('de000000-0000-4000-8000-000000000004', 'DEMO-LD-004-M-BLUE', 'M', 'Blue', 2, 0, 2, 0),
  ('de000000-0000-4000-8000-000000000005', 'DEMO-GN-001-38-CHARCOAL', '38', 'Charcoal', 1, 1, 0, 0),
  ('de000000-0000-4000-8000-000000000005', 'DEMO-GN-001-40-CHARCOAL', '40', 'Charcoal', 2, 2, 0, 0),
  ('de000000-0000-4000-8000-000000000006', 'DEMO-GN-002-M-WHITE', 'M', 'White', 8, 8, 0, 0),
  ('de000000-0000-4000-8000-000000000006', 'DEMO-GN-002-L-WHITE', 'L', 'White', 7, 7, 0, 0),
  ('de000000-0000-4000-8000-000000000006', 'DEMO-GN-002-M-SKY', 'M', 'Sky', 6, 6, 0, 0),
  ('de000000-0000-4000-8000-000000000007', 'DEMO-GN-003-L-OLIVE', 'L', 'Olive', 4, 4, 0, 0),
  ('de000000-0000-4000-8000-000000000007', 'DEMO-GN-003-XL-OLIVE', 'XL', 'Olive', 3, 3, 0, 0),
  ('de000000-0000-4000-8000-000000000008', 'DEMO-GN-004-M-BEIGE', 'M', 'Beige', 5, 5, 0, 0),
  ('de000000-0000-4000-8000-000000000008', 'DEMO-GN-004-L-BEIGE', 'L', 'Beige', 3, 0, 0, 3),
  ('de000000-0000-4000-8000-000000000009', 'DEMO-KD-001-4-5Y-NAVY', '4-5Y', 'Navy', 6, 6, 0, 0),
  ('de000000-0000-4000-8000-000000000009', 'DEMO-KD-001-6-7Y-NAVY', '6-7Y', 'Navy', 4, 4, 0, 0),
  ('de000000-0000-4000-8000-000000000010', 'DEMO-KD-002-2-3Y-PINK', '2-3Y', 'Pink', 3, 3, 0, 0),
  ('de000000-0000-4000-8000-000000000010', 'DEMO-KD-002-4-5Y-YELLOW', '4-5Y', 'Yellow', 2, 2, 0, 0),
  ('de000000-0000-4000-8000-000000000011', 'DEMO-KD-003-3-4Y-BLUE', '3-4Y', 'Blue', 1, 1, 0, 0),
  ('de000000-0000-4000-8000-000000000011', 'DEMO-KD-003-5-6Y-BLUE', '5-6Y', 'Blue', 1, 0, 0, 1),
  ('de000000-0000-4000-8000-000000000012', 'DEMO-KD-004-6-7Y-GOLD', '6-7Y', 'Gold', 0, 0, 0, 0),
  ('de000000-0000-4000-8000-000000000012', 'DEMO-KD-004-8-9Y-GOLD', '8-9Y', 'Gold', 0, 0, 0, 0)
ON CONFLICT (variant_sku) DO NOTHING;

INSERT INTO public.product_media (product_id, media_type, media_url, display_order, is_primary)
SELECT v.product_id, 'image', v.url, 0, true
FROM (
  VALUES
    ('de000000-0000-4000-8000-000000000001'::uuid, 'https://images.pexels.com/photos/7920055/pexels-photo-7920055.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000002'::uuid, 'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000003'::uuid, 'https://images.pexels.com/photos/36747092/pexels-photo-36747092.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000004'::uuid, 'https://images.pexels.com/photos/32309983/pexels-photo-32309983.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000005'::uuid, 'https://images.pexels.com/photos/6765639/pexels-photo-6765639.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000006'::uuid, 'https://images.pexels.com/photos/7301566/pexels-photo-7301566.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000007'::uuid, 'https://images.pexels.com/photos/6429760/pexels-photo-6429760.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000008'::uuid, 'https://images.pexels.com/photos/16069735/pexels-photo-16069735.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000009'::uuid, 'https://images.pexels.com/photos/30690921/pexels-photo-30690921.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000010'::uuid, 'https://images.pexels.com/photos/38778561/pexels-photo-38778561.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000011'::uuid, 'https://images.pexels.com/photos/1620759/pexels-photo-1620759.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
    ('de000000-0000-4000-8000-000000000012'::uuid, 'https://images.pexels.com/photos/40061319/pexels-photo-40061319.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
) AS v(product_id, url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_media m WHERE m.product_id = v.product_id AND m.media_url = v.url
);
