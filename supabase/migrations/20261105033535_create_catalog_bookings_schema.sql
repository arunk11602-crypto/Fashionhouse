/*
# Create catalog, stock, booking and admin schema

## Plain-English summary
Sets up everything the Fashion House shop needs to store its clothes, their stock, customer booking requests and the shop owner's admin tools.

## 1. New tables
- admin_users: shop owner and staff accounts (linked to sign-in accounts). Only admins can read or change the shop data.
- categories: main categories (e.g. Ethnic Wear) and sub-categories (e.g. Sarees) using parent_id.
- products: one row per clothing item with SKU, names, descriptions, category, sub-category, stock type, collection, customer category, sale type, fabric, brand, prices, discount percentage (calculated), status, image URLs, video URL, publish flag, created and updated dates.
- product_variants: one row per size and colour of a product. Each variant has its own total, available, booked and sold quantities.
- stock_history: a log of every stock movement per variant.
- bookings: customer booking requests with a short booking code. Status starts as pending until the owner confirms.
- booking_items: the products and quantities inside each booking, with the price at the time of booking.
- flash_news: headline messages for the scrolling news ticker.
- notifications: alerts for the owner (e.g. new booking).
- website_settings: key and value settings for the website.
- activity_logs: a record of important actions.

## 2. Functions
- set_updated_at: keeps updated dates current automatically.
- is_admin: checks whether the signed-in user is an admin.
- create_booking: the only way customers can reserve stock. It checks phone, name, quantities and live stock, reduces available stock, increases booked stock, and records history, booking items and a notification in one step. Prices are read from the database, never from the browser.
- get_bookings_by_codes: returns the booking status and items for the booking codes a customer holds. Customer phone numbers are never returned.

## 3. Security
- Row level security is enabled on every table.
- Visitors (anon role) can only READ published products, their variants, active categories, active flash news and website settings.
- Visitors cannot read bookings, booking items, stock history, notifications, activity logs or admin records directly.
- Visitors can make bookings only through create_booking.
- Admins (signed-in users listed in admin_users) can manage catalog data and read and update bookings and notifications.

## 4. Important notes
1. Quantities are stored with a check that total = available + booked + sold, so stock can never drift.
2. Discount percentage is calculated automatically from the original and sale prices.
3. Prices, names and stock are validated on the server.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  name_hi text,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  name_hi text,
  short_description text,
  full_description text,
  category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  sub_category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  stock_type text NOT NULL CHECK (stock_type IN ('new', 'old')),
  collection text NOT NULL CHECK (collection IN ('premium', 'simple', 'regular')),
  customer_category text NOT NULL CHECK (customer_category IN ('kids', 'ladies', 'gents', 'unisex')),
  sale_type text NOT NULL DEFAULT 'normal' CHECK (sale_type IN ('normal', 'discount', 'final')),
  fabric text,
  brand text,
  original_price numeric(10, 2) NOT NULL CHECK (original_price >= 0),
  sale_price numeric(10, 2) CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= original_price)),
  discount_percentage integer GENERATED ALWAYS AS (
    CASE WHEN sale_price IS NOT NULL AND original_price > 0
      THEN round((original_price - sale_price) * 100 / original_price)::integer
    END
  ) STORED,
  status text NOT NULL DEFAULT 'auto' CHECK (status IN ('auto', 'coming_soon', 'sold_out', 'final_pieces')),
  image_urls text[] NOT NULL DEFAULT '{}',
  video_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size text NOT NULL,
  colour text NOT NULL,
  total_quantity integer NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
  available_quantity integer NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  booked_quantity integer NOT NULL DEFAULT 0 CHECK (booked_quantity >= 0),
  sold_quantity integer NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, size, colour),
  CHECK (total_quantity = available_quantity + booked_quantity + sold_quantity)
);

CREATE TABLE IF NOT EXISTS stock_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  change_type text NOT NULL CHECK (change_type IN ('initial', 'restock', 'adjustment', 'booking', 'booking_cancelled', 'sale')),
  quantity_change integer NOT NULL,
  available_after integer NOT NULL CHECK (available_after >= 0),
  note text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flash_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  text_hi text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'booking',
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS website_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_variant ON stock_history(variant_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_variant ON booking_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_variants_updated_at ON product_variants;
CREATE TRIGGER trg_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_customer_name text,
  p_customer_phone text,
  p_note text,
  p_items jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id uuid;
  v_code text;
  v_item jsonb;
  v_qty integer;
  v_variant product_variants%ROWTYPE;
  v_product products%ROWTYPE;
  v_name text := trim(coalesce(p_customer_name, ''));
  v_phone text := coalesce(p_customer_phone, '');
BEGIN
  IF length(v_name) = 0 OR length(v_name) > 100 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF v_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'invalid_items';
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO bookings (booking_code, customer_name, customer_phone, note)
  VALUES (v_code, v_name, v_phone, nullif(trim(coalesce(p_note, '')), ''))
  RETURNING id INTO v_booking_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::integer;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 10 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;

    SELECT * INTO v_variant FROM product_variants
    WHERE id = (v_item->>'variant_id')::uuid
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'variant_not_found';
    END IF;

    SELECT * INTO v_product FROM products WHERE id = v_variant.product_id;
    IF NOT v_product.is_published OR v_product.status = 'coming_soon' THEN
      RAISE EXCEPTION 'variant_not_bookable';
    END IF;
    IF v_variant.available_quantity < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;

    UPDATE product_variants
    SET available_quantity = available_quantity - v_qty,
        booked_quantity = booked_quantity + v_qty
    WHERE id = v_variant.id;

    INSERT INTO booking_items (booking_id, variant_id, product_id, quantity, unit_price)
    VALUES (v_booking_id, v_variant.id, v_product.id, v_qty,
            coalesce(v_product.sale_price, v_product.original_price));

    INSERT INTO stock_history (product_id, variant_id, change_type, quantity_change, available_after, note)
    VALUES (v_product.id, v_variant.id, 'booking', -v_qty, v_variant.available_quantity - v_qty,
            'Booking ' || v_code);
  END LOOP;

  INSERT INTO notifications (title, body, type, booking_id)
  VALUES ('New booking request', 'Booking ' || v_code || ' from ' || v_name, 'booking', v_booking_id);

  INSERT INTO activity_logs (action, entity_type, entity_id, details)
  VALUES ('booking_created', 'booking', v_booking_id::text, jsonb_build_object('code', v_code));

  RETURN v_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_booking(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(text, text, text, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_bookings_by_codes(p_codes text[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(booking_row ORDER BY booking_row->>'created_at' DESC), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'booking_code', b.booking_code,
      'status', b.status,
      'created_at', b.created_at,
      'items', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'quantity', bi.quantity,
          'unit_price', bi.unit_price,
          'size', pv.size,
          'colour', pv.colour,
          'product_name', p.name,
          'product_name_hi', p.name_hi,
          'image', p.image_urls[1]
        ))
        FROM booking_items bi
        JOIN product_variants pv ON pv.id = bi.variant_id
        JOIN products p ON p.id = bi.product_id
        WHERE bi.booking_id = b.id
      ), '[]'::jsonb)
    ) AS booking_row
    FROM bookings b
    WHERE b.booking_code = ANY (p_codes[1:50])
  ) rows;
$$;

REVOKE EXECUTE ON FUNCTION public.get_bookings_by_codes(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bookings_by_codes(text[]) TO anon, authenticated;

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON categories, products, product_variants, flash_news, website_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON categories, products, product_variants, flash_news, website_settings TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT, UPDATE ON bookings, notifications TO authenticated;
GRANT SELECT ON booking_items, stock_history, activity_logs TO authenticated;

DROP POLICY IF EXISTS "admin_users_select_own" ON admin_users;
CREATE POLICY "admin_users_select_own" ON admin_users FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "categories_public_select" ON categories;
CREATE POLICY "categories_public_select" ON categories FOR SELECT
  TO anon, authenticated USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
CREATE POLICY "categories_admin_insert" ON categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "products_public_select" ON products;
CREATE POLICY "products_public_select" ON products FOR SELECT
  TO anon, authenticated USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS "products_admin_insert" ON products;
CREATE POLICY "products_admin_insert" ON products FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update" ON products FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "products_admin_delete" ON products;
CREATE POLICY "products_admin_delete" ON products FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "variants_public_select" ON product_variants;
CREATE POLICY "variants_public_select" ON product_variants FOR SELECT
  TO anon, authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM products p WHERE p.id = product_variants.product_id AND p.is_published
    )
  );
DROP POLICY IF EXISTS "variants_admin_insert" ON product_variants;
CREATE POLICY "variants_admin_insert" ON product_variants FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "variants_admin_update" ON product_variants;
CREATE POLICY "variants_admin_update" ON product_variants FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "variants_admin_delete" ON product_variants;
CREATE POLICY "variants_admin_delete" ON product_variants FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "flash_news_public_select" ON flash_news;
CREATE POLICY "flash_news_public_select" ON flash_news FOR SELECT
  TO anon, authenticated USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "flash_news_admin_insert" ON flash_news;
CREATE POLICY "flash_news_admin_insert" ON flash_news FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "flash_news_admin_update" ON flash_news;
CREATE POLICY "flash_news_admin_update" ON flash_news FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "flash_news_admin_delete" ON flash_news;
CREATE POLICY "flash_news_admin_delete" ON flash_news FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "website_settings_public_select" ON website_settings;
CREATE POLICY "website_settings_public_select" ON website_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "website_settings_admin_insert" ON website_settings;
CREATE POLICY "website_settings_admin_insert" ON website_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "website_settings_admin_update" ON website_settings;
CREATE POLICY "website_settings_admin_update" ON website_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "website_settings_admin_delete" ON website_settings;
CREATE POLICY "website_settings_admin_delete" ON website_settings FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "stock_history_admin_select" ON stock_history;
CREATE POLICY "stock_history_admin_select" ON stock_history FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "bookings_admin_select" ON bookings;
CREATE POLICY "bookings_admin_select" ON bookings FOR SELECT
  TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "bookings_admin_update" ON bookings;
CREATE POLICY "bookings_admin_update" ON bookings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "booking_items_admin_select" ON booking_items;
CREATE POLICY "booking_items_admin_select" ON booking_items FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "notifications_admin_select" ON notifications;
CREATE POLICY "notifications_admin_select" ON notifications FOR SELECT
  TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "notifications_admin_update" ON notifications;
CREATE POLICY "notifications_admin_update" ON notifications FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "activity_logs_admin_select" ON activity_logs;
CREATE POLICY "activity_logs_admin_select" ON activity_logs FOR SELECT
  TO authenticated USING (public.is_admin());
