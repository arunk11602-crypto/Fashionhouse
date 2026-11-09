/*
# Catalog upgrade: profiles, roles, stock rules and product rules

Plain-English summary
This migration builds on the shop's existing product, variant, category and flash news tables. Existing data and column names are kept. New columns are added only where the shop did not already have an equivalent.

1. New Tables
- profiles: one row per sign-up. Holds full name, phone, role (admin or customer) and an active flag. A trigger creates the row automatically when someone signs up.
- product_media is created in a later migration.

2. Modified Tables
- categories: adds description, image_url and updated_at.
- products: adds slug, pattern, season, clothing_type, is_featured, is_archived, is_demo, created_by, product-level stock totals (total, available, booked, sold) and minimum/maximum booking quantity. Stock status values are changed to the shop's wording (In Stock, Low Stock, Out of Stock, Booked, Sold Out, Coming Soon, Final Pieces). Existing products become In Stock and are then recalculated from their stock.
- product_variants: adds variant_sku (unique), status and a computed status.
- flash_news: adds created_by.

3. Automatic rules (database triggers)
- updated_at is refreshed on every edit.
- discount_percentage is calculated from original and sale price, rounded to a whole percent.
- Product stock totals are summed from its variants.
- Status is In Stock above 5 pieces, Low Stock for 1 to 5 pieces, Out of Stock at 0. Coming Soon, Sold Out, Booked and Final Pieces are kept as set by the admin.
- Stock changes made by an admin are written to the stock history.

4. Security
- Admin is now decided by profiles.role = 'admin' AND is_active. The old admin list table is kept but no longer grants access.
- Customers can read and update only their own profile name and phone. Their role cannot be changed through the app.
- Public visitors see only published, non-archived products, their variants and active categories. They cannot read profiles or stock history.

5. Important notes
- Stock history no longer open to anonymous visitors.
- Quantities cannot go below zero, and booking limits must be at least 1 with maximum not below minimum.
- Migration is re-runnable: every step checks whether it has already been applied.
*/

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'customer'))
);

INSERT INTO public.profiles (id, full_name)
SELECT u.id, NULLIF(btrim(coalesce(u.raw_user_meta_data->>'full_name', '')), '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, role)
SELECT au.user_id, 'admin'
FROM public.admin_users au
ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NULLIF(btrim(coalesce(NEW.raw_user_meta_data->>'full_name', '')), ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  TO authenticated USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Products: new columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pattern text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS season text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS clothing_type text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS total_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS booked_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS minimum_booking_quantity integer NOT NULL DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS maximum_booking_quantity integer NOT NULL DEFAULT 10;

UPDATE public.products
SET slug = btrim(lower(regexp_replace(sku || '-' || name, '[^a-zA-Z0-9]+', '-', 'g')), '-')
WHERE slug IS NULL;

ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);

-- Shop status wording (existing "auto" means computed from stock)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
UPDATE public.products SET status = CASE status
  WHEN 'auto' THEN 'In Stock'
  WHEN 'coming_soon' THEN 'Coming Soon'
  WHEN 'sold_out' THEN 'Sold Out'
  WHEN 'final_pieces' THEN 'Final Pieces'
  ELSE status
END
WHERE status IN ('auto', 'coming_soon', 'sold_out', 'final_pieces');
ALTER TABLE public.products ALTER COLUMN status SET DEFAULT 'In Stock';
ALTER TABLE public.products ADD CONSTRAINT products_status_check CHECK (
  status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Booked', 'Sold Out', 'Coming Soon', 'Final Pieces')
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_quantities_non_negative') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_quantities_non_negative CHECK (
      total_quantity >= 0 AND available_quantity >= 0 AND booked_quantity >= 0 AND sold_quantity >= 0
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_booking_limits_check') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_booking_limits_check CHECK (
      minimum_booking_quantity >= 1 AND maximum_booking_quantity >= minimum_booking_quantity
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_discount_range_check') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_discount_range_check CHECK (
      discount_percentage IS NULL OR discount_percentage BETWEEN 0 AND 100
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.compute_stock_status(p_status text, p_available integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_status IN ('Coming Soon', 'Sold Out', 'Final Pieces', 'Booked') THEN p_status
    WHEN p_available <= 0 THEN 'Out of Stock'
    WHEN p_available <= 5 THEN 'Low Stock'
    ELSE 'In Stock'
  END;
$$;

CREATE OR REPLACE FUNCTION public.products_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.status := public.compute_stock_status(NEW.status, NEW.available_quantity);
  NEW.discount_percentage := CASE
    WHEN NEW.original_price > 0 AND NEW.sale_price IS NOT NULL
      THEN round(((NEW.original_price - NEW.sale_price) / NEW.original_price) * 100)::integer
    ELSE 0
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_before_write ON public.products;
CREATE TRIGGER products_before_write BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_before_write();

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Product variants: new columns and rules
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS variant_sku text;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'In Stock';

UPDATE public.product_variants v
SET variant_sku = p.sku || '-' || btrim(regexp_replace(upper(v.size || '-' || v.colour), '[^A-Z0-9]+', '-', 'g'), '-')
FROM public.products p
WHERE p.id = v.product_id AND v.variant_sku IS NULL;

ALTER TABLE public.product_variants ALTER COLUMN variant_sku SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_variant_sku_key ON public.product_variants (variant_sku);

ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_status_check;
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_status_check CHECK (
  status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Booked', 'Sold Out', 'Coming Soon', 'Final Pieces')
);

CREATE OR REPLACE FUNCTION public.product_variants_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.status := public.compute_stock_status(NEW.status, NEW.available_quantity);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_variants_before_write ON public.product_variants;
CREATE TRIGGER product_variants_before_write BEFORE INSERT OR UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.product_variants_before_write();

DROP TRIGGER IF EXISTS product_variants_set_updated_at ON public.product_variants;
CREATE TRIGGER product_variants_set_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid := coalesce(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE public.products p
  SET total_quantity = s.total_quantity,
      available_quantity = s.available_quantity,
      booked_quantity = s.booked_quantity,
      sold_quantity = s.sold_quantity
  FROM (
    SELECT
      coalesce(sum(v.total_quantity), 0)::integer AS total_quantity,
      coalesce(sum(v.available_quantity), 0)::integer AS available_quantity,
      coalesce(sum(v.booked_quantity), 0)::integer AS booked_quantity,
      coalesce(sum(v.sold_quantity), 0)::integer AS sold_quantity
    FROM public.product_variants v
    WHERE v.product_id = v_product_id
  ) s
  WHERE p.id = v_product_id;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_product_stock() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS product_variants_sync_product_stock ON public.product_variants;
CREATE TRIGGER product_variants_sync_product_stock
  AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock();

CREATE OR REPLACE FUNCTION public.record_variant_stock_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.stock_history (product_id, variant_id, change_type, quantity_change, available_after, note, actor_id)
  VALUES (
    NEW.product_id,
    NEW.id,
    'manual_adjustment',
    NEW.available_quantity - OLD.available_quantity,
    NEW.available_quantity,
    'Stock changed by admin',
    auth.uid()
  );
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_variant_stock_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS product_variants_record_stock_change ON public.product_variants;
CREATE TRIGGER product_variants_record_stock_change
  AFTER UPDATE OF available_quantity ON public.product_variants
  FOR EACH ROW
  WHEN (OLD.available_quantity IS DISTINCT FROM NEW.available_quantity)
  EXECUTE FUNCTION public.record_variant_stock_change();

-- Recalculate product stock totals and statuses from the variants
UPDATE public.products p
SET total_quantity = s.total_quantity,
    available_quantity = s.available_quantity,
    booked_quantity = s.booked_quantity,
    sold_quantity = s.sold_quantity
FROM (
  SELECT
    pr.id,
    coalesce(sum(v.total_quantity), 0)::integer AS total_quantity,
    coalesce(sum(v.available_quantity), 0)::integer AS available_quantity,
    coalesce(sum(v.booked_quantity), 0)::integer AS booked_quantity,
    coalesce(sum(v.sold_quantity), 0)::integer AS sold_quantity
  FROM public.products pr
  LEFT JOIN public.product_variants v ON v.product_id = pr.id
  GROUP BY pr.id
) s
WHERE s.id = p.id;

UPDATE public.product_variants
SET status = public.compute_stock_status(status, available_quantity);

-- 5. Flash news
ALTER TABLE public.flash_news ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS flash_news_set_updated_at ON public.flash_news;
CREATE TRIGGER flash_news_set_updated_at BEFORE UPDATE ON public.flash_news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Indexes
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_stock_type_idx ON public.products (stock_type);
CREATE INDEX IF NOT EXISTS products_customer_category_idx ON public.products (customer_category);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products (status);
CREATE INDEX IF NOT EXISTS products_is_published_idx ON public.products (is_published);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products (created_at);
CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS stock_history_product_id_idx ON public.stock_history (product_id);
CREATE INDEX IF NOT EXISTS flash_news_is_active_idx ON public.flash_news (is_active);

-- 7. Public visibility rules: published and not archived
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select ON public.products FOR SELECT
  TO anon, authenticated USING ((is_published AND NOT is_archived) OR public.is_admin());

DROP POLICY IF EXISTS variants_public_select ON public.product_variants;
CREATE POLICY variants_public_select ON public.product_variants FOR SELECT
  TO anon, authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id AND p.is_published AND NOT p.is_archived
    )
  );

REVOKE SELECT ON public.stock_history FROM anon;
REVOKE SELECT ON public.admin_users FROM anon;
