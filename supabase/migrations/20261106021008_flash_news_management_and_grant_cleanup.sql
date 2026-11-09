/*
# Flash news scheduling, pinning and colours; tighter table permissions

## Plain-English summary
Flash news can now have a start and end date, can be pinned to the front of the ticker, has chosen text and background colours, and can link to a page. Customers only see news that is active and inside its date range. Public visitors also lose write permissions they never needed.

## 1. flash_news changes
- starts_at, ends_at: optional date window. Empty means no limit.
- is_pinned: pinned news shows first.
- text_color, background_color: hex colours with a default of white text on maroon.
- link_url: optional http or https link.

## 2. Security
- The public read rule now also checks the date window.
- Visitors (anon role) lose INSERT, UPDATE and DELETE on every table. Admin writes still go through signed-in admin checks, and visitors never had a write rule.
- Signed-in users lose write permission on tables where only server functions write (bookings, booking items, stock history, notifications, activity logs, admin list).
*/

ALTER TABLE flash_news ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE flash_news ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE flash_news ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE flash_news ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT '#ffffff';
ALTER TABLE flash_news ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#7a1f2b';
ALTER TABLE flash_news ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE flash_news ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flash_news_colors_check') THEN
    ALTER TABLE flash_news ADD CONSTRAINT flash_news_colors_check
      CHECK (text_color ~ '^#[0-9a-fA-F]{6}$' AND background_color ~ '^#[0-9a-fA-F]{6}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flash_news_link_check') THEN
    ALTER TABLE flash_news ADD CONSTRAINT flash_news_link_check
      CHECK (link_url IS NULL OR link_url ~ '^https?://');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'flash_news_dates_check') THEN
    ALTER TABLE flash_news ADD CONSTRAINT flash_news_dates_check
      CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at);
  END IF;
END $$;

DROP POLICY IF EXISTS flash_news_public_select ON flash_news;
CREATE POLICY flash_news_public_select ON flash_news FOR SELECT
  TO anon, authenticated
  USING (
    is_admin()
    OR (
      is_active
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at > now())
    )
  );

REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

REVOKE INSERT, UPDATE, DELETE ON bookings, booking_items, stock_history, notifications, activity_logs, admin_users FROM authenticated;
GRANT UPDATE ON bookings, notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON flash_news, website_settings, products, product_variants, categories TO authenticated;
GRANT SELECT ON admin_users, bookings, booking_items, stock_history, notifications, activity_logs TO authenticated;
