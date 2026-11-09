/*
# Seed categories, products, variant stock and flash news

## Plain-English summary
Loads the shop's starting catalogue into the database: the main and sub-categories, 20 clothing products (including one coming soon), their size and colour stock, and the four flash news messages for the ticker.

## 1. Data added
- categories: 4 main categories and 11 sub-categories.
- products: 20 items with SKUs, names in English and Hindi, descriptions, prices, discounts, stock type, collection, customer category, sale type and images.
- product_variants: one row per size and colour, each with its own stock counts.
- flash_news: 4 ticker messages.

## 2. Safety
- Every insert is skipped if the same record already exists, so this migration can be re-run safely.
- No existing data is changed or removed.
*/

INSERT INTO categories (name, name_hi, slug, sort_order) VALUES
  ('Ethnic Wear', 'एथनिक वियर', 'ethnic-wear', 1),
  ('Formal Wear', 'फॉर्मल वियर', 'formal-wear', 2),
  ('Western Wear', 'वेस्टर्न वियर', 'western-wear', 3),
  ('Winter Wear', 'विंटर वियर', 'winter-wear', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, name_hi, slug, sort_order)
SELECT p.id, v.name, v.name_hi, v.slug, v.sort_order
FROM (VALUES
  ('ethnic-wear', 'Sarees', 'साड़ियाँ', 'saree', 1),
  ('ethnic-wear', 'Kurta Sets', 'कुर्ता सेट', 'kurta-set', 2),
  ('ethnic-wear', 'Anarkali', 'अनारकली', 'anarkali', 3),
  ('ethnic-wear', 'Sherwani', 'शेरवानी', 'sherwani', 4),
  ('formal-wear', 'Suits', 'सूट', 'suit', 1),
  ('formal-wear', 'Blazers', 'ब्लेज़र', 'blazer', 2),
  ('western-wear', 'Dresses', 'ड्रेस', 'dress', 1),
  ('western-wear', 'Tops', 'टॉप', 'top', 2),
  ('western-wear', 'Jeans', 'जींस', 'jeans', 3),
  ('winter-wear', 'Sweaters', 'स्वेटर', 'sweater', 1),
  ('winter-wear', 'Jackets', 'जैकेट', 'jacket', 2)
) AS v(parent_slug, name, name_hi, slug, sort_order)
JOIN categories p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (sku, name, name_hi, short_description, full_description, category_id, sub_category_id,
  stock_type, collection, customer_category, sale_type, fabric, brand, original_price, sale_price, status, image_urls)
SELECT v.sku, v.name, v.name_hi, v.short_desc, v.full_desc, mc.id, sc.id,
  v.stock_type, v.collection, v.customer_category, v.sale_type, v.fabric, v.brand,
  v.original_price, v.sale_price, v.status, ARRAY[v.image_url]
FROM (VALUES
  ('FH-EW-001', 'Royal Banarasi Silk Saree', 'रॉयल बनारसी सिल्क साड़ी', 'Rich zari woven Banarasi silk saree for weddings and festivals.', 'A handwoven pure silk Banarasi saree with traditional zari motifs and a rich pallu. Comes with an unstitched blouse piece.', 'ethnic-wear', 'saree', 'new', 'premium', 'ladies', 'normal', 'Pure Silk', 'Benarasi Weaves', 6499::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/5439054/pexels-photo-5439054.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-EW-002', 'Kanjivaram Gold Border Saree', 'कांजीवरम गोल्ड बॉर्डर साड़ी', 'Classic Kanjivaram silk saree with a broad gold border.', 'Temple border Kanjivaram silk saree with a gold zari finish. Ideal for bridal and festive occasions.', 'ethnic-wear', 'saree', 'new', 'premium', 'ladies', 'discount', 'Kanjivaram Silk', 'Kanchi Classics', 8200::numeric, 6900::numeric, 'auto', 'https://images.pexels.com/photos/5447529/pexels-photo-5447529.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-EW-003', 'Marigold Festive Saree', 'मैरीगोल्ड फेस्टिव साड़ी', 'Bright festive art silk saree with a soft drape.', 'Lightweight art silk saree in a marigold shade, perfect for Diwali and family functions.', 'ethnic-wear', 'saree', 'new', 'premium', 'ladies', 'normal', 'Art Silk', 'Festive Edit', 4800::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/28943474/pexels-photo-28943474.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-EW-004', 'Printed Chiffon Saree', 'प्रिंटेड शिफॉन साड़ी', 'Light printed chiffon saree for everyday elegance.', 'Soft chiffon saree with a bold printed design. Easy to drape and comfortable all day.', 'ethnic-wear', 'saree', 'new', 'simple', 'ladies', 'discount', 'Chiffon', 'Daily Drape', 1299::numeric, 999::numeric, 'auto', 'https://images.pexels.com/photos/27918892/pexels-photo-27918892.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-EW-005', 'Cotton Printed Kurta Set', 'कॉटन प्रिंटेड कुर्ता सेट', 'Breathable cotton kurta set with matching bottoms.', 'Soft cotton kurta with printed yoke and matching pants and dupatta-ready design.', 'ethnic-wear', 'kurta-set', 'new', 'simple', 'ladies', 'normal', 'Cotton', 'Daily Drape', 1450::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/38526708/pexels-photo-38526708.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-EW-006', 'Blue Festive Saree', 'ब्लू फेस्टिव साड़ी', 'Elegant blue georgette saree with a fine border.', 'Flowing georgette saree in a deep blue shade with a fine contrast border.', 'ethnic-wear', 'saree', 'old', 'simple', 'ladies', 'normal', 'Georgette', 'Festive Edit', 1500::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/38966362/pexels-photo-38966362.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-EW-007', 'Embroidered Red Anarkali', 'एम्ब्रॉयडर्ड रेड अनारकली', 'Red anarkali with hand embroidery and flared hem.', 'Silk blend anarkali with thread embroidery on the yoke and sleeves. Comes with matching churidar.', 'ethnic-wear', 'anarkali', 'old', 'premium', 'ladies', 'discount', 'Silk Blend', 'Royal Threads', 3200::numeric, 2500::numeric, 'auto', 'https://images.pexels.com/photos/32603187/pexels-photo-32603187.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-EW-008', 'Ivory Wedding Sherwani', 'आइवरी वेडिंग शेरवानी', 'Ivory brocade sherwani with a classic cut.', 'Richly textured brocade sherwani with a fitted silhouette. Ideal for weddings and receptions.', 'ethnic-wear', 'sherwani', 'new', 'premium', 'gents', 'normal', 'Brocade', 'Royal Threads', 9500::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/38215118/pexels-photo-38215118.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-FM-009', 'Navy Pinstripe Suit', 'नेवी पिनस्ट्राइप सूट', 'Two-piece navy pinstripe suit for office and events.', 'Wool blend two-piece suit with a tailored fit, pinstripe pattern and two-button closure.', 'formal-wear', 'suit', 'new', 'premium', 'gents', 'normal', 'Wool Blend', 'Urban Tailor', 7999::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/30916977/pexels-photo-30916977.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-FM-010', 'Black Classic Suit', 'ब्लैक क्लासिक सूट', 'Timeless black suit in Italian wool.', 'Premium Italian wool suit with a sharp lapel and a clean, modern cut.', 'formal-wear', 'suit', 'new', 'premium', 'gents', 'discount', 'Italian Wool', 'Urban Tailor', 8999::numeric, 7499::numeric, 'auto', 'https://images.pexels.com/photos/6765656/pexels-photo-6765656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-FM-011', 'Blue Business Blazer', 'ब्लू बिज़नेस ब्लेज़र', 'Structured blue blazer for everyday office wear.', 'Polyester blend blazer with a structured shoulder and two inner pockets.', 'formal-wear', 'blazer', 'old', 'simple', 'gents', 'normal', 'Polyester Blend', 'Urban Tailor', 2200::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/37496313/pexels-photo-37496313.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WN-012', 'Casual Button Jacket', 'कैज़ुअल बटन जैकेट', 'Olive cotton twill jacket for relaxed days out.', 'Lightweight cotton twill jacket with button closure and patch pockets.', 'winter-wear', 'jacket', 'old', 'simple', 'gents', 'discount', 'Cotton Twill', 'Street Lines', 1100::numeric, 890::numeric, 'auto', 'https://images.pexels.com/photos/8832159/pexels-photo-8832159.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WW-013', 'Dark Denim Jeans', 'डार्क डेनिम जींस', 'Dark wash straight-fit denim jeans.', 'Sturdy denim jeans in a dark wash with a straight leg and everyday comfort.', 'western-wear', 'jeans', 'old', 'simple', 'gents', 'final', 'Denim', 'Street Lines', 999::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/31769271/pexels-photo-31769271.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WN-014', 'Rainbow Knit Sweater', 'रेनबो निट स्वेटर', 'Warm woollen knit sweater in cheerful colours.', 'Soft woollen knit with a rainbow stripe pattern. Keeps little ones warm through winter.', 'winter-wear', 'sweater', 'new', 'simple', 'kids', 'normal', 'Woollen Knit', 'Little Stitch', 650::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/14937556/pexels-photo-14937556.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WW-015', 'Yellow Cotton Play Set', 'येलो कॉटन प्ले सेट', 'Bright yellow cotton play set for active kids.', 'Soft cotton top and shorts set, easy to wash and built for play.', 'western-wear', 'top', 'new', 'simple', 'kids', 'discount', 'Soft Cotton', 'Little Stitch', 550::numeric, 449::numeric, 'auto', 'https://images.pexels.com/photos/18001508/pexels-photo-18001508.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WW-016', 'Kids Party Dress', 'किड्स पार्टी ड्रेस', 'Satin party dress for birthdays and celebrations.', 'Satin party dress with a soft bow at the waist and a comfortable lining.', 'western-wear', 'dress', 'new', 'premium', 'kids', 'normal', 'Satin', 'Little Stitch', 1200::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/8084066/pexels-photo-8084066.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WN-017', 'Kids Denim Jacket', 'किड्स डेनिम जैकेट', 'Classic denim jacket for kids.', 'Durable denim jacket with snap buttons and a relaxed fit for everyday wear.', 'winter-wear', 'jacket', 'old', 'simple', 'kids', 'normal', 'Denim', 'Street Lines', 700::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/40288520/pexels-photo-40288520.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WW-018', 'Everyday Cotton Frock', 'एवरीडे कॉटन फ्रॉक', 'Soft cotton frock for daily play.', 'Simple cotton frock with a comfortable fit. Last few pieces in stock.', 'western-wear', 'dress', 'old', 'simple', 'kids', 'final', 'Cotton', 'Little Stitch', 400::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/8083844/pexels-photo-8083844.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WW-019', 'Ladies Knit Top', 'लेडीज़ निट टॉप', 'Soft knit top for everyday comfort.', 'Lightweight cotton knit top with a relaxed fit. Final pieces available.', 'western-wear', 'top', 'old', 'simple', 'ladies', 'final', 'Knit Cotton', 'Daily Drape', 499::numeric, NULL::numeric, 'auto', 'https://images.pexels.com/photos/34854182/pexels-photo-34854182.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('FH-WN-020', 'Classic Wool Overcoat', 'क्लासिक वूल ओवरकोट', 'Tailored wool overcoat arriving soon.', 'A long tailored wool overcoat for the winter season. Arriving soon at Fashion House.', 'winter-wear', 'jacket', 'new', 'premium', 'gents', 'normal', 'Wool', 'Urban Tailor', 12500::numeric, NULL::numeric, 'coming_soon', 'https://images.pexels.com/photos/11739279/pexels-photo-11739279.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
) AS v(sku, name, name_hi, short_desc, full_desc, main_slug, sub_slug, stock_type, collection, customer_category, sale_type, fabric, brand, original_price, sale_price, status, image_url)
JOIN categories mc ON mc.slug = v.main_slug
JOIN categories sc ON sc.slug = v.sub_slug
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, size, colour, total_quantity, available_quantity)
SELECT p.id, v.size, v.colour, v.qty, v.qty
FROM (VALUES
  ('FH-EW-001', 'Free Size', 'Maroon', 4),
  ('FH-EW-001', 'Free Size', 'Gold', 2),
  ('FH-EW-002', 'Free Size', 'Red', 3),
  ('FH-EW-003', 'Free Size', 'Marigold', 3),
  ('FH-EW-004', 'Free Size', 'Multicolour', 5),
  ('FH-EW-005', 'S', 'Teal', 3),
  ('FH-EW-005', 'M', 'Teal', 3),
  ('FH-EW-005', 'L', 'Teal', 2),
  ('FH-EW-005', 'XL', 'Teal', 0),
  ('FH-EW-006', 'Free Size', 'Blue', 1),
  ('FH-EW-007', 'S', 'Red', 2),
  ('FH-EW-007', 'M', 'Red', 2),
  ('FH-EW-007', 'L', 'Red', 0),
  ('FH-EW-008', '40', 'Ivory', 1),
  ('FH-EW-008', '42', 'Ivory', 1),
  ('FH-EW-008', '44', 'Ivory', 0),
  ('FH-FM-009', '38', 'Navy', 2),
  ('FH-FM-009', '40', 'Navy', 2),
  ('FH-FM-009', '42', 'Navy', 1),
  ('FH-FM-009', '44', 'Navy', 1),
  ('FH-FM-009', '40', 'Charcoal', 2),
  ('FH-FM-010', '38', 'Black', 2),
  ('FH-FM-010', '40', 'Black', 2),
  ('FH-FM-010', '42', 'Black', 0),
  ('FH-FM-010', '44', 'Black', 1),
  ('FH-FM-011', '38', 'Blue', 2),
  ('FH-FM-011', '40', 'Blue', 1),
  ('FH-FM-011', '42', 'Blue', 0),
  ('FH-WN-012', 'M', 'Olive', 2),
  ('FH-WN-012', 'L', 'Olive', 2),
  ('FH-WN-012', 'XL', 'Olive', 1),
  ('FH-WW-013', '30', 'Dark Blue', 2),
  ('FH-WW-013', '32', 'Dark Blue', 1),
  ('FH-WW-013', '34', 'Dark Blue', 0),
  ('FH-WN-014', '2-3 Yrs', 'Multicolour', 3),
  ('FH-WN-014', '4-5 Yrs', 'Multicolour', 3),
  ('FH-WN-014', '6-7 Yrs', 'Multicolour', 2),
  ('FH-WW-015', '1-2 Yrs', 'Yellow', 3),
  ('FH-WW-015', '2-3 Yrs', 'Yellow', 2),
  ('FH-WW-015', '4-5 Yrs', 'Yellow', 2),
  ('FH-WW-016', '4-5 Yrs', 'Pink', 2),
  ('FH-WW-016', '6-7 Yrs', 'Pink', 2),
  ('FH-WW-016', '8-9 Yrs', 'Pink', 1),
  ('FH-WN-017', '6-7 Yrs', 'Blue', 2),
  ('FH-WN-017', '8-9 Yrs', 'Blue', 2),
  ('FH-WN-017', '10-11 Yrs', 'Blue', 1),
  ('FH-WW-018', '2-3 Yrs', 'Pink', 1),
  ('FH-WW-018', '4-5 Yrs', 'Pink', 0),
  ('FH-WW-019', 'S', 'Cream', 2),
  ('FH-WW-019', 'M', 'Cream', 2),
  ('FH-WW-019', 'L', 'Cream', 1),
  ('FH-WN-020', '40', 'Camel', 0),
  ('FH-WN-020', '42', 'Camel', 0)
) AS v(sku, size, colour, qty)
JOIN products p ON p.sku = v.sku
ON CONFLICT (product_id, size, colour) DO NOTHING;

INSERT INTO flash_news (text, text_hi, sort_order)
SELECT v.text, v.text_hi, v.sort_order
FROM (VALUES
  ('New arrivals are in: fresh silk sarees and festive wear', 'नए कपड़े आ गए हैं: ताज़ा सिल्क साड़ियाँ और त्योहारी कपड़े', 1),
  ('Discount Sale: special prices on selected pieces', 'डिस्काउंट सेल: चुनिंदा कपड़ों पर खास कीमतें', 2),
  ('Final Stock: limited pieces, book before they are gone', 'फाइनल स्टॉक: सीमित कपड़े, खत्म होने से पहले बुक करें', 3),
  ('Booking is a request only. The shop owner confirms it later', 'बुकिंग केवल अनुरोध है। दुकान मालिक बाद में पुष्टि करेंगे', 4)
) AS v(text, text_hi, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM flash_news);
